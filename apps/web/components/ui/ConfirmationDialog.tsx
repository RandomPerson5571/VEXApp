"use client";

import type { ReactNode } from "react";
import { useEffect, useId } from "react";

type ConfirmationDialogVariant = "default" | "danger";

type ConfirmationDialogProps = {
  isOpen: boolean;
  title: ReactNode;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmationDialogVariant;
  pending?: boolean;
  pendingLabel?: string;
  icon?: ReactNode;
  onClose: () => void;
  onConfirm: () => void;
};

const confirmButtonClassName: Record<ConfirmationDialogVariant, string> = {
  default:
    "bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-900/20",
  danger:
    "bg-red-600 text-white hover:bg-red-500 shadow-lg shadow-red-900/20",
};

export function ConfirmationDialog({
  isOpen,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  pending = false,
  pendingLabel = "Working...",
  icon,
  onClose,
  onConfirm,
}: ConfirmationDialogProps) {
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !pending) {
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
  }, [isOpen, onClose, pending]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#000]/70 p-4 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !pending) {
          onClose();
        }
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className="relative w-full max-w-sm rounded-2xl border border-slate-900 bg-[#090e18] p-6 font-sans shadow-2xl"
      >
        <div className="mb-4 flex items-start gap-3 border-b border-slate-900 pb-3">
          {icon ? (
            <div className="mt-0.5 shrink-0 text-slate-400">{icon}</div>
          ) : null}
          <div className="min-w-0 space-y-1">
            <h3
              id={titleId}
              className="text-sm font-black tracking-tight text-slate-100"
            >
              {title}
            </h3>
            {description ? (
              <p
                id={descriptionId}
                className="text-xs font-semibold leading-relaxed text-slate-400"
              >
                {description}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            className="rounded-lg bg-[#0e1724] px-4 py-2 text-xs font-semibold text-slate-400 transition hover:bg-slate-900 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            className={`rounded-lg px-5 py-2 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${confirmButtonClassName[variant]}`}
          >
            {pending ? pendingLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
