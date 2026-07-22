import type { ReactNode } from "react";

type TeamManagementModalProps = {
  children: ReactNode;
  title: ReactNode;
};

export function TeamManagementModal({
  children,
  title,
}: TeamManagementModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm select-none dark:bg-[#000]/70">
      <div className="surface-elevated relative w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 font-sans dark:border-[#1a1a1a] dark:bg-[#0a0a0a]">
        <h3 className="mb-4 flex items-center gap-2 border-b border-slate-200 pb-3 text-sm font-black text-slate-950 dark:border-[#1a1a1a] dark:text-slate-100">
          {title}
        </h3>
        {children}
      </div>
    </div>
  );
}

type ModalFormActionsProps = {
  onCancel: () => void;
  submitLabel: string;
  submitDisabled?: boolean;
};

export function ModalFormActions({
  onCancel,
  submitLabel,
  submitDisabled = false,
}: ModalFormActionsProps) {
  return (
    <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-3 dark:border-[#1a1a1a]">
      <button
        type="button"
        onClick={onCancel}
        className="cursor-pointer rounded-lg bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-200 hover:text-slate-950 dark:bg-[#121212] dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white"
      >
        Cancel
      </button>
      <button
        type="submit"
        disabled={submitDisabled}
        className="cursor-pointer rounded-lg bg-orange-600 px-5 py-2 text-xs font-bold text-white shadow-lg hover:bg-orange-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitLabel}
      </button>
    </div>
  );
}
