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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#000]/70 p-4 backdrop-blur-sm select-none">
      <div className="surface-elevated relative w-full max-w-sm rounded-2xl p-6 font-sans">
        <h3 className="mb-4 flex items-center gap-2 border-b border-[#1a1a1a] pb-3 text-sm font-black text-slate-100">
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
    <div className="flex items-center justify-end gap-3 border-t border-[#1a1a1a] pt-3">
      <button
        type="button"
        onClick={onCancel}
        className="cursor-pointer rounded-lg bg-[#121212] px-4 py-2 text-xs font-semibold text-slate-400 transition hover:bg-slate-900 hover:text-white"
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
