"use client";

import { useMemo, useState } from "react";
import { ClipboardList } from "lucide-react";

import { useTeam } from "@/components/providers/UserProvider";
import type {
  TaskListTask,
  TaskPriority,
  TaskStatus,
  TaskType,
} from "@stlvex/database/types";
import { mockTeamTasks } from "./mock-tasks";
import {
  TaskCard,
  TaskFilters,
  TaskListStats,
} from "./TaskListComponents";
import { getTaskAssignees } from "./task-list-utils";

type TaskStatusFilter = TaskStatus | "all";
type TaskTypeFilter = TaskType | "all";
type TaskPriorityFilter = TaskPriority | "all";

function matchesSearch(task: TaskListTask, query: string): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;

  const assignees = getTaskAssignees(task);
  const haystack = [
    task.title,
    task.description ?? "",
    task.creator.firstName,
    task.creator.lastName,
    ...assignees.flatMap((a) => [a.firstName, a.lastName]),
    ...task.subTasks.map((s) => s.title),
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(normalized);
}

function filterTasks(
  tasks: TaskListTask[],
  search: string,
  status: TaskStatusFilter,
  type: TaskTypeFilter,
  priority: TaskPriorityFilter,
): TaskListTask[] {
  return tasks.filter((task) => {
    if (status !== "all" && task.status !== status) return false;
    if (type !== "all" && task.type !== type) return false;
    if (priority !== "all" && task.priority !== priority) return false;
    return matchesSearch(task, search);
  });
}

export type TaskListViewProps = {
  tasks?: TaskListTask[];
  teamLabel?: string;
};

export function TaskListView({
  tasks = mockTeamTasks,
  teamLabel,
}: TaskListViewProps) {
  const team = useTeam();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TaskStatusFilter>("all");
  const [typeFilter, setTypeFilter] = useState<TaskTypeFilter>("all");
  const [priorityFilter, setPriorityFilter] = useState<TaskPriorityFilter>("all");

  const label =
    teamLabel ??
    (team ? `${team.name} (${team.number})` : "Your team");

  const filteredTasks = useMemo(
    () => filterTasks(tasks, search, statusFilter, typeFilter, priorityFilter),
    [tasks, search, statusFilter, typeFilter, priorityFilter],
  );

  return (
    <div className="relative flex-1 overflow-y-auto bg-[#03070e] px-8 py-6 font-sans dashboard-scroll">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.06),transparent_55%)]"
      />

      <div className="relative">
        <header className="mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-600/10">
              <ClipboardList className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-blue-400/80">
                Team workspace
              </p>
              <h1 className="text-2xl font-black tracking-tight text-slate-100">
                Task List
              </h1>
            </div>
          </div>
          <p className="mt-2 max-w-2xl text-xs font-semibold text-slate-400">
            Track build, software, and CAD work for {label}. Expand any task to
            view its subtasks and progress.
          </p>
        </header>

        <div className="mb-6 space-y-4">
          <TaskListStats tasks={tasks} />
          <TaskFilters
            search={search}
            statusFilter={statusFilter}
            typeFilter={typeFilter}
            priorityFilter={priorityFilter}
            onSearchChange={setSearch}
            onStatusChange={(value) => setStatusFilter(value as TaskStatusFilter)}
            onTypeChange={(value) => setTypeFilter(value as TaskTypeFilter)}
            onPriorityChange={(value) =>
              setPriorityFilter(value as TaskPriorityFilter)
            }
            resultCount={filteredTasks.length}
          />
        </div>

        {filteredTasks.length === 0 ? (
          <div className="rounded-2xl border border-slate-900/80 bg-[#090e18]/80 p-12 text-center shadow-md">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-slate-800 bg-slate-900/60">
              <ClipboardList className="h-7 w-7 text-slate-500" />
            </div>
            <h2 className="text-lg font-black text-slate-200">No tasks found</h2>
            <p className="mt-2 text-sm text-slate-500">
              Try adjusting your filters or search query.
            </p>
          </div>
        ) : (
          <div className="space-y-4 pb-6">
            {filteredTasks.map((task, index) => (
              <TaskCard key={task.id} task={task} defaultExpanded={index === 0} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
