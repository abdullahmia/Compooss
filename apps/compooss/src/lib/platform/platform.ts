"use client";

/**
 * Browser vs. desktop app (apps/desktop) differences live here, so components
 * never touch Tauri APIs directly.
 */

/**
 * DOM event the desktop app dispatches for native menu actions; `detail` is the
 * action name ("close-tab", "check-for-updates"). Plain DOM events need no
 * Tauri permissions.
 */
export const DESKTOP_ACTION_EVENT = "compooss:desktop";

/** True inside the Compooss desktop app's window. */
export function isDesktop(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

/**
 * Saves a file the user asked to download. The desktop app shows a native save
 * dialog (desktop webviews ignore `<a download>`); browsers download it.
 */
export async function saveFile(name: string, data: Blob): Promise<void> {
  if (isDesktop()) {
    const { invoke } = await import("@tauri-apps/api/core");
    const bytes = new Uint8Array(await data.arrayBuffer());
    try {
      await invoke("save_file", bytes, {
        headers: { "x-file-name": encodeURIComponent(name) },
      });
    } catch (err) {
      throw commandError(err, `Could not save ${name}.`);
    }
    return;
  }

  const objectUrl = URL.createObjectURL(data);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(objectUrl);
}

/** A newer version of the desktop app, found by `checkForUpdate()`. */
export type AppUpdate = { version: string; currentVersion: string };

/** Reported by `installUpdate()`. `total` is null when the size isn't known. */
export type UpdateProgress =
  | { kind: "downloading"; downloaded: number; total: number | null }
  | { kind: "installing" };

/**
 * Asks the desktop app whether a newer version was released. Resolves to null
 * when it's up to date. Desktop only.
 */
export async function checkForUpdate(): Promise<AppUpdate | null> {
  const { invoke } = await import("@tauri-apps/api/core");
  try {
    return await invoke<AppUpdate | null>("check_for_update");
  } catch (err) {
    throw commandError(err, "Could not check for updates.");
  }
}

/**
 * Downloads and installs the update `checkForUpdate()` found, then restarts
 * the app. Desktop only.
 */
export async function installUpdate(
  onProgress: (progress: UpdateProgress) => void,
): Promise<void> {
  const { Channel, invoke } = await import("@tauri-apps/api/core");
  try {
    await invoke("install_update", { onProgress: new Channel(onProgress) });
  } catch (err) {
    throw commandError(err, "Could not install the update.");
  }
}

/** Tauri rejects with the command's error string, not an Error. */
function commandError(err: unknown, fallback: string): Error {
  return new Error(typeof err === "string" ? err : fallback);
}
