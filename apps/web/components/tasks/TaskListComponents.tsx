"use client";

import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  ListTodo,
  Search,
  User,
  Users,
} from "lucide-react";

import type {
  TaskListAssignee,
  TaskListTask,
  TaskPriority,
  TaskStatus,
} from "@stlvex/database/types";
import { InlineEdit } from "@/components/InlineEdit";
import {
  TaskPriorityPicker,
  TaskStatusPicker,
  TaskTypeBadge,
} from "./TaskBadges";
import {
  formatDueDate,
  formatPersonName,
  getInitials,
  getTaskAssignees,
  isOverdue,
} from "./task-list-utils";

function AssigneeStack({ assignees }: { assignees: TaskListAssignee[] }) {
  if (assignees.length === 0) {
    return (
      <span className="text-[11px] font-semibold text-slate-500">Unassigned</span>
    );
  }

  const visible = assignees.slice(0, 3);
  const overflow = assignees.length - visible.length;

  return (
    <div className="flex items-center">
      <div className="flex -space-x-2">
        {visible.map((person) => (
          <div
            key={person.id}
            title={formatPersonName(person)}
            className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-gradient-to-br from-blue-700 to-indigo-800 text-[9px] font-bold text-white shadow-sm dark:border-[#0a0a0a]"
          >
            {getInitials(person.firstName, person.lastName)}
          </div>
        ))}
      </div>
      {overflow > 0 ? (
        <span className="ml-2 text-[10px] font-bold text-slate-500">+{overflow}</span>
      ) : null}
    </div>
  );
}

type TaskCardProps = {
  task: TaskListTask;
  onEditAssignees?: () => void;
  onUpdateTitle: (title: string) => Promise<void>;
  onUpdateDescription: (description: string) => Promise<void>;
  onUpdateStatus: (status: TaskStatus) => Promise<void>;
  onUpdatePriority: (priority: TaskPriority) => Promise<void>;
  isStatusUpdating?: boolean;
  isPriorityUpdating?: boolean;
};

export function TaskCard({
  task,
  onEditAssignees,
  onUpdateTitle,
  onUpdateDescription,
  onUpdateStatus,
  onUpdatePriority,
  isStatusUpdating = false,
  isPriorityUpdating = false,
}: TaskCardProps) {
  const dueLabel = formatDueDate(task.dueDate);
  const overdue = isOverdue(task.dueDate, task.status);
  const assignees = getTaskAssignees(task);

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-slate-300 dark:border-[#1a1a1a] dark:bg-[#0a0a0a] dark:hover:border-slate-800">
      <div className="p-4 sm:p-5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <TaskTypeBadge type={task.type} />
            <TaskPriorityPicker
              priority={task.priority}
              onPriorityChange={onUpdatePriority}
              disabled={isPriorityUpdating}
            />
            <TaskStatusPicker
              status={task.status}
              onStatusChange={onUpdateStatus}
              disabled={isStatusUpdating}
            />
          </div>

          <h3 className="mt-3 text-lg font-black tracking-tight text-slate-950 dark:text-slate-100">
            <InlineEdit
              value={task.title}
              placeholder="Task title"
              onSave={onUpdateTitle}
              className="text-lg font-black tracking-tight"
            />
          </h3>

          <div className="mt-2 max-w-3xl">
            <InlineEdit
              value={task.description ?? ""}
              placeholder="Add a description..."
              allowEmpty
              onSave={onUpdateDescription}
              className="text-sm leading-relaxed text-slate-600 dark:text-slate-400"
            />
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
            <div className="flex items-center gap-2">
              <User className="h-3.5 w-3.5 text-slate-500" />
              <span className="font-semibold text-slate-500">Created by</span>
              <span className="font-bold text-slate-800 dark:text-slate-300">
                {formatPersonName(task.creator)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-500">Assigned</span>
              <AssigneeStack assignees={assignees} />
            </div>

            {dueLabel ? (
              <div
                className={`flex items-center gap-1.5 font-bold ${
                  overdue ? "text-red-600 dark:text-red-400" : "text-slate-600 dark:text-slate-400"
                }`}
              >
                {overdue ? (
                  <AlertCircle className="h-3.5 w-3.5" />
                ) : (
                  <Calendar className="h-3.5 w-3.5" />
                )}
                Due {dueLabel}
              </div>
            ) : null}

            {onEditAssignees ? (
              <button
                type="button"
                onClick={onEditAssignees}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-600 transition hover:border-slate-300 hover:text-slate-900 dark:border-[#1a1a1a] dark:bg-[#121212]/50 dark:text-slate-400 dark:hover:text-slate-200"
              >
                <Users className="h-3.5 w-3.5" />
                Due &amp; assignees
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}

type TaskListStatsProps = {
  tasks: TaskListTask[];
};

export function TaskListStats({ tasks }: TaskListStatsProps) {
  const total = tasks.length;
  const inProgress = tasks.filter((t) => t.status === "InProgress").length;
  const done = tasks.filter((t) => t.status === "Done").length;
  const overdue = tasks.filter((t) => isOverdue(t.dueDate, t.status)).length;

  const stats = [
    {
      label: "Total tasks",
      value: total,
      icon: ListTodo,
      accent: "text-orange-600 dark:text-orange-400",
      bg: "bg-orange-500/10 border-orange-500/20",
    },
    {
      label: "In progress",
      value: inProgress,
      icon: Clock,
      accent: "text-indigo-600 dark:text-indigo-400",
      bg: "bg-indigo-500/10 border-indigo-500/20",
    },
    {
      label: "Completed",
      value: done,
      icon: CheckCircle2,
      accent: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-500/10 border-emerald-500/20",
    },
    {
      label: "Overdue",
      value: overdue,
      icon: AlertCircle,
      accent: "text-red-600 dark:text-red-400",
      bg: "bg-red-500/10 border-red-500/20",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;

        return (
          <div
            key={stat.label}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-[#1a1a1a] dark:bg-[#0a0a0a]"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                {stat.label}
              </span>
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-lg border ${stat.bg}`}
              >
                <Icon className={`h-4 w-4 ${stat.accent}`} />
              </div>
            </div>
            <p className="mt-3 text-3xl font-black tracking-tight text-slate-950 dark:text-slate-100">
              {stat.value}
            </p>
          </div>
        );
      })}
    </div>
  );
}

type TaskFiltersProps = {
  search: string;
  statusFilter: string;
  typeFilter: string;
  priorityFilter: string;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onTypeChange: (value: string) => void;
  onPriorityChange: (value: string) => void;
  resultCount: number;
};

const selectClassName =
  "rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm outline-none transition hover:border-slate-300 dark:border-[#1a1a1a] dark:bg-[#121212]/60 dark:text-slate-300 dark:hover:border-slate-700";

export function TaskFilters({
  search,
  statusFilter,
  typeFilter,
  priorityFilter,
  onSearchChange,
  onStatusChange,
  onTypeChange,
  onPriorityChange,
  resultCount,
}: TaskFiltersProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-[#1a1a1a] dark:bg-[#0a0a0a]">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search tasks..."
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs font-semibold text-slate-900 outline-none transition placeholder:text-slate-500 focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/20 dark:border-[#1a1a1a] dark:bg-[#121212]/60 dark:text-slate-200 dark:placeholder:text-slate-600"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <select
            value={statusFilter}
            onChange={(event) => onStatusChange(event.target.value)}
            className={selectClassName}
            aria-label="Filter by status"
          >
            <option value="all">All statuses</option>
            <option value="NotStarted">Not started</option>
            <option value="InProgress">In progress</option>
            <option value="Done">Done</option>
          </select>

          <select
            value={typeFilter}
            onChange={(event) => onTypeChange(event.target.value)}
            className={selectClassName}
            aria-label="Filter by type"
          >
            <option value="all">All types</option>
            <option value="Hardware">Hardware</option>
            <option value="Software">Software</option>
            <option value="CAD">CAD</option>
            <option value="Other">Other</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(event) => onPriorityChange(event.target.value)}
            className={selectClassName}
            aria-label="Filter by priority"
          >
            <option value="all">All priorities</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
      </div>

      <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">
        Showing {resultCount} task{resultCount === 1 ? "" : "s"}
      </p>
    </div>
  );
}
