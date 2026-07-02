import "server-only";

import {
  createTaskForTeam,
  listDashboardTasksForTeam,
  listTasksForTeam,
  updateTaskForTeam,
  type CreateTaskInput,
  type UpdateTaskInput,
} from "@/lib/data/tasks";
import {
  createDashboardTasksQueryOptions,
  createTeamTasksQueryOptions,
} from "@/lib/queries/shared/tasks";
import type { DashboardTask, TaskListTask } from "@stlvex/database/types";

export async function getTeamTasks(teamId: string): Promise<TaskListTask[]> {
  return listTasksForTeam(teamId);
}

export async function getDashboardTasks(
  teamId: string,
  limit = 4,
): Promise<DashboardTask[]> {
  return listDashboardTasksForTeam(teamId, limit);
}

export async function createTeamTask(input: CreateTaskInput): Promise<TaskListTask> {
  return createTaskForTeam(input);
}

export async function updateTeamTask(input: UpdateTaskInput): Promise<TaskListTask> {
  return updateTaskForTeam(input);
}

export function teamTasksQueryOptions(teamId: string) {
  return createTeamTasksQueryOptions(teamId, () => getTeamTasks(teamId));
}

export function dashboardTasksQueryOptions(teamId: string, limit = 4) {
  return createDashboardTasksQueryOptions(teamId, limit, () =>
    getDashboardTasks(teamId, limit),
  );
}
