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
      <div className="relative w-full max-w-sm rounded-2xl border border-slate-900 bg-[#090e18] p-6 font-sans shadow-2xl">
        <h3 className="mb-4 flex items-center gap-2 border-b border-slate-900 pb-3 text-sm font-black text-slate-100">
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
};

export function ModalFormActions({
  onCancel,
  submitLabel,
}: ModalFormActionsProps) {
  return (
    <div className="flex items-center justify-end gap-3 border-t border-slate-900 pt-3">
      <button
        type="button"
        onClick={onCancel}
        className="cursor-pointer rounded-lg bg-[#0e1724] px-4 py-2 text-xs font-semibold text-slate-400 transition hover:bg-slate-900 hover:text-white"
      >
        Cancel
      </button>
      <button
        type="submit"
        className="cursor-pointer rounded-lg bg-orange-600 px-5 py-2 text-xs font-bold text-white shadow-lg hover:bg-orange-500"
      >
        {submitLabel}
      </button>
    </div>
  );
}
