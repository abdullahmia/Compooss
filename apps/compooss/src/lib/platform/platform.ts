"use client";

/**
 * Browser vs. desktop app (apps/desktop) differences live here, so components
 * never touch Tauri APIs directly.
 */

/**
 * DOM event the desktop app dispatches for native menu actions; `detail` is the
 * action name (e.g. "close-tab"). Plain DOM events need no Tauri permissions.
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
      // Tauri rejects with the command's error string, not an Error.
      throw new Error(typeof err === "string" ? err : `Could not save ${name}.`);
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
