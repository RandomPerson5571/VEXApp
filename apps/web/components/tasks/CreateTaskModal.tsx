"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { Calendar, ChevronLeft, ChevronRight, ClipboardList, Plus, Save, X } from "lucide-react";

import type { TaskListSubTask, TaskPriority, TaskStatus, TaskType } from "@stlvex/database/types";
import {
  formatMonthYear,
  formatSelectedDayLabel,
  getDaysInMonth,
  getTodayDateStr,
  parseDateStr,
} from "@/lib/utils/calendar";
import type { CreateTaskFormValues, EditTaskFormValues } from "./task-list-utils";
import { formatPersonName, getInitials, getSubtaskProgress } from "./task-list-utils";

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

const TASK_STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: "NotStarted", label: "Not started" },
  { value: "InProgress", label: "In progress" },
  { value: "Done", label: "Done" },
];

const fieldClassName =
  "w-full rounded-lg border border-[#1a1a1a] bg-slate-950/80 px-3 py-2.5 text-xs font-semibold text-slate-200 outline-none transition placeholder:text-slate-600 focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/20";

const labelClassName =
  "text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500";

const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

function getMonthAnchor(dateStr: string): Date {
  const date = parseDateStr(dateStr);
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

type TaskDueDateFieldProps = {
  value: string;
  onChange: (dueDate: string) => void;
};

function TaskDueDateField({ value, onChange }: TaskDueDateFieldProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(() =>
    value ? getMonthAnchor(value) : new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const todayStr = getTodayDateStr();

  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [isOpen]);

  function openCalendar() {
    setViewMonth(
      value ? getMonthAnchor(value) : new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    );
    setIsOpen(true);
  }

  function selectDate(dateStr: string) {
    onChange(dateStr);
    setIsOpen(false);
  }

  function setToday() {
    onChange(todayStr);
    setViewMonth(getMonthAnchor(todayStr));
    setIsOpen(false);
  }

  const calendarDays = getDaysInMonth(viewMonth.getFullYear(), viewMonth.getMonth());

  return (
    <div ref={containerRef} className="relative">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => (isOpen ? setIsOpen(false) : openCalendar())}
          aria-expanded={isOpen}
          aria-haspopup="dialog"
          className={`${fieldClassName} flex flex-1 items-center gap-2 text-left ${
            value ? "text-slate-200" : "text-slate-600"
          }`}
        >
          <Calendar className="h-3.5 w-3.5 shrink-0 text-slate-500" />
          <span className="truncate">
            {value ? formatSelectedDayLabel(value) : "Select due date"}
          </span>
        </button>
        <button
          type="button"
          onClick={setToday}
          className="shrink-0 rounded-lg border border-[#1a1a1a] bg-slate-950/80 px-3 py-2.5 text-xs font-bold text-slate-300 transition hover:border-blue-500/30 hover:bg-blue-600/10 hover:text-blue-200"
        >
          Now
        </button>
      </div>

      {isOpen ? (
        <div
          role="dialog"
          aria-label="Choose due date"
          className="absolute bottom-[calc(100%+0.375rem)] left-0 right-0 z-20 rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] p-3 "
        >
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-black text-slate-200">
              {formatMonthYear(viewMonth)}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() =>
                  setViewMonth(
                    (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1),
                  )
                }
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#1a1a1a] bg-slate-950 text-slate-400 transition hover:border-[#1a1a1a] hover:text-slate-200"
                aria-label="Previous month"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() =>
                  setViewMonth(
                    (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1),
                  )
                }
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#1a1a1a] bg-slate-950 text-slate-400 transition hover:border-[#1a1a1a] hover:text-slate-200"
                aria-label="Next month"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="mb-1 grid grid-cols-7 gap-1 text-center text-[9px] font-bold uppercase tracking-wider text-slate-500">
            {WEEKDAY_LABELS.map((day, index) => (
              <span key={`${day}-${index}`}>{day}</span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((cell) => {
              const isSelected = value === cell.dateStr;
              const isToday = cell.dateStr === todayStr;

              return (
                <button
                  key={cell.dateStr}
                  type="button"
                  onClick={() => selectDate(cell.dateStr)}
                  className={`flex h-8 items-center justify-center rounded-lg text-[11px] font-bold transition ${
                    cell.isCurrentMonth ? "text-slate-300" : "text-slate-600"
                  } ${
                    isSelected
                      ? "bg-blue-600 text-white shadow-[0_0_12px_rgba(59,130,246,0.35)]"
                      : isToday
                        ? "border border-blue-500/30 bg-blue-600/10 text-blue-300 hover:bg-blue-600/20"
                        : "hover:bg-slate-900/70"
                  }`}
                >
                  {cell.day}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

type AssigneeOption = {
  id: string;
  firstName: string;
  lastName: string;
};

type TaskModalMeta = {
  creatorName: string;
  subTasks: TaskListSubTask[];
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
  taskMeta?: TaskModalMeta;
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
  taskMeta,
}: CreateTaskModalProps) {
  const titleId = useId();
  const descriptionId = useId();
  const isEditMode = mode === "edit";
  const editValues = isEditMode ? (values as EditTaskFormValues) : null;
  const subtaskProgress = taskMeta ? getSubtaskProgress(taskMeta.subTasks) : null;

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
        className="surface-elevated relative w-full max-w-lg overflow-visible rounded-2xl font-sans motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95 motion-safe:duration-200 motion-reduce:animate-none"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.08),transparent_60%)]"
        />

        <div className="relative border-b border-[#1a1a1a] px-6 py-5">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg border border-[#1a1a1a] bg-slate-950/60 text-slate-500 transition hover:border-[#1a1a1a] hover:text-slate-200 motion-safe:hover:scale-105 motion-reduce:transition-none"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-3 pr-10">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-500/25 bg-blue-600/10 shadow-[0_0_20px_rgba(59,130,246,0.12)]">
              <ClipboardList className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <h2
                id={titleId}
                className="text-lg font-black tracking-tight text-slate-100"
              >
                {isEditMode ? "Edit task" : "Create task"}
              </h2>
              <p id={descriptionId} className="mt-0.5 text-xs font-medium text-slate-500">
                {isEditMode
                  ? "Review details and update this team task."
                  : "Add work for your team — visible to all members."}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={onSubmit} className="relative space-y-5 px-6 py-5">
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
                onChange={(event) => patch({ type: event.target.value as TaskType })}
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

          {isEditMode && editValues ? (
            <div className="space-y-1.5">
              <label htmlFor="task-status" className={labelClassName}>
                Status
              </label>
              <select
                id="task-status"
                value={editValues.status}
                onChange={(event) =>
                  patch({ status: event.target.value as TaskStatus })
                }
                className={fieldClassName}
              >
                {TASK_STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <div className="space-y-1.5">
            <span className={labelClassName}>
              Due date <span className="normal-case tracking-normal text-slate-600">(optional)</span>
            </span>
            <TaskDueDateField
              value={values.dueDate}
              onChange={(dueDate) => patch({ dueDate })}
            />
          </div>

          {assigneeOptions.length > 0 ? (
            <fieldset className="space-y-2">
              <legend className={labelClassName}>
                Assign teammates <span className="normal-case tracking-normal text-slate-600">(optional)</span>
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
                      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-bold transition motion-safe:hover:scale-[1.02] motion-reduce:transition-none ${
                        selected
                          ? "border-blue-500/40 bg-blue-600/15 text-blue-200 shadow-[0_0_16px_rgba(59,130,246,0.15)]"
                          : "border-[#1a1a1a] bg-slate-950/50 text-slate-400 hover:border-[#1a1a1a] hover:text-slate-200"
                      }`}
                    >
                      <span
                        className={`flex h-5 w-5 items-center justify-center rounded-full text-[8px] font-black ${
                          selected
                            ? "bg-blue-600 text-white"
                            : "bg-slate-800 text-slate-400"
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

          {isEditMode && taskMeta ? (
            <div className="space-y-3 rounded-xl border border-[#1a1a1a] bg-slate-950/40 p-4">
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="font-semibold text-slate-500">Created by</span>
                <span className="font-bold text-slate-200">{taskMeta.creatorName}</span>
              </div>

              {taskMeta.subTasks.length > 0 && subtaskProgress ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wide text-slate-500">
                    <span>Subtasks</span>
                    <span className="font-mono text-slate-400">
                      {subtaskProgress.completed}/{subtaskProgress.total}
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-slate-900">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-500 transition-all duration-500"
                      style={{ width: `${subtaskProgress.percent}%` }}
                    />
                  </div>
                  <div className="max-h-32 space-y-1 overflow-y-auto">
                    {taskMeta.subTasks.map((subtask) => (
                      <div
                        key={subtask.id}
                        className="flex items-center justify-between gap-2 rounded-lg border border-[#1a1a1a] bg-slate-950/50 px-3 py-2"
                      >
                        <span className="truncate text-[11px] font-semibold text-slate-300">
                          {subtask.title}
                        </span>
                        <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                          {subtask.status === "Done"
                            ? "Done"
                            : subtask.status === "InProgress"
                              ? "In progress"
                              : "Not started"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          {submitError ? (
            <p className="rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs font-semibold text-red-300">
              {submitError}
            </p>
          ) : null}

          <div className="flex items-center justify-end gap-3 border-t border-[#1a1a1a] pt-5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-lg border border-[#1a1a1a] bg-slate-950/60 px-4 py-2 text-xs font-semibold text-slate-400 transition hover:border-[#1a1a1a] hover:text-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-blue-900/25 transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50 motion-safe:hover:scale-[1.02] motion-reduce:transition-none"
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
                  ? "Save changes"
                  : "Create task"}
            </button>
          </div>
        </form>
      </div>
    </div>
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
