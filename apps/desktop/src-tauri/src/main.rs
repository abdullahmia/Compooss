// No console window on Windows release builds.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
#[cfg(target_os = "macos")]
mod menu;
mod sidecar;
mod updater;

use tauri::{
    ipc::CapabilityBuilder, AppHandle, Manager, RunEvent, Url, WebviewUrl, WebviewWindow,
    WebviewWindowBuilder,
};
use tauri_plugin_opener::OpenerExt;
use tauri_plugin_window_state::StateFlags;

/// The Next.js dev server `tauri dev` starts (build.devUrl in tauri.conf.json).
/// Its own port, so the window never shows another app running on 3000.
const DEV_SERVER: (&str, u16) = ("localhost", 29018);

fn main() {
    let mut builder = tauri::Builder::default();
    // Registered first, so a second launch just focuses the open window. Not
    // in `tauri dev`, which would otherwise hand off to an installed copy.
    if !tauri::is_dev() {
        builder = builder.plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.unminimize();
                let _ = window.set_focus();
            }
        }));
    }

    let app = builder
        .plugin(
            tauri_plugin_window_state::Builder::new()
                .with_state_flags(StateFlags::all() & !StateFlags::VISIBLE)
                .build(),
        )
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .manage(updater::PendingUpdate::default())
        .invoke_handler(tauri::generate_handler![
            commands::save_file,
            updater::check_for_update,
            updater::install_update
        ])
        .setup(|app| {
            let window = build_main_window(app.handle())?;
            #[cfg(target_os = "macos")]
            menu::install(app.handle())?;

            // The page comes from the local server, so IPC has to be opened to
            // that origin explicitly, and only for saving files and updates.
            let mut capability = CapabilityBuilder::new("server-page")
                .remote(format!("http://127.0.0.1:{}/*", sidecar::PORT))
                .window("main")
                .permission("allow-save-file")
                .permission("allow-check-for-update")
                .permission("allow-install-update");
            if tauri::is_dev() {
                capability =
                    capability.remote(format!("http://{}:{}/*", DEV_SERVER.0, DEV_SERVER.1));
            }
            app.add_capability(capability)?;

            if !tauri::is_dev() {
                sidecar::start(app.handle(), &window)?;
            }
            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("failed to build Compooss");

    app.run(|app, event| {
        if let RunEvent::Exit = event {
            sidecar::stop(app);
        }
    });
}

/// Opens on the bundled splash page; the sidecar navigates it to the app once
/// the server is ready. `tauri dev` loads the Next.js dev server directly.
fn build_main_window(app: &AppHandle) -> tauri::Result<WebviewWindow> {
    let url = if tauri::is_dev() {
        let dev_url = format!("http://{}:{}", DEV_SERVER.0, DEV_SERVER.1);
        WebviewUrl::External(dev_url.parse().expect("valid dev server URL"))
    } else {
        WebviewUrl::App("index.html".into())
    };

    let handle = app.clone();
    WebviewWindowBuilder::new(app, "main", url)
        .title("Compooss")
        .inner_size(1440.0, 900.0)
        .min_inner_size(1024.0, 640.0)
        .center()
        // Let the page handle dropped files (the import dialog's drop zone).
        .disable_drag_drop_handler()
        .on_navigation(move |url| {
            if is_app_url(url) {
                return true;
            }
            // Links to anything else open in the default browser.
            if matches!(url.scheme(), "http" | "https" | "mailto") {
                let _ = handle.opener().open_url(url.as_str(), None::<&str>);
            }
            false
        })
        .build()
}

/// The splash page, the bundled server or, in dev, the Next.js dev server.
fn is_app_url(url: &Url) -> bool {
    let host = url.host_str();
    match url.scheme() {
        // The splash page: tauri://localhost (macOS, Linux)...
        "tauri" => true,
        // ...or http://tauri.localhost (Windows).
        "http" if host == Some("tauri.localhost") => true,
        "http" => {
            let origin = (host, url.port());
            origin == (Some("127.0.0.1"), Some(sidecar::PORT))
                || (tauri::is_dev() && origin == (Some(DEV_SERVER.0), Some(DEV_SERVER.1)))
        }
        _ => false,
    }
}
