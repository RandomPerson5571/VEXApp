"use client";

import { useMemo, useState } from "react";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Circle,
  Clock,
  ListTodo,
  Search,
  User,
} from "lucide-react";

import type {
  TaskListAssignee,
  TaskListSubTask,
  TaskListTask,
  TaskStatus,
} from "@stlvex/database/types";
import { InlineEdit } from "@/components/InlineEdit";
import {
  TaskPriorityBadge,
  TaskStatusPicker,
  TaskStatusDot,
  TaskTypeBadge,
} from "./TaskBadges";
import {
  formatDueDate,
  formatPersonName,
  getInitials,
  getSubtaskProgress,
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
            className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#090e18] bg-gradient-to-br from-blue-700 to-indigo-800 text-[9px] font-bold text-white shadow-sm"
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

function SubtaskRow({ task }: { task: TaskListSubTask }) {
  const dueLabel = formatDueDate(task.dueDate);
  const overdue = isOverdue(task.dueDate, task.status);
  const assignees = getTaskAssignees(task);

  return (
    <div className="group/sub flex items-start gap-3 rounded-lg border border-transparent px-3 py-2.5 transition hover:border-slate-800/80 hover:bg-slate-950/40">
      <div className="mt-1.5 flex h-4 w-4 shrink-0 items-center justify-center">
        {task.status === "Done" ? (
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
        ) : task.status === "InProgress" ? (
          <Clock className="h-4 w-4 text-blue-400" />
        ) : (
          <Circle className="h-4 w-4 text-slate-600" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p
            className={`text-sm font-semibold ${
              task.status === "Done" ? "text-slate-500 line-through" : "text-slate-200"
            }`}
          >
            {task.title}
          </p>
          <TaskTypeBadge type={task.type} />
        </div>

        {task.description ? (
          <p className="mt-1 line-clamp-2 text-xs text-slate-500">{task.description}</p>
        ) : null}

        <div className="mt-2 flex flex-wrap items-center gap-3 text-[10px] font-semibold text-slate-500">
          <AssigneeStack assignees={assignees} />
          {dueLabel ? (
            <span
              className={`inline-flex items-center gap-1 ${
                overdue ? "text-red-400" : "text-slate-500"
              }`}
            >
              {overdue ? (
                <AlertCircle className="h-3 w-3" />
              ) : (
                <Calendar className="h-3 w-3" />
              )}
              {dueLabel}
            </span>
          ) : null}
        </div>
      </div>

      <TaskStatusDot status={task.status} />
    </div>
  );
}

type TaskCardProps = {
  task: TaskListTask;
  defaultExpanded?: boolean;
  onUpdateTitle: (title: string) => Promise<void>;
  onUpdateDescription: (description: string) => Promise<void>;
  onUpdateStatus: (status: TaskStatus) => Promise<void>;
  isStatusUpdating?: boolean;
};

export function TaskCard({
  task,
  defaultExpanded = false,
  onUpdateTitle,
  onUpdateDescription,
  onUpdateStatus,
  isStatusUpdating = false,
}: TaskCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const dueLabel = formatDueDate(task.dueDate);
  const overdue = isOverdue(task.dueDate, task.status);
  const assignees = getTaskAssignees(task);
  const progress = useMemo(() => getSubtaskProgress(task.subTasks), [task.subTasks]);
  const hasSubtasks = task.subTasks.length > 0;

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-900/80 bg-[#090e18]/80 shadow-md transition hover:border-slate-800">
      <div className="p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <TaskTypeBadge type={task.type} />
              <TaskPriorityBadge priority={task.priority} />
              <TaskStatusPicker
                status={task.status}
                onStatusChange={onUpdateStatus}
                disabled={isStatusUpdating}
              />
            </div>

            <h3 className="mt-3 text-lg font-black tracking-tight text-slate-100">
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
                className="text-sm leading-relaxed text-slate-400"
              />
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
              <div className="flex items-center gap-2">
                <User className="h-3.5 w-3.5 text-slate-500" />
                <span className="font-semibold text-slate-500">Created by</span>
                <span className="font-bold text-slate-300">
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
                    overdue ? "text-red-400" : "text-slate-400"
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
            </div>
          </div>

          {hasSubtasks ? (
            <div className="w-full shrink-0 lg:w-44">
              <div className="rounded-xl border border-slate-900/80 bg-slate-950/50 p-3">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wide text-slate-500">
                  <span>Subtasks</span>
                  <span className="font-mono text-slate-400">
                    {progress.completed}/{progress.total}
                  </span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-900">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-500 transition-all duration-500"
                    style={{ width: `${progress.percent}%` }}
                  />
                </div>
                <p className="mt-1.5 text-right text-[10px] font-bold text-blue-400">
                  {progress.percent}% complete
                </p>
              </div>
            </div>
          ) : null}
        </div>

        {hasSubtasks ? (
          <button
            type="button"
            onClick={() => setExpanded((open) => !open)}
            className="mt-4 inline-flex items-center gap-2 rounded-lg border border-slate-900 bg-slate-950/50 px-3 py-1.5 text-[11px] font-bold text-slate-400 transition hover:border-slate-800 hover:text-slate-200"
            aria-expanded={expanded}
          >
            <ChevronDown
              className={`h-4 w-4 transition-transform duration-200 ${
                expanded ? "rotate-180" : ""
              }`}
            />
            {expanded ? "Hide" : "Show"} {task.subTasks.length} subtask
            {task.subTasks.length === 1 ? "" : "s"}
          </button>
        ) : null}
      </div>

      {hasSubtasks && expanded ? (
        <div className="border-t border-slate-900/80 bg-slate-950/30 px-2 py-2">
          <div className="space-y-0.5">
            {task.subTasks.map((subtask) => (
              <SubtaskRow key={subtask.id} task={subtask} />
            ))}
          </div>
        </div>
      ) : null}
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
      accent: "text-blue-400",
      bg: "bg-blue-500/10 border-blue-500/20",
    },
    {
      label: "In progress",
      value: inProgress,
      icon: Clock,
      accent: "text-indigo-400",
      bg: "bg-indigo-500/10 border-indigo-500/20",
    },
    {
      label: "Completed",
      value: done,
      icon: CheckCircle2,
      accent: "text-emerald-400",
      bg: "bg-emerald-500/10 border-emerald-500/20",
    },
    {
      label: "Overdue",
      value: overdue,
      icon: AlertCircle,
      accent: "text-red-400",
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
            className="rounded-2xl border border-slate-900/80 bg-[#090e18]/80 p-4 shadow-md"
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
            <p className="mt-3 text-3xl font-black tracking-tight text-slate-100">
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
  "rounded-lg border border-slate-900 bg-slate-950/60 px-3 py-2 text-xs font-semibold text-slate-300 outline-none transition focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/20";

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
    <div className="rounded-2xl border border-slate-900/80 bg-[#090e18]/80 p-4 shadow-md">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search tasks..."
            className="w-full rounded-lg border border-slate-900 bg-slate-950/60 py-2 pl-9 pr-3 text-xs font-semibold text-slate-200 outline-none transition placeholder:text-slate-600 focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/20"
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
