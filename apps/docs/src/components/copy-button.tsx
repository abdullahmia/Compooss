"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

interface CopyButtonProps {
  text: string;
  label?: string;
  className?: string;
}

export function CopyButton({
  text,
  label = "Copy",
  className = "",
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={copied ? "Copied" : label}
      title={copied ? "Copied" : label}
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-fg-muted transition-colors duration-150 ease-out hover:bg-raised hover:text-fg ${className}`}
    >
      {copied ? (
        <Check size={16} strokeWidth={1.5} className="text-accent" />
      ) : (
        <Copy size={16} strokeWidth={1.5} />
      )}
    </button>
  );
}
