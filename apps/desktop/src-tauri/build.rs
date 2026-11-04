fn main() {
    // Registers `save_file` so the capability in main.rs can allow it;
    // app commands are denied unless a capability grants them.
    tauri_build::try_build(
        tauri_build::Attributes::new()
            .app_manifest(tauri_build::AppManifest::new().commands(&["save_file"])),
    )
    .expect("failed to run tauri-build");
}
