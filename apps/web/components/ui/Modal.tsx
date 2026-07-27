"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";

import { cn } from "@stlvex/ui";

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Extra classes on the panel (width, padding, etc.). */
  className?: string;
  /** Close when clicking the dimmed backdrop. Default true. */
  closeOnBackdrop?: boolean;
  /** Disable Escape / backdrop while a mutation is in flight. */
  closeDisabled?: boolean;
  role?: "dialog" | "alertdialog";
  "aria-labelledby"?: string;
  "aria-describedby"?: string;
};

export function Modal({
  isOpen,
  onClose,
  children,
  className,
  closeOnBackdrop = true,
  closeDisabled = false,
  role = "dialog",
  "aria-labelledby": ariaLabelledBy,
  "aria-describedby": ariaDescribedBy,
}: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !closeDisabled) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, onClose, closeDisabled]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm dark:bg-[#000]/70"
      role="presentation"
      onMouseDown={(event) => {
        if (
          closeOnBackdrop &&
          !closeDisabled &&
          event.target === event.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <div
        role={role}
        aria-modal="true"
        aria-labelledby={ariaLabelledBy}
        aria-describedby={ariaDescribedBy}
        className={cn(
          "surface-elevated relative w-full max-w-sm rounded-2xl border border-slate-200 bg-white font-sans dark:border-[#1a1a1a] dark:bg-[#0a0a0a]",
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}
