"use client";

import { useCloseWorkspaceTab } from "@/lib/hooks/use-workspace-tabs.hook";
import { DESKTOP_ACTION_EVENT, isDesktop } from "@/lib/platform/platform";
import { namespaceOf, parseCollectionPath } from "@/lib/utils/collection-path.util";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);

/**
 * In the desktop app, Close Tab (⌘W / Ctrl+W) closes the active collection tab
 * rather than the window. macOS sends it from the app menu; Windows and Linux
 * have no menu bar, so the shortcut is caught here. Renders nothing.
 */
export const DesktopBridge: React.FC = () => {
  const pathname = usePathname();
  const closeTab = useCloseWorkspaceTab();

  useEffect(() => {
    if (!isDesktop()) return;

    const closeActiveTab = () => {
      const active = parseCollectionPath(pathname);
      if (active) closeTab({ id: namespaceOf(active), ...active });
    };
    const onAction = (event: Event) => {
      if ((event as CustomEvent<string>).detail === "close-tab") closeActiveTab();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (isMac || !event.ctrlKey || event.altKey || event.shiftKey || event.metaKey) return;
      if (event.key.toLowerCase() !== "w") return;
      event.preventDefault();
      closeActiveTab();
    };

    window.addEventListener(DESKTOP_ACTION_EVENT, onAction);
    // Capture phase, so the editors can't swallow the shortcut first.
    window.addEventListener("keydown", onKeyDown, true);
    return () => {
      window.removeEventListener(DESKTOP_ACTION_EVENT, onAction);
      window.removeEventListener("keydown", onKeyDown, true);
    };
  }, [pathname, closeTab]);

  return null;
};
