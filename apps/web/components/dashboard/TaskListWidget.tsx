"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import {
  AlertCircle,
  Calendar,
  ChevronRight,
  Clock,
  ListTodo,
} from "lucide-react";

import type { DashboardTask, TaskListAssignee } from "@stlvex/database/types";
import { useDashboardSummary } from "@/lib/hooks/use-dashboard-summary";
import { useDashboardTasks } from "@/lib/hooks/use-dashboard-tasks";
import {
  TaskPriorityBadge,
  TaskStatusDot,
  TaskTypeBadge,
} from "@/components/tasks/TaskBadges";
import {
  formatDueDate,
  getInitials,
  getTaskAssignees,
  isOverdue,
} from "@/components/tasks/task-list-utils";

function AssigneeStack({ assignees }: { assignees: TaskListAssignee[] }) {
  if (assignees.length === 0) {
    return <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-600">Unassigned</span>;
  }

  const visible = assignees.slice(0, 3);
  const overflow = assignees.length - visible.length;

  return (
    <div className="flex items-center">
      <div className="flex -space-x-1.5">
        {visible.map((person) => (
          <div
            key={person.id}
            title={`${person.firstName} ${person.lastName}`}
            className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-gradient-to-br from-blue-700 to-indigo-800 text-[8px] font-bold text-white dark:border-[#090e18]"
          >
            {getInitials(person.firstName, person.lastName)}
          </div>
        ))}
      </div>
      {overflow > 0 ? (
        <span className="ml-1.5 text-[9px] font-bold text-slate-500">+{overflow}</span>
      ) : null}
    </div>
  );
}

function TaskRow({ task, index }: { task: DashboardTask; index: number }) {
  const dueLabel = formatDueDate(task.dueDate);
  const overdue = isOverdue(task.dueDate, task.status);
  const assignees = getTaskAssignees(task);

  return (
    <Link
      href="/task-list"
      className="group block rounded-xl border border-slate-200 bg-slate-50 p-3.5 transition duration-200 hover:border-slate-300 hover:bg-white dark:border-slate-900/80 dark:bg-slate-950/40 dark:hover:border-slate-700/80 dark:hover:bg-slate-950/70 motion-safe:hover:-translate-y-px"
      style={
        {
          animationDelay: `${index * 60}ms`,
        } as CSSProperties
      }
    >
      <div className="flex items-start gap-3">
        <div className="mt-1.5">
          <TaskStatusDot status={task.status} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-extrabold text-slate-900 group-hover:text-slate-700 dark:text-slate-100 dark:group-hover:text-white">
              {task.title}
            </p>
            <TaskTypeBadge type={task.type} />
            {task.priority ? <TaskPriorityBadge priority={task.priority} /> : null}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5">
            <AssigneeStack assignees={assignees} />

            {dueLabel ? (
              <span
                className={`inline-flex items-center gap-1 text-[10px] font-bold ${
                  overdue ? "text-red-400" : "text-slate-500"
                }`}
              >
                {overdue ? (
                  <AlertCircle className="h-3 w-3" />
                ) : (
                  <Calendar className="h-3 w-3" />
                )}
                {overdue ? "Overdue · " : "Due "}
                {dueLabel}
              </span>
            ) : null}
          </div>
        </div>

        <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-slate-400 transition group-hover:text-slate-600 dark:text-slate-700 dark:group-hover:text-slate-400" />
      </div>
    </Link>
  );
}

export type TaskListWidgetProps = {
  maxItems?: number;
};

export function TaskListWidget({ maxItems = 4 }: TaskListWidgetProps) {
  const { data: tasks = [], isLoading: tasksLoading } = useDashboardTasks();
  const { data: summary, isLoading: summaryLoading } = useDashboardSummary();
  const isLoading = tasksLoading || summaryLoading;
  const displayTasks = tasks.slice(0, maxItems);
  const activeCount = summary?.incompleteTasks ?? 0;
  const overdueCount = summary?.overdueTasks ?? 0;
  const completedCount = summary?.completedTasks ?? 0;

  return (
    <div
      className={`relative lg:col-span-7 overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-md dark:border-slate-900/80 dark:bg-[#090e18]/80 ${isLoading ? "opacity-50" : ""}`}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(249,115,22,0.06),transparent_50%)] dark:bg-[radial-gradient(ellipse_at_top_left,rgba(59,130,246,0.07),transparent_50%)]"
      />

      <div className="relative flex flex-col">
        <div className="flex items-start justify-between border-b border-slate-200 pb-3 mb-4 dark:border-slate-900">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-blue-500/20 bg-blue-600/10">
                <ListTodo className="h-3.5 w-3.5 text-blue-400" />
              </div>
              <h3 className="text-sm font-black uppercase tracking-wide text-slate-900 dark:text-slate-200">
                Team Tasks
              </h3>
            </div>
            <p className="mt-1 text-[11px] font-semibold text-slate-500">
              Active work across build, software, and CAD
            </p>
          </div>
          <Link
            href="/task-list"
            className="text-[10px] font-bold text-orange-500 hover:underline flex items-center gap-0.5"
          >
            View All
            <ChevronRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-blue-500/20 bg-blue-500/10 px-2.5 py-1 text-[10px] font-bold text-blue-400">
            <Clock className="h-3 w-3" />
            {activeCount} active
          </span>
          {overdueCount > 0 ? (
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/10 px-2.5 py-1 text-[10px] font-bold text-red-400">
              <AlertCircle className="h-3 w-3" />
              {overdueCount} overdue
            </span>
          ) : null}
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold text-emerald-400">
            {completedCount} completed
          </span>
        </div>

        <div className="space-y-2.5 motion-safe:[&>*]:animate-in motion-safe:[&>*]:fade-in motion-safe:[&>*]:slide-in-from-bottom-1 motion-safe:[&>*]:duration-300">
          {displayTasks.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-8 text-center dark:border-slate-900/80 dark:bg-slate-950/40">
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">All caught up</p>
              <p className="mt-1 text-[11px] text-slate-500">No open tasks right now.</p>
            </div>
          ) : (
            displayTasks.map((task, index) => (
              <TaskRow key={task.id} task={task} index={index} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
