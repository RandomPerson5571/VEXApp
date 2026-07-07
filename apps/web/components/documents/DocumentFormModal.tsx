"use client";

import { FileText, Plus, Save, X } from "lucide-react";
import { useEffect, useId, type FormEvent } from "react";

import type { DocType } from "@stlvex/database/types";

import { DEFAULT_DOCUMENTATION_TEMPLATE } from "@/lib/queries/documentation";

const DOC_TYPE_OPTIONS: { value: DocType; label: string }[] = [
  { value: "GENERAL", label: "General" },
  { value: "CAD", label: "CAD" },
  { value: "HARDWARE", label: "Hardware" },
  { value: "PROGRAMMING", label: "Programming" },
];

const fieldClassName =
  "w-full rounded-lg border border-slate-900 bg-slate-950/80 px-3 py-2.5 text-xs font-semibold text-slate-200 outline-none transition placeholder:text-slate-600 focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/20";

const labelClassName =
  "text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500";

export type DocumentFormValues = {
  title: string;
  type: DocType;
  content: string;
};

export const emptyDocumentFormValues: DocumentFormValues = {
  title: "",
  type: "GENERAL",
  content: DEFAULT_DOCUMENTATION_TEMPLATE,
};

export type DocumentFormModalProps = {
  isOpen: boolean;
  mode: "create" | "edit";
  values: DocumentFormValues;
  onChange: (values: DocumentFormValues) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  isSubmitting?: boolean;
  submitError?: string | null;
};

export function DocumentFormModal({
  isOpen,
  mode,
  values,
  onChange,
  onClose,
  onSubmit,
  isSubmitting = false,
  submitError = null,
}: DocumentFormModalProps) {
  const titleId = useId();
  const descriptionId = useId();
  const isCreate = mode === "create";

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  function patch(partial: Partial<DocumentFormValues>) {
    onChange({ ...values, ...partial });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#000]/75 p-4 backdrop-blur-md"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="relative flex max-h-[min(90vh,720px)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-800/80 bg-[#090e18]/95 font-sans shadow-[0_24px_80px_rgba(0,0,0,0.55)] motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95 motion-safe:duration-200 motion-reduce:animate-none"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.08),transparent_60%)]"
        />

        <div className="relative shrink-0 border-b border-slate-900/80 px-6 py-5">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg border border-slate-900 bg-slate-950/60 text-slate-500 transition hover:border-slate-800 hover:text-slate-200 motion-safe:hover:scale-105 motion-reduce:transition-none"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-3 pr-10">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-500/25 bg-blue-600/10 shadow-[0_0_20px_rgba(59,130,246,0.12)]">
              <FileText className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <h2
                id={titleId}
                className="text-lg font-black tracking-tight text-slate-100"
              >
                {isCreate ? "New document" : "Edit document"}
              </h2>
              <p id={descriptionId} className="mt-0.5 text-xs font-medium text-slate-500">
                {isCreate
                  ? "Add a document with markdown content."
                  : "Update the title, type, or content."}
              </p>
            </div>
          </div>
        </div>

        <form
          onSubmit={onSubmit}
          className="relative flex min-h-0 flex-1 flex-col space-y-5 overflow-y-auto px-6 py-5 dashboard-scroll"
        >
          <div className="space-y-1.5">
            <label htmlFor="doc-title" className={labelClassName}>
              Title
            </label>
            <input
              id="doc-title"
              type="text"
              required
              maxLength={200}
              autoFocus
              placeholder="e.g. Week 2: Intake Redesign"
              value={values.title}
              onChange={(event) => patch({ title: event.target.value })}
              className={fieldClassName}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="doc-type" className={labelClassName}>
              Type
            </label>
            <select
              id="doc-type"
              value={values.type}
              onChange={(event) => patch({ type: event.target.value as DocType })}
              className={fieldClassName}
            >
              {DOC_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex min-h-0 flex-1 flex-col space-y-1.5">
            <label htmlFor="doc-content" className={labelClassName}>
              Content (Markdown)
            </label>
            <textarea
              id="doc-content"
              required
              rows={14}
              placeholder="Write your document content..."
              value={values.content}
              onChange={(event) => patch({ content: event.target.value })}
              className={`${fieldClassName} min-h-[240px] flex-1 resize-y font-mono leading-relaxed`}
            />
          </div>

          {submitError ? (
            <p className="rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs font-semibold text-red-300">
              {submitError}
            </p>
          ) : null}

          <div className="flex shrink-0 items-center justify-end gap-3 border-t border-slate-900/80 pt-5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-lg border border-slate-900 bg-slate-950/60 px-4 py-2 text-xs font-semibold text-slate-400 transition hover:border-slate-800 hover:text-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-blue-900/25 transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50 motion-safe:hover:scale-[1.02] motion-reduce:transition-none"
            >
              {isCreate ? (
                <>
                  <Plus className="h-3.5 w-3.5" />
                  {isSubmitting ? "Creating..." : "Create document"}
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5" />
                  {isSubmitting ? "Saving..." : "Save changes"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
