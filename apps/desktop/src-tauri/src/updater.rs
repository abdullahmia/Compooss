//! In-app updates. The page drives them (update-notification.component.tsx in
//! apps/compooss): it checks on launch, every few hours and from Check for
//! Updates…, then asks to install what it found. Releases publish a signed
//! package per platform and latest.json (scripts/release.ts); the endpoint and
//! the public key that verifies them are in tauri.conf.json.

use std::{
    sync::Mutex,
    time::{Duration, Instant},
};

use serde::Serialize;
use tauri::{ipc::Channel, AppHandle, State};
use tauri_plugin_updater::{Error, Update, UpdaterExt};

use crate::sidecar;

/// Download progress is sent at most this often, not for every chunk.
const PROGRESS_INTERVAL: Duration = Duration::from_millis(100);

/// The update the last check found, which `install_update` installs.
#[derive(Default)]
pub struct PendingUpdate(Mutex<Option<Update>>);

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateInfo {
    version: String,
    current_version: String,
}

/// What `install_update` reports while it runs.
#[derive(Serialize)]
#[serde(tag = "kind", rename_all = "camelCase")]
pub enum InstallProgress {
    Downloading { downloaded: u64, total: Option<u64> },
    Installing,
}

/// Returns the newer version if there is one, and keeps it for
/// `install_update`.
#[tauri::command]
pub async fn check_for_update(
    app: AppHandle,
    pending: State<'_, PendingUpdate>,
) -> Result<Option<UpdateInfo>, String> {
    // On Windows, installing runs the installer and exits the app right away,
    // so the server has to be stopped first. Elsewhere the app restarts
    // normally, which stops it (main.rs).
    let handle = app.clone();
    let updater = app
        .updater_builder()
        .on_before_exit(move || {
            sidecar::stop(&handle);
            handle.cleanup_before_exit();
        })
        .build()
        .map_err(|err| err.to_string())?;

    let update = match updater.check().await {
        Ok(update) => update,
        // GitHub's latest release has no latest.json until its desktop
        // installers are published, so there is nothing to update to yet.
        Err(Error::ReleaseNotFound) => None,
        Err(err) => return Err(err.to_string()),
    };
    let info = update.as_ref().map(|update| UpdateInfo {
        version: update.version.clone(),
        current_version: update.current_version.clone(),
    });
    *pending.0.lock().unwrap() = update;
    Ok(info)
}

/// Downloads the update `check_for_update` found, installs it and restarts
/// the app. On Windows, the installer replaces the app and starts it again
/// itself; on Linux, installing the .deb asks for the user's password.
#[tauri::command]
pub async fn install_update(
    app: AppHandle,
    pending: State<'_, PendingUpdate>,
    on_progress: Channel<InstallProgress>,
) -> Result<(), String> {
    // `tauri dev` runs the bare binary, so there is no app bundle to replace.
    if tauri::is_dev() {
        return Err("Updates can't be installed in development.".into());
    }
    let update = pending
        .0
        .lock()
        .unwrap()
        .clone()
        .ok_or("Check for updates first.")?;

    let mut downloaded = 0;
    let mut last_sent: Option<Instant> = None;
    let bytes = update
        .download(
            |chunk, total| {
                downloaded += chunk as u64;
                if last_sent.is_none_or(|sent| sent.elapsed() >= PROGRESS_INTERVAL) {
                    last_sent = Some(Instant::now());
                    let _ = on_progress.send(InstallProgress::Downloading { downloaded, total });
                }
            },
            || {},
        )
        .await
        .map_err(|err| err.to_string())?;
    let _ = on_progress.send(InstallProgress::Installing);

    // Blocking: it moves files and, on Linux, waits for the password prompt.
    tauri::async_runtime::spawn_blocking(move || update.install(bytes))
        .await
        .map_err(|err| err.to_string())?
        .map_err(|err| err.to_string())?;
    app.request_restart();
    Ok(())
}
