fn main() {
    // Registers the app's commands so the capability in main.rs can allow
    // them; app commands are denied unless a capability grants them.
    tauri_build::try_build(tauri_build::Attributes::new().app_manifest(
        tauri_build::AppManifest::new().commands(&[
            "save_file",
            "check_for_update",
            "install_update",
        ]),
    ))
    .expect("failed to run tauri-build");
}
