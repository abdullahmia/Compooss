interface LeafMarkProps {
  className?: string;
}

/** The leaf from the Compooss app icon, in one solid colour. */
export function LeafMark({ className }: LeafMarkProps) {
  return (
    <svg
      viewBox="362 230 300 572"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M512 236C585 312 650 410 652 530 654 640 594 716 512 748 430 716 370 640 372 530 374 410 439 312 512 236ZM512 378 521 700 503 700Z"
      />
      <rect x="502" y="700" width="20" height="96" rx="5" />
    </svg>
  );
}

interface LogoProps {
  href?: string;
}

export function Logo({ href = "/" }: LogoProps) {
  return (
    <a href={href} className="flex items-center gap-2 text-fg">
      <LeafMark className="h-[18px] w-auto" />
      <span className="text-base font-medium">Compooss</span>
    </a>
  );
}
