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
import { isQueryInitiallyLoading } from "@/lib/hooks/use-query-loading";
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
import { DashboardRowSkeleton } from "./dashboard-skeletons";

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
      className="group block rounded-3xl border border-slate-300 dark:border-white/10 bg-slate-100 dark:bg-slate-950/60 p-4 transition duration-200 hover:-translate-y-1 hover:border-slate-400 dark:hover:border-white/20 hover:bg-slate-200 dark:hover:bg-slate-900/80 motion-safe:will-change-transform"
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
              <p className="truncate text-sm font-extrabold text-slate-900 dark:text-white group-hover:text-slate-700 dark:group-hover:text-slate-200">
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
                  overdue ? "text-red-600 dark:text-red-400" : "text-slate-500 dark:text-slate-500"
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
  const tasksQuery = useDashboardTasks();
  const summaryQuery = useDashboardSummary();
  const { data: tasks = [] } = tasksQuery;
  const { data: summary } = summaryQuery;
  const isInitialLoading =
    isQueryInitiallyLoading(tasksQuery) ||
    isQueryInitiallyLoading(summaryQuery);
  const displayTasks = tasks.slice(0, maxItems);
  const activeCount = summary?.incompleteTasks ?? 0;
  const overdueCount = summary?.overdueTasks ?? 0;
  const completedCount = summary?.completedTasks ?? 0;

  return (
    <div className="relative overflow-hidden rounded-[32px] border border-slate-200 dark:border-white/10 bg-white dark:bg-[#091126]/80 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.08)] dark:shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.16),transparent_35%)]"
      />

      <div className="relative flex flex-col">
        <div className="flex items-start justify-between border-b border-slate-300 dark:border-white/10 pb-3 mb-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-blue-400/20 bg-blue-500/10">
                <ListTodo className="h-4 w-4 text-blue-600 dark:text-blue-300" />
              </div>
              <h3 className="text-sm font-black uppercase tracking-[0.24em] text-slate-900 dark:text-slate-100">
                Team Tasks
              </h3>
            </div>
            <p className="mt-1 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
              Active work across build, software, and CAD
            </p>
          </div>
          <Link
            href="/task-list"
            className="text-[10px] font-bold text-orange-600 dark:text-orange-500 hover:underline flex items-center gap-0.5"
          >
            View All
            <ChevronRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {isInitialLoading ? (
            <>
              <div className="h-7 w-24 animate-pulse rounded-full bg-slate-100 dark:bg-slate-950/60" />
              <div className="h-7 w-28 animate-pulse rounded-full bg-slate-100 dark:bg-slate-950/60" />
            </>
          ) : (
            <>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1.5 text-[10px] font-bold text-blue-600 dark:text-blue-300">
                <Clock className="h-3 w-3" />
                {activeCount} active
              </span>
              {overdueCount > 0 ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-red-400/20 bg-red-500/10 px-3 py-1.5 text-[10px] font-bold text-red-600 dark:text-red-300">
                  <AlertCircle className="h-3 w-3" />
                  {overdueCount} overdue
                </span>
              ) : null}
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-300">
                {completedCount} completed
              </span>
            </>
          )}
        </div>

        <div className="space-y-2.5 motion-safe:[&>*]:animate-in motion-safe:[&>*]:fade-in motion-safe:[&>*]:slide-in-from-bottom-1 motion-safe:[&>*]:duration-300">
          {isInitialLoading ? (
            Array.from({ length: maxItems }).map((_, index) => (
              <DashboardRowSkeleton key={index} className="h-[88px]" />
            ))
          ) : displayTasks.length === 0 ? (
            <div className="rounded-3xl border border-slate-300 dark:border-white/10 bg-slate-100 dark:bg-slate-950/60 px-4 py-8 text-center">
              <p className="text-sm font-bold text-slate-900 dark:text-white">All caught up</p>
              <p className="mt-1 text-[11px] text-slate-600 dark:text-slate-400">No open tasks right now.</p>
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
