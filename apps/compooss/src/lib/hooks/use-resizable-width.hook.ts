"use client";

import { useCallback, useState } from "react";

type Options = {
  storageKey: string;
  defaultWidth: number;
  minWidth: number;
  maxWidth: number;
};

/**
 * Pixel width that can be dragged from a resize handle on the element's right
 * edge. The width is persisted to localStorage when a drag ends.
 */
export function useResizableWidth({
  storageKey,
  defaultWidth,
  minWidth,
  maxWidth,
}: Options) {
  const clamp = useCallback(
    (value: number) => Math.min(maxWidth, Math.max(minWidth, value)),
    [minWidth, maxWidth],
  );

  // Read the stored width up front so the element doesn't flash at the
  // default width. localStorage is unavailable on the server, where the
  // catch falls back to the default.
  const [width, setWidth] = useState(() => {
    try {
      const stored = Number(localStorage.getItem(storageKey));
      if (stored) return clamp(stored);
    } catch {}
    return defaultWidth;
  });
  const [isResizing, setIsResizing] = useState(false);

  const startResize = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const startX = e.clientX;
      const startWidth = width;
      let latestWidth = startWidth;

      setIsResizing(true);
      // Keep the resize cursor and suppress text selection while the pointer
      // moves over other elements during the drag.
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";

      const handleDrag = (moveEvent: MouseEvent) => {
        latestWidth = clamp(startWidth + moveEvent.clientX - startX);
        setWidth(latestWidth);
      };

      const handleDragEnd = () => {
        setIsResizing(false);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        document.removeEventListener("mousemove", handleDrag);
        document.removeEventListener("mouseup", handleDragEnd);
        try {
          localStorage.setItem(storageKey, String(latestWidth));
        } catch {}
      };

      document.addEventListener("mousemove", handleDrag);
      document.addEventListener("mouseup", handleDragEnd);
    },
    [width, clamp, storageKey],
  );

  const resetWidth = useCallback(() => {
    setWidth(defaultWidth);
    try {
      localStorage.removeItem(storageKey);
    } catch {}
  }, [defaultWidth, storageKey]);

  return { width, isResizing, startResize, resetWidth };
}
