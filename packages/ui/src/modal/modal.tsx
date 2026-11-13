"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { X } from "lucide-react";
import { forwardRef, useState, type HTMLAttributes, type ReactNode } from "react";
import { usePresence } from "../lib/use-presence";
import { cn } from "../lib/utils";

export interface ModalOverlayProps extends HTMLAttributes<HTMLDivElement> {
  onClose?: () => void;
}

const ModalOverlay = forwardRef<HTMLDivElement, ModalOverlayProps>(
  ({ className, onClose, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "absolute inset-0 bg-background/10 backdrop-blur-xs group-data-[state=open]/modal:animate-overlay-in group-data-[state=closed]/modal:animate-overlay-out",
        className
      )}
      onClick={onClose}
      {...props}
    />
  )
);
ModalOverlay.displayName = "ModalOverlay";

const modalContentVariants = cva(
  "relative bg-card border border-border rounded-lg shadow-xl mx-4 group-data-[state=open]/modal:animate-modal-in group-data-[state=closed]/modal:animate-modal-out",
  {
    variants: {
      size: {
        sm: "w-full max-w-sm",
        md: "w-full max-w-md",
        lg: "w-full max-w-lg",
        xl: "w-full max-w-xl",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
);

export interface ModalContentProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof modalContentVariants> {}

const ModalContent = forwardRef<HTMLDivElement, ModalContentProps>(
  ({ className, size, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(modalContentVariants({ size }), className)}
      {...props}
    />
  )
);
ModalContent.displayName = "ModalContent";

export interface ModalHeaderProps extends HTMLAttributes<HTMLDivElement> {
  icon?: ReactNode;
  title: string;
  onClose?: () => void;
}

const ModalHeader = forwardRef<HTMLDivElement, ModalHeaderProps>(
  ({ className, icon, title, onClose, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex items-center justify-between px-5 py-4 border-b border-border",
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-2">
        {icon && <span className="text-primary">{icon}</span>}
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="p-1 text-muted-foreground hover:text-foreground rounded-sm hover:bg-secondary transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
);
ModalHeader.displayName = "ModalHeader";

const ModalBody = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("px-5 py-5 space-y-4", className)}
      {...props}
    />
  )
);
ModalBody.displayName = "ModalBody";

const ModalFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex items-center justify-end gap-2 px-5 py-4 border-t border-border",
        className
      )}
      {...props}
    />
  )
);
ModalFooter.displayName = "ModalFooter";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}

/** How long a closed modal stays mounted: its exit animation plus a frame. */
const EXIT_MS = 150;

function Modal({ open, onClose, children }: ModalProps) {
  const mounted = usePresence(open, EXIT_MS);
  // While closing, keep showing what was there. Parents often clear the data
  // they render (the item being edited, say) in the same update that closes it.
  const [shownChildren, setShownChildren] = useState(children);
  if (open && shownChildren !== children) setShownChildren(children);

  if (!mounted) return null;

  return (
    <div
      data-state={open ? "open" : "closed"}
      className="group/modal fixed inset-0 z-50 flex items-center justify-center data-[state=closed]:pointer-events-none"
    >
      <ModalOverlay onClose={onClose} />
      {open ? children : shownChildren}
    </div>
  );
}

Modal.displayName = "Modal";

export {
  Modal, ModalBody, ModalContent, modalContentVariants, ModalFooter, ModalHeader, ModalOverlay
};
