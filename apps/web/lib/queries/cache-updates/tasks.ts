import type { QueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-client";
import type { DashboardTask, TaskListTask } from "@stlvex/database/types";

type TaskListPatch = Partial<
  Pick<
    TaskListTask,
    "title" | "description" | "status" | "type" | "priority" | "dueDate"
  >
>;

/** Pure merge: replace one task in a team list by id. */
export function mergeTaskInList(
  tasks: TaskListTask[],
  updatedTask: TaskListTask,
): TaskListTask[] {
  return tasks.map((task) =>
    task.id === updatedTask.id ? updatedTask : task,
  );
}

/** Pure merge: patch or remove a task in dashboard widget caches. */
export function patchDashboardTasksList(
  dashboardTasks: DashboardTask[],
  updatedTask: Pick<TaskListTask, "id" | "title" | "status">,
): DashboardTask[] {
  if (updatedTask.status === "Done") {
    return dashboardTasks.filter((task) => task.id !== updatedTask.id);
  }

  const index = dashboardTasks.findIndex((task) => task.id === updatedTask.id);
  if (index === -1) return dashboardTasks;

  return dashboardTasks.map((task) =>
    task.id === updatedTask.id
      ? {
          ...task,
          title: updatedTask.title,
          status: updatedTask.status,
        }
      : task,
  );
}

function patchDashboardTaskCaches(
  queryClient: QueryClient,
  teamId: string,
  taskId: string,
  patch: { title?: string; status?: TaskListTask["status"] },
): void {
  queryClient.setQueriesData<DashboardTask[]>(
    { queryKey: ["dashboard", "tasks", teamId] },
    (old) => {
      if (!old) return old;

      if (patch.status === "Done") {
        return old.filter((task) => task.id !== taskId);
      }

      const index = old.findIndex((task) => task.id === taskId);
      if (index === -1) return old;

      return old.map((task) =>
        task.id === taskId
          ? {
              ...task,
              ...(patch.title !== undefined ? { title: patch.title } : {}),
              ...(patch.status !== undefined ? { status: patch.status } : {}),
            }
          : task,
      );
    },
  );
}

/** Merge authoritative PATCH response into team task list and dashboard caches. */
export function applyTeamTaskPatch(
  queryClient: QueryClient,
  teamId: string,
  updatedTask: TaskListTask,
): void {
  queryClient.setQueryData<TaskListTask[]>(
    queryKeys.tasks.forTeam(teamId),
    (old) => (old ? mergeTaskInList(old, updatedTask) : old),
  );

  queryClient.setQueriesData<DashboardTask[]>(
    { queryKey: ["dashboard", "tasks", teamId] },
    (old) => (old ? patchDashboardTasksList(old, updatedTask) : old),
  );
}

/** Prepend a newly created task to the team list cache. */
export function prependTeamTask(
  queryClient: QueryClient,
  teamId: string,
  newTask: TaskListTask,
): void {
  queryClient.setQueryData<TaskListTask[]>(
    queryKeys.tasks.forTeam(teamId),
    (old) => (old ? [newTask, ...old] : [newTask]),
  );
}

/** Optimistic partial update before PATCH resolves. */
export function optimisticallyPatchTeamTask(
  queryClient: QueryClient,
  teamId: string,
  taskId: string,
  patch: TaskListPatch,
): void {
  queryClient.setQueryData<TaskListTask[]>(
    queryKeys.tasks.forTeam(teamId),
    (old) => {
      if (!old) return old;
      return old.map((task) =>
        task.id === taskId ? { ...task, ...patch } : task,
      );
    },
  );

  if (patch.title !== undefined || patch.status !== undefined) {
    patchDashboardTaskCaches(queryClient, teamId, taskId, {
      title: patch.title,
      status: patch.status,
    });
  }
}
