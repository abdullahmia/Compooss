use percent_encoding::percent_decode_str;
use tauri::{
    ipc::{InvokeBody, Request},
    WebviewWindow,
};
use tauri_plugin_dialog::DialogExt;

/// Saves a file the page asked to download (collection exports,
/// pipeline.json) where the user picks, since desktop webviews ignore
/// `<a download>`. Called by `saveFile` in apps/compooss/src/lib/platform.
/// Returns the saved path, or None if the user cancelled.
#[tauri::command]
pub async fn save_file(
    window: WebviewWindow,
    request: Request<'_>,
) -> Result<Option<String>, String> {
    let InvokeBody::Raw(bytes) = request.body() else {
        return Err("Expected the file contents as raw bytes.".into());
    };
    let bytes = bytes.clone();
    let file_name = request
        .headers()
        .get("x-file-name")
        .and_then(|value| value.to_str().ok())
        .map(|value| percent_decode_str(value).decode_utf8_lossy().into_owned())
        // A suggested name only; never let it pick a directory.
        .map(|name| name.replace(['/', '\\'], "_"))
        .filter(|name| !name.trim().is_empty())
        .unwrap_or_else(|| "export".into());

    tauri::async_runtime::spawn_blocking(move || {
        let Some(path) = window
            .dialog()
            .file()
            .set_parent(&window)
            .set_file_name(file_name)
            .blocking_save_file()
        else {
            return Ok(None);
        };
        let path = path.into_path().map_err(|err| err.to_string())?;
        std::fs::write(&path, bytes)
            .map_err(|err| format!("Could not save {}: {err}", path.display()))?;
        Ok(Some(path.display().to_string()))
    })
    .await
    .map_err(|err| err.to_string())?
}
