"use client";

import { LinkButton } from "@/components/link-button";
import { Logo } from "@/components/logo";
import {
  DOCKER_HUB_URL,
  GITHUB_URL,
  NAV_LINKS,
} from "@/lib/constants/landing.constants";
import { ArrowUpRight, Github, Menu, X } from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";

const SECTION_IDS = NAV_LINKS.map((link) => link.href.slice(1));

const EXTERNAL_LINKS = [
  { label: "Docker Hub", href: DOCKER_HUB_URL },
  { label: "GitHub", href: GITHUB_URL },
  { label: "Releases", href: `${GITHUB_URL}/releases` },
];

function subscribeToScroll(callback: () => void) {
  window.addEventListener("scroll", callback, { passive: true });
  window.addEventListener("resize", callback);
  return () => {
    window.removeEventListener("scroll", callback);
    window.removeEventListener("resize", callback);
  };
}

/**
 * The section whose top has passed the upper third of the viewport, or null
 * while the hero is in view. At the very bottom the last section wins, since
 * a short last section never reaches that line.
 */
function getActiveSection(): string | null {
  const root = document.documentElement;
  if (window.scrollY + window.innerHeight >= root.scrollHeight - 2) {
    return SECTION_IDS[SECTION_IDS.length - 1];
  }
  const line = window.innerHeight / 3;
  let active: string | null = null;
  for (const id of SECTION_IDS) {
    const top = document.getElementById(id)?.getBoundingClientRect().top;
    if (top !== undefined && top <= line) active = id;
  }
  return active;
}

export const Nav: React.FC = () => {
  const [open, setOpen] = useState(false);
  const activeSection = useSyncExternalStore(
    subscribeToScroll,
    getActiveSection,
    () => null,
  );

  // While the menu is open: Escape closes it, the page behind it doesn't
  // scroll, and it closes itself once the desktop links are visible.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const desktop = window.matchMedia("(min-width: 1024px)");
    const onDesktop = () => {
      if (desktop.matches) setOpen(false);
    };
    const { overflow } = document.documentElement.style;
    document.documentElement.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    desktop.addEventListener("change", onDesktop);
    return () => {
      document.documentElement.style.overflow = overflow;
      window.removeEventListener("keydown", onKeyDown);
      desktop.removeEventListener("change", onDesktop);
    };
  }, [open]);

  return (
    <nav className="sticky top-0 z-50 border-b border-line bg-page">
      <div className="mx-auto flex h-14 max-w-[1200px] items-center justify-between gap-8 px-4 sm:px-6 lg:px-8">
        <Logo href="#" />

        <div className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => {
            const isActive = link.href === `#${activeSection}`;
            return (
              <a
                key={link.href}
                href={link.href}
                aria-current={isActive ? "true" : undefined}
                className={`rounded-md px-3 py-2 text-sm transition-colors duration-150 ease-out ${
                  isActive
                    ? "bg-raised text-fg shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                    : "text-fg-secondary hover:text-fg"
                }`}
              >
                {link.label}
              </a>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <a
            href={DOCKER_HUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden rounded-md px-3 py-2 text-sm text-fg-secondary transition-colors duration-150 ease-out hover:text-fg sm:block"
          >
            Docker Hub
          </a>
          <LinkButton href={GITHUB_URL} variant="secondary" external>
            <Github size={16} strokeWidth={1.5} />
            GitHub
          </LinkButton>
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            className="-mr-2 flex h-10 w-10 items-center justify-center rounded-lg text-fg-secondary transition-colors duration-150 ease-out hover:bg-raised hover:text-fg lg:hidden"
          >
            {open ? <X size={18} strokeWidth={1.5} /> : <Menu size={18} strokeWidth={1.5} />}
          </button>
        </div>
      </div>

      {open && (
        <div
          id="mobile-menu"
          className="fixed inset-x-0 bottom-0 top-14 overflow-y-auto overscroll-contain bg-page lg:hidden"
        >
          <div className="rise flex min-h-full flex-col px-4 pb-8 pt-2 [animation-duration:200ms] sm:px-6">
            <ul>
              {NAV_LINKS.map((link) => {
                const isActive = link.href === `#${activeSection}`;
                return (
                  <li key={link.href} className="border-b border-line">
                    <a
                      href={link.href}
                      aria-current={isActive ? "true" : undefined}
                      onClick={() => setOpen(false)}
                      className={`flex h-14 items-center justify-between text-lg transition-colors duration-150 ease-out ${
                        isActive ? "text-fg" : "text-fg-secondary hover:text-fg"
                      }`}
                    >
                      {link.label}
                      {isActive && <span className="h-1.5 w-1.5 rounded-full bg-accent" />}
                    </a>
                  </li>
                );
              })}
            </ul>

            <ul className="mt-auto flex flex-col pt-8">
              {EXTERNAL_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-11 items-center gap-2 text-[15px] text-fg-secondary transition-colors duration-150 ease-out hover:text-fg"
                  >
                    {link.label}
                    <ArrowUpRight size={16} strokeWidth={1.5} className="text-fg-muted" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </nav>
  );
};
