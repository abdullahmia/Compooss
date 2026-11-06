//! The macOS menu bar. Windows and Linux get none; the page handles Ctrl+W
//! there (desktop-bridge.component.tsx).

use tauri::{
    menu::{Menu, MenuItem, PredefinedMenuItem, Submenu},
    AppHandle, Manager,
};
use tauri_plugin_opener::OpenerExt;

const WEBSITE_URL: &str = "https://compooss.dev";
const ISSUES_URL: &str = "https://github.com/abdullahmia/compooss/issues";

pub fn install(app: &AppHandle) -> tauri::Result<()> {
    let separator = || PredefinedMenuItem::separator(app);
    let item = |id: &str, text: &str, accelerator: Option<&str>| {
        MenuItem::with_id(app, id, text, true, accelerator)
    };

    let menu = Menu::with_items(
        app,
        &[
            &Submenu::with_items(
                app,
                "Compooss",
                true,
                &[
                    &PredefinedMenuItem::about(app, None, None)?,
                    &separator()?,
                    &PredefinedMenuItem::services(app, None)?,
                    &separator()?,
                    &PredefinedMenuItem::hide(app, None)?,
                    &PredefinedMenuItem::hide_others(app, None)?,
                    &PredefinedMenuItem::show_all(app, None)?,
                    &separator()?,
                    &PredefinedMenuItem::quit(app, None)?,
                ],
            )?,
            &Submenu::with_items(
                app,
                "File",
                true,
                &[
                    // ⌘W closes a collection tab, like a browser tab, rather
                    // than the only window.
                    &item("close-tab", "Close Tab", Some("CmdOrCtrl+W"))?,
                    &item("close-window", "Close Window", Some("CmdOrCtrl+Shift+W"))?,
                ],
            )?,
            // Without these, copy and paste don't work in the page on macOS.
            &Submenu::with_items(
                app,
                "Edit",
                true,
                &[
                    &PredefinedMenuItem::undo(app, None)?,
                    &PredefinedMenuItem::redo(app, None)?,
                    &separator()?,
                    &PredefinedMenuItem::cut(app, None)?,
                    &PredefinedMenuItem::copy(app, None)?,
                    &PredefinedMenuItem::paste(app, None)?,
                    &PredefinedMenuItem::select_all(app, None)?,
                ],
            )?,
            &Submenu::with_items(
                app,
                "View",
                true,
                &[
                    &item("reload", "Reload", Some("CmdOrCtrl+R"))?,
                    &separator()?,
                    &PredefinedMenuItem::fullscreen(app, None)?,
                ],
            )?,
            &Submenu::with_items(
                app,
                "Window",
                true,
                &[
                    &PredefinedMenuItem::minimize(app, None)?,
                    &PredefinedMenuItem::maximize(app, None)?,
                ],
            )?,
            &Submenu::with_items(
                app,
                "Help",
                true,
                &[
                    &item("website", "Compooss Website", None)?,
                    &item("report-issue", "Report an Issue", None)?,
                    &separator()?,
                    &item("open-logs", "Open Logs Folder", None)?,
                ],
            )?,
        ],
    )?;
    app.set_menu(menu)?;

    app.on_menu_event(|app, event| {
        let window = app.get_webview_window("main");
        match event.id().as_ref() {
            "close-tab" => {
                if let Some(window) = window {
                    // Handled by desktop-bridge.component.tsx.
                    let _ = window.eval(
                        "window.dispatchEvent(new CustomEvent('compooss:desktop', { detail: 'close-tab' }))",
                    );
                }
            }
            "close-window" => {
                if let Some(window) = window {
                    let _ = window.close();
                }
            }
            "reload" => {
                // Only the app page: reloading the splash would leave it stuck.
                if let Some(window) = window {
                    if window.url().is_ok_and(|url| url.scheme() == "http") {
                        let _ = window.reload();
                    }
                }
            }
            "website" => {
                let _ = app.opener().open_url(WEBSITE_URL, None::<&str>);
            }
            "report-issue" => {
                let _ = app.opener().open_url(ISSUES_URL, None::<&str>);
            }
            "open-logs" => {
                if let Ok(dir) = app.path().app_log_dir() {
                    let _ = app.opener().open_path(dir.display().to_string(), None::<&str>);
                }
            }
            _ => {}
        }
    });
    Ok(())
}
