//! Runs the bundled Next.js server that the window shows: the `compooss-node`
//! sidecar (Node.js) with `server/desktop-entry.cjs` from the app resources.

use std::{
    collections::VecDeque,
    fs::File,
    io::Write,
    sync::{
        atomic::{AtomicBool, Ordering},
        Mutex,
    },
    time::Duration,
};

use tauri::{AppHandle, Manager, Url, WebviewWindow};
use tauri_plugin_dialog::{DialogExt, MessageDialogKind};
use tauri_plugin_shell::{
    process::{CommandChild, CommandEvent},
    ShellExt,
};

/// Never change this: the webview keeps saved connections (IndexedDB) per
/// origin, so a new port would lose them.
pub const PORT: u16 = 29017;

const STARTUP_TIMEOUT: Duration = Duration::from_secs(30);
/// Recent server output, shown when startup fails.
const LOG_TAIL_LINES: usize = 12;

/// Set when the app quits, so the server exiting isn't reported as a crash.
static STOPPING: AtomicBool = AtomicBool::new(false);
static READY: AtomicBool = AtomicBool::new(false);

struct Sidecar(Mutex<Option<CommandChild>>);

pub fn start(app: &AppHandle, window: &WebviewWindow) -> Result<(), Box<dyn std::error::Error>> {
    // Node mishandles Windows' \\?\ path prefix, which resource_dir() returns.
    let server_dir = dunce::simplified(&app.path().resource_dir()?).join("server");
    let log_dir = app.path().app_log_dir()?;
    std::fs::create_dir_all(&log_dir)?;
    let mut log = File::create(log_dir.join("server.log"))?;

    // Locks the server to this window for this launch (desktop.util.ts).
    let token = random_token()?;
    let (mut events, child) = app
        .shell()
        .sidecar("compooss-node")?
        .args(["desktop-entry.cjs"])
        .current_dir(server_dir)
        .envs([
            ("PORT", PORT.to_string()),
            ("HOSTNAME", "127.0.0.1".to_string()),
            ("NODE_ENV", "production".to_string()),
            ("NEXT_TELEMETRY_DISABLED", "1".to_string()),
            ("COMPOOSS_DESKTOP_TOKEN", token.clone()),
            // Login is for shared Docker installs; don't pick it up from the
            // user's environment.
            ("COMPOOSS_USERNAME", String::new()),
            ("COMPOOSS_PASSWORD", String::new()),
            ("NODE_OPTIONS", String::new()),
        ])
        .spawn()?;
    app.manage(Sidecar(Mutex::new(Some(child))));

    let timeout_app = app.clone();
    std::thread::spawn(move || {
        std::thread::sleep(STARTUP_TIMEOUT);
        if !READY.load(Ordering::SeqCst) {
            fail(
                &timeout_app,
                "The Compooss server took too long to start.",
                &[],
            );
        }
    });

    let app = app.clone();
    let window = window.clone();
    tauri::async_runtime::spawn(async move {
        let mut tail: VecDeque<String> = VecDeque::with_capacity(LOG_TAIL_LINES);
        while let Some(event) = events.recv().await {
            match event {
                CommandEvent::Stdout(line) | CommandEvent::Stderr(line) => {
                    let line = String::from_utf8_lossy(&line).trim_end().to_string();
                    let _ = writeln!(log, "{line}");
                    if tail.len() == LOG_TAIL_LINES {
                        tail.pop_front();
                    }
                    tail.push_back(line.clone());

                    if line.contains("__COMPOOSS_READY__") && !READY.swap(true, Ordering::SeqCst) {
                        let url = format!("http://127.0.0.1:{PORT}/__desktop?token={token}");
                        let _ = window.navigate(Url::parse(&url).expect("valid server URL"));
                    } else if let Some(code) = line.strip_prefix("__COMPOOSS_ERROR__ ") {
                        let message = if code == "EADDRINUSE" {
                            format!(
                                "Port {PORT} is already in use by another program. \
                                 Close it and open Compooss again."
                            )
                        } else {
                            format!("The Compooss server could not start ({code}).")
                        };
                        fail(&app, &message, tail.make_contiguous());
                    }
                }
                CommandEvent::Terminated(status) => {
                    let message = format!(
                        "The Compooss server stopped unexpectedly (exit code {}).",
                        status
                            .code
                            .map_or("unknown".to_string(), |code| code.to_string())
                    );
                    fail(&app, &message, tail.make_contiguous());
                    break;
                }
                _ => {}
            }
        }
    });
    Ok(())
}

/// Stops the server when the app quits.
pub fn stop(app: &AppHandle) {
    STOPPING.store(true, Ordering::SeqCst);
    if let Some(sidecar) = app.try_state::<Sidecar>() {
        if let Some(child) = sidecar.0.lock().unwrap().take() {
            let _ = child.kill();
        }
    }
}

/// Without the server there is nothing to show: explain, then quit. The
/// dialog is a sheet on the main window.
fn fail(app: &AppHandle, message: &str, recent_output: &[String]) {
    // Only report the first failure, and never while quitting.
    static FAILED: AtomicBool = AtomicBool::new(false);
    if STOPPING.load(Ordering::SeqCst) || FAILED.swap(true, Ordering::SeqCst) {
        return;
    }
    let log_file = app
        .path()
        .app_log_dir()
        .map(|dir| dir.join("server.log").display().to_string())
        .unwrap_or_default();
    let mut text = format!("{message}\n\nFull log: {log_file}");
    if !recent_output.is_empty() {
        text.push_str(&format!("\n\n{}", recent_output.join("\n")));
    }

    let title = if READY.load(Ordering::SeqCst) {
        "Compooss stopped"
    } else {
        "Compooss could not start"
    };
    let app_to_exit = app.clone();
    let mut dialog = app
        .dialog()
        .message(text)
        .title(title)
        .kind(MessageDialogKind::Error);
    if let Some(window) = app.get_webview_window("main") {
        dialog = dialog.parent(&window);
    }
    dialog.show(move |_| app_to_exit.exit(1));
}

fn random_token() -> Result<String, getrandom::Error> {
    let mut bytes = [0u8; 32];
    getrandom::fill(&mut bytes)?;
    Ok(bytes.iter().map(|b| format!("{b:02x}")).collect())
}
