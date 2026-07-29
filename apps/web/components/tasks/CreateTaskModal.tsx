"use client";

import { useId, type FormEvent } from "react";
import { ClipboardList, Plus, Save, X } from "lucide-react";

import type { TaskPriority, TaskType } from "@stlvex/database/types";
import { Modal } from "@/components/ui/Modal";
import type { CreateTaskFormValues, EditTaskFormValues } from "./task-list-utils";
import { formatPersonName, getInitials } from "./task-list-utils";

const TASK_TYPE_OPTIONS: { value: TaskType; label: string }[] = [
  { value: "Hardware", label: "Hardware" },
  { value: "Software", label: "Software" },
  { value: "CAD", label: "CAD" },
  { value: "Other", label: "Other" },
];

const TASK_PRIORITY_OPTIONS: { value: TaskPriority; label: string }[] = [
  { value: "Low", label: "Low" },
  { value: "Medium", label: "Medium" },
  { value: "High", label: "High" },
];

const fieldClassName =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-900 shadow-sm outline-none transition placeholder:text-slate-500 focus:border-orange-500/40 focus:ring-1 focus:ring-orange-500/20 dark:border-[#1a1a1a] dark:bg-slate-950/80 dark:text-slate-200 dark:placeholder:text-slate-600";

const labelClassName =
  "text-[10px] font-bold uppercase tracking-[0.18em] text-slate-600 dark:text-slate-500";

type AssigneeOption = {
  id: string;
  firstName: string;
  lastName: string;
};

export type CreateTaskModalProps = {
  isOpen: boolean;
  mode?: "create" | "edit";
  values: CreateTaskFormValues | EditTaskFormValues;
  assigneeOptions: AssigneeOption[];
  onChange: (values: CreateTaskFormValues | EditTaskFormValues) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  isSubmitting?: boolean;
  submitError?: string | null;
};

export function CreateTaskModal({
  isOpen,
  mode = "create",
  values,
  assigneeOptions,
  onChange,
  onClose,
  onSubmit,
  isSubmitting = false,
  submitError = null,
}: CreateTaskModalProps) {
  const titleId = useId();
  const descriptionId = useId();
  const isEditMode = mode === "edit";

  function patch(partial: Partial<CreateTaskFormValues & EditTaskFormValues>) {
    onChange({ ...values, ...partial });
  }

  function toggleAssignee(userId: string) {
    const next = values.assigneeIds.includes(userId)
      ? values.assigneeIds.filter((id) => id !== userId)
      : [...values.assigneeIds, userId];
    patch({ assigneeIds: next });
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      closeDisabled={isSubmitting}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      className="flex max-h-[calc(100dvh-2rem)] max-w-lg flex-col overflow-hidden"
    >
        <div className="relative shrink-0 border-b border-slate-200 px-6 py-5 dark:border-[#1a1a1a]">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-500 transition hover:border-slate-300 hover:text-slate-900 dark:border-[#1a1a1a] dark:bg-slate-950/60 dark:hover:text-slate-200"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-3 pr-10">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-orange-500/25 bg-orange-600/10">
              <ClipboardList className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h2
                id={titleId}
                className="text-lg font-black tracking-tight text-slate-900 dark:text-slate-100"
              >
                {isEditMode ? "Due date & assignees" : "Create task"}
              </h2>
              <p
                id={descriptionId}
                className="mt-0.5 text-xs font-medium text-slate-600 dark:text-slate-500"
              >
                {isEditMode
                  ? "Title, status, and priority edit on the card."
                  : "Add work for your team — visible to all members."}
              </p>
            </div>
          </div>
        </div>

        <form
          onSubmit={onSubmit}
          className="relative min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5"
        >
          {!isEditMode ? (
            <>
              <div className="space-y-1.5">
                <label htmlFor="task-title" className={labelClassName}>
                  Title
                </label>
                <input
                  id="task-title"
                  type="text"
                  required
                  maxLength={200}
                  autoFocus
                  placeholder="e.g. Tune autonomous left-side routine"
                  value={values.title}
                  onChange={(event) => patch({ title: event.target.value })}
                  className={fieldClassName}
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="task-description" className={labelClassName}>
                  Description
                </label>
                <textarea
                  id="task-description"
                  rows={3}
                  placeholder="Goals, constraints, components needed..."
                  value={values.description}
                  onChange={(event) => patch({ description: event.target.value })}
                  className={`${fieldClassName} resize-none`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label htmlFor="task-type" className={labelClassName}>
                    Type
                  </label>
                  <select
                    id="task-type"
                    value={values.type}
                    onChange={(event) =>
                      patch({ type: event.target.value as TaskType })
                    }
                    className={fieldClassName}
                  >
                    {TASK_TYPE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="task-priority" className={labelClassName}>
                    Priority
                  </label>
                  <select
                    id="task-priority"
                    value={values.priority}
                    onChange={(event) =>
                      patch({ priority: event.target.value as TaskPriority })
                    }
                    className={fieldClassName}
                  >
                    {TASK_PRIORITY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </>
          ) : null}

          <div className="space-y-1.5">
            <label htmlFor="task-due-date" className={labelClassName}>
              Due date{" "}
              <span className="normal-case tracking-normal text-slate-500">
                (optional)
              </span>
            </label>
            <input
              id="task-due-date"
              type="date"
              value={values.dueDate}
              onChange={(event) => patch({ dueDate: event.target.value })}
              className={fieldClassName}
            />
          </div>

          {assigneeOptions.length > 0 ? (
            <fieldset className="space-y-2">
              <legend className={labelClassName}>
                Assign teammates{" "}
                <span className="normal-case tracking-normal text-slate-500">
                  (optional)
                </span>
              </legend>
              <div className="flex flex-wrap gap-2">
                {assigneeOptions.map((person) => {
                  const selected = values.assigneeIds.includes(person.id);

                  return (
                    <button
                      key={person.id}
                      type="button"
                      onClick={() => toggleAssignee(person.id)}
                      aria-pressed={selected}
                      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-bold transition ${
                        selected
                          ? "border-orange-500/40 bg-orange-600/15 text-orange-700 dark:text-orange-200"
                          : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:text-slate-900 dark:border-[#1a1a1a] dark:bg-slate-950/50 dark:text-slate-400 dark:hover:text-slate-200"
                      }`}
                    >
                      <span
                        className={`flex h-5 w-5 items-center justify-center rounded-full text-[8px] font-black ${
                          selected
                            ? "bg-orange-600 text-white"
                            : "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                        }`}
                      >
                        {getInitials(person.firstName, person.lastName)}
                      </span>
                      {formatPersonName(person)}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          ) : null}

          {submitError ? (
            <p className="rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs font-semibold text-red-600 dark:text-red-300">
              {submitError}
            </p>
          ) : null}

          <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-5 dark:border-[#1a1a1a]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#1a1a1a] dark:bg-slate-950/60 dark:text-slate-400 dark:hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 rounded-lg bg-orange-600 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-orange-900/25 transition hover:bg-orange-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isEditMode ? (
                <Save className="h-3.5 w-3.5" />
              ) : (
                <Plus className="h-3.5 w-3.5" />
              )}
              {isSubmitting
                ? isEditMode
                  ? "Saving..."
                  : "Creating..."
                : isEditMode
                  ? "Save"
                  : "Create task"}
            </button>
          </div>
        </form>
    </Modal>
  );
}

export const emptyCreateTaskFormValues: CreateTaskFormValues = {
  title: "",
  description: "",
  type: "Other",
  priority: "Medium",
  dueDate: "",
  assigneeIds: [],
};
