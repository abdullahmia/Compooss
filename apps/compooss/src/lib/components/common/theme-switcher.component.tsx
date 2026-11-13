"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

type ViewTransition = {
  ready: Promise<void>;
  finished: Promise<void>;
};

export const ThemeSwitcher: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  // resolvedTheme, not theme: with "System" chosen in Settings, theme is "system".
  const { resolvedTheme, setTheme } = useTheme();

  useEffect(() => setMounted(true), []);

  if (!mounted) return <div className="w-8 h-8" />;

  const handleToggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    const isDarkToLight = resolvedTheme === "dark";
    const newTheme = isDarkToLight ? "light" : "dark";

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!("startViewTransition" in document) || reduceMotion) {
      setTheme(newTheme);
      return;
    }

    const x = e.clientX;
    const y = e.clientY;
    const maxRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    if (isDarkToLight) {
      document.documentElement.dataset.themeTransition = "dark-to-light";
    } else {
      delete document.documentElement.dataset.themeTransition;
    }

    const transition = (
      document as Document & {
        startViewTransition: (cb: () => void) => ViewTransition;
      }
    ).startViewTransition(() => setTheme(newTheme));

    const circles = [
      `circle(0px at ${x}px ${y}px)`,
      `circle(${maxRadius}px at ${x}px ${y}px)`,
    ];

    transition.ready
      .then(() => {
        // Dark → light shrinks the old dark snapshot; light → dark grows the new one.
        const animation = document.documentElement.animate(
          { clipPath: isDarkToLight ? [...circles].reverse() : circles },
          {
            duration: 480,
            easing: "ease-in-out",
            fill: "forwards",
            pseudoElement: isDarkToLight
              ? "::view-transition-old(root)"
              : "::view-transition-new(root)",
          }
        );
        // fill: "forwards" holds the last frame until the transition ends. Left
        // running, it would keep clipping that pseudo-element in the next toggle:
        // a finished dark → light run hid the light snapshot of light → dark.
        transition.finished.then(() => animation.cancel());
      })
      // Rejects when the transition is skipped, e.g. by a second click mid-way.
      .catch(() => {});

    transition.finished.then(() => {
      delete document.documentElement.dataset.themeTransition;
    });
  };

  return (
    <button
      onClick={handleToggle}
      className="w-8 h-8 flex items-center justify-center rounded-md cursor-pointer hover:bg-secondary transition-colors text-foreground"
      aria-label="Toggle theme"
    >
      {resolvedTheme === "dark" ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </button>
  );
};
