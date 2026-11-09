import type { ReactNode } from "react";

interface SectionHeaderProps {
  /** Shown as a MongoDB-style namespace, like `compooss.install`. */
  namespace: string;
  title: ReactNode;
  description?: ReactNode;
  className?: string;
}

export function SectionHeader({
  namespace,
  title,
  description,
  className = "",
}: SectionHeaderProps) {
  return (
    <div className={className}>
      <p className="font-mono text-xs text-fg-muted">compooss.{namespace}</p>
      <h2 className="mt-4 text-[28px] font-medium leading-[1.15] tracking-[-0.02em] text-fg md:text-4xl">
        {title}
      </h2>
      {description && (
        <p className="mt-4 max-w-xl text-base leading-7 text-fg-secondary">
          {description}
        </p>
      )}
    </div>
  );
}
