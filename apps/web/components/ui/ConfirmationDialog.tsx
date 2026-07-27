"use client";

import type { ReactNode } from "react";
import { useId } from "react";

import { Modal } from "@/components/ui/Modal";

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
    "bg-orange-600 text-white hover:bg-orange-500 shadow-lg shadow-orange-900/20",
  danger: "bg-red-600 text-white hover:bg-red-500 shadow-lg shadow-red-900/20",
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      closeDisabled={pending}
      role="alertdialog"
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      className="p-6"
    >
      <div className="mb-4 flex items-start gap-3 border-b border-slate-200 pb-3 dark:border-[#1a1a1a]">
        {icon ? (
          <div className="mt-0.5 shrink-0 text-slate-500 dark:text-slate-400">
            {icon}
          </div>
        ) : null}
        <div className="min-w-0 space-y-1">
          <h3
            id={titleId}
            className="text-sm font-black tracking-tight text-slate-900 dark:text-slate-100"
          >
            {title}
          </h3>
          {description ? (
            <p
              id={descriptionId}
              className="text-xs font-semibold leading-relaxed text-slate-600 dark:text-slate-400"
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
          className="rounded-lg bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-200 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#121212] dark:text-slate-400 dark:hover:bg-[#1a1a1a] dark:hover:text-[#f4f4f5]"
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
    </Modal>
  );
}
