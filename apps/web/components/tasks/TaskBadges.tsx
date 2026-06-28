import {
  Box,
  CircleDot,
  Cpu,
  Layers,
  MoreHorizontal,
} from "lucide-react";

import type {
  TaskPriority,
  TaskStatus,
  TaskType,
} from "@stlvex/database/types";

const statusConfig: Record<
  TaskStatus,
  { label: string; className: string; dotClassName: string }
> = {
  NotStarted: {
    label: "Not started",
    className: "bg-slate-500/10 text-slate-400 border-slate-600/30",
    dotClassName: "bg-slate-500",
  },
  InProgress: {
    label: "In progress",
    className: "bg-blue-500/10 text-blue-400 border-blue-500/25",
    dotClassName: "bg-blue-500",
  },
  Done: {
    label: "Done",
    className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/25",
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
    className: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  },
  Software: {
    label: "Software",
    icon: Cpu,
    className: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  },
  CAD: {
    label: "CAD",
    icon: Layers,
    className: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  },
  Other: {
    label: "Other",
    icon: MoreHorizontal,
    className: "bg-slate-500/10 text-slate-400 border-slate-600/30",
  },
};

const priorityConfig: Record<
  TaskPriority,
  { label: string; className: string }
> = {
  Low: {
    label: "Low",
    className: "bg-slate-500/10 text-slate-400 border-slate-600/30",
  },
  Medium: {
    label: "Medium",
    className: "bg-amber-500/10 text-amber-400 border-amber-500/25",
  },
  High: {
    label: "High",
    className: "bg-red-500/10 text-red-400 border-red-500/25",
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

export function TaskStatusDot({ status }: { status: TaskStatus }) {
  const config = statusConfig[status];

  return (
    <span
      className={`h-2 w-2 shrink-0 rounded-full ${config.dotClassName}`}
      aria-hidden
    />
  );
}
