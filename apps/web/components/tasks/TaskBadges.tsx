import {
  Box,
  CircleDot,
  Cpu,
  Layers,
  MoreHorizontal,
} from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@stlvex/ui/components/select";

import type {
  TaskPriority,
  TaskStatus,
  TaskType,
} from "@stlvex/database/types";

const TASK_STATUS_OPTIONS: TaskStatus[] = ["NotStarted", "InProgress", "Done"];
const TASK_PRIORITY_OPTIONS: TaskPriority[] = ["Low", "Medium", "High"];

const statusConfig: Record<
  TaskStatus,
  { label: string; className: string; dotClassName: string }
> = {
  NotStarted: {
    label: "Not started",
    className: "bg-slate-500/10 text-slate-600 border-slate-600/30 dark:text-slate-400",
    dotClassName: "bg-slate-500",
  },
  InProgress: {
    label: "In progress",
    className: "bg-blue-500/10 text-blue-600 border-blue-500/25 dark:text-blue-400",
    dotClassName: "bg-blue-500",
  },
  Done: {
    label: "Done",
    className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/25 dark:text-emerald-400",
    dotClassName: "bg-emerald-500",
  },
};

const typeConfig: Record<
  TaskType,
  { label: string; icon: typeof Cpu; className: string }
> = {
  Hardware: {
    label: "Hardware",
    icon: Box,
    className: "bg-orange-500/10 text-orange-600 border-orange-500/20 dark:text-orange-400",
  },
  Software: {
    label: "Software",
    icon: Cpu,
    className: "bg-violet-500/10 text-violet-600 border-violet-500/20 dark:text-violet-400",
  },
  CAD: {
    label: "CAD",
    icon: Layers,
    className: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20 dark:text-cyan-400",
  },
  Other: {
    label: "Other",
    icon: MoreHorizontal,
    className: "bg-slate-500/10 text-slate-600 border-slate-600/30 dark:text-slate-400",
  },
};

const priorityConfig: Record<
  TaskPriority,
  { label: string; className: string }
> = {
  Low: {
    label: "Low",
    className: "bg-slate-500/10 text-slate-600 border-slate-600/30 dark:text-slate-400",
  },
  Medium: {
    label: "Medium",
    className: "bg-amber-500/10 text-amber-600 border-amber-500/25 dark:text-amber-400",
  },
  High: {
    label: "High",
    className: "bg-red-500/10 text-red-600 border-red-500/25 dark:text-red-400",
  },
};

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  const config = statusConfig[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${config.className}`}
    >
      <CircleDot className="h-3 w-3" />
      {config.label}
    </span>
  );
}

type TaskStatusPickerProps = {
  status: TaskStatus;
  onStatusChange: (status: TaskStatus) => void | Promise<void>;
  disabled?: boolean;
};

export function TaskStatusPicker({
  status,
  onStatusChange,
  disabled = false,
}: TaskStatusPickerProps) {
  const config = statusConfig[status];

  return (
    <Select
      value={status}
      onValueChange={(value) => {
        void onStatusChange(value as TaskStatus);
      }}
      disabled={disabled}
    >
      <SelectTrigger
        aria-label="Change task status"
        className={`h-auto w-auto gap-1 rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide shadow-none transition hover:brightness-110 focus:ring-2 focus:ring-blue-500/30 data-[placeholder]:text-inherit [&_svg:last-child]:h-3 [&_svg:last-child]:w-3 [&_svg:last-child]:opacity-60 ${config.className}`}
      >
        <CircleDot className="h-3 w-3 shrink-0" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="min-w-[9rem] border-slate-200 bg-white text-slate-800 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200">
        {TASK_STATUS_OPTIONS.map((option) => {
          const optionConfig = statusConfig[option];

          return (
            <SelectItem
              key={option}
              value={option}
              className="pr-2 text-xs font-semibold focus:bg-slate-100 focus:text-slate-950 dark:focus:bg-slate-800 dark:focus:text-slate-100 [&>span:first-child]:hidden"
            >
              <span className="inline-flex items-center gap-2">
                <span
                  className={`h-2 w-2 rounded-full ${optionConfig.dotClassName}`}
                  aria-hidden
                />
                {optionConfig.label}
              </span>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}

export function TaskTypeBadge({ type }: { type: TaskType }) {
  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${config.className}`}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
}

export function TaskPriorityBadge({ priority }: { priority: TaskPriority | null }) {
  if (!priority) return null;

  const config = priorityConfig[priority];

  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${config.className}`}
    >
      {config.label}
    </span>
  );
}

type TaskPriorityPickerProps = {
  priority: TaskPriority | null;
  onPriorityChange: (priority: TaskPriority) => void | Promise<void>;
  disabled?: boolean;
};

export function TaskPriorityPicker({
  priority,
  onPriorityChange,
  disabled = false,
}: TaskPriorityPickerProps) {
  if (!priority) return null;

  const config = priorityConfig[priority];

  return (
    <Select
      value={priority}
      onValueChange={(value) => {
        void onPriorityChange(value as TaskPriority);
      }}
      disabled={disabled}
    >
      <SelectTrigger
        aria-label="Change task priority"
        className={`h-auto w-auto gap-1 rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide shadow-none transition hover:brightness-110 focus:ring-2 focus:ring-blue-500/30 data-[placeholder]:text-inherit [&_svg:last-child]:h-3 [&_svg:last-child]:w-3 [&_svg:last-child]:opacity-60 ${config.className}`}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="min-w-[9rem] border-slate-200 bg-white text-slate-800 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200">
        {TASK_PRIORITY_OPTIONS.map((option) => {
          const optionConfig = priorityConfig[option];

          return (
            <SelectItem
              key={option}
              value={option}
              className="pr-2 text-xs font-semibold focus:bg-slate-100 focus:text-slate-950 dark:focus:bg-slate-800 dark:focus:text-slate-100 [&>span:first-child]:hidden"
            >
              <span
                className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${optionConfig.className}`}
              >
                {optionConfig.label}
              </span>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}

export function TaskStatusDot({ status }: { status: TaskStatus }) {
  const config = statusConfig[status];

  return (
    <span
      className={`h-2 w-2 shrink-0 rounded-full ${config.dotClassName}`}
      aria-hidden
    />
  );
}
