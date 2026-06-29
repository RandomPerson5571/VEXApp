import { queryKeys } from "@/lib/query-client";
import type { TaskPriority, TaskListTask, TaskStatus, TaskType } from "@stlvex/database/types";

export type CreateTaskPayload = {
  title: string;
  description?: string;
  type: TaskType;
  priority: TaskPriority;
  dueDate?: string;
  assigneeIds?: string[];
};

export type UpdateTaskPayload = {
  taskId: string;
  title?: string;
  description?: string;
  status?: TaskStatus;
};

export async function fetchTeamTasksFromApi(): Promise<TaskListTask[]> {
  const response = await fetch("/api/tasks");

  if (!response.ok) {
    throw new Error("Failed to fetch team tasks.");
  }

  return response.json() as Promise<TaskListTask[]>;
}

export async function createTeamTaskFromApi(
  payload: CreateTaskPayload,
): Promise<TaskListTask> {
  const response = await fetch("/api/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const body = (await response.json()) as TaskListTask | { error?: string };

  if (!response.ok) {
    throw new Error(
      "error" in body && body.error ? body.error : "Failed to create task.",
    );
  }

  return body as TaskListTask;
}

export async function updateTeamTaskFromApi(
  payload: UpdateTaskPayload,
): Promise<TaskListTask> {
  const { taskId, ...body } = payload;
  const response = await fetch(`/api/tasks/${taskId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const responseBody = (await response.json()) as TaskListTask | { error?: string };

  if (!response.ok) {
    throw new Error(
      "error" in responseBody && responseBody.error
        ? responseBody.error
        : "Failed to update task.",
    );
  }

  return responseBody as TaskListTask;
}

export function teamTasksQueryOptions(teamId: string) {
  return {
    queryKey: queryKeys.tasks.forTeam(teamId),
    queryFn: fetchTeamTasksFromApi,
  };
}
