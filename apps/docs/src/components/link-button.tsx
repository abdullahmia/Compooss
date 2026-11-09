import type { ReactNode } from "react";

interface LinkButtonProps {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary";
  size?: "md" | "lg";
  external?: boolean;
  className?: string;
}

const VARIANTS = {
  primary: "bg-fg text-page hover:bg-white",
  secondary: "border border-line bg-raised text-fg hover:border-line-strong",
};

const SIZES = {
  md: "h-9 px-4 text-sm",
  lg: "h-11 px-5 text-[15px]",
};

export function LinkButton({
  href,
  children,
  variant = "primary",
  size = "md",
  external = false,
  className = "",
}: LinkButtonProps) {
  return (
    <a
      href={href}
      {...(external && { target: "_blank", rel: "noopener noreferrer" })}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-[background-color,border-color,transform] duration-150 ease-out active:scale-[0.98] ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
    >
      {children}
    </a>
  );
}
