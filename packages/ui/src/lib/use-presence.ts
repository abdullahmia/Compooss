"use client";

import { useEffect, useState } from "react";

/**
 * True while `open` is true and for `exitMs` after it turns false, so content
 * can play an exit animation before it unmounts.
 */
export function usePresence(open: boolean, exitMs: number): boolean {
  const [mounted, setMounted] = useState(open);
  if (open && !mounted) setMounted(true);

  useEffect(() => {
    if (open || !mounted) return;
    const timer = window.setTimeout(() => setMounted(false), exitMs);
    return () => window.clearTimeout(timer);
  }, [open, mounted, exitMs]);

  return open || mounted;
}
