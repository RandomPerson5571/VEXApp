import "server-only";

import { prisma } from "@stlvex/database";
import {
  dashboardTaskInclude,
  taskListTaskInclude,
  type DashboardTask,
  type TaskListTask,
  type TaskPriority,
  type TaskStatus,
  type TaskType,
} from "@stlvex/database/types";

export type CreateTaskInput = {
  title: string;
  description?: string | null;
  type: TaskType;
  priority: TaskPriority;
  dueDate?: Date | null;
  teamId: string;
  createdBy: string;
  assigneeIds?: string[];
};

export type UpdateTaskInput = {
  taskId: string;
  teamId: string;
  title?: string;
  description?: string | null;
  status?: TaskStatus;
};

export async function listTasksForTeam(teamId: string): Promise<TaskListTask[]> {
  return prisma.task.findMany({
    where: { teamId, parentTaskId: null },
    include: taskListTaskInclude,
    orderBy: [{ dueDate: "asc" }],
  });
}

export async function listDashboardTasksForTeam(
  teamId: string,
  limit = 4,
): Promise<DashboardTask[]> {
  return prisma.task.findMany({
    where: {
      teamId,
      parentTaskId: null,
      status: { not: "Done" },
    },
    include: dashboardTaskInclude,
    orderBy: [{ priority: "desc" }, { dueDate: "asc" }],
    take: limit,
  });
}

export async function createTaskForTeam(
  input: CreateTaskInput,
): Promise<TaskListTask> {
  const assigneeIds = [...new Set(input.assigneeIds ?? [])];

  if (assigneeIds.length > 0) {
    const validAssigneeCount = await prisma.user.count({
      where: { teamId: input.teamId, id: { in: assigneeIds } },
    });

    if (validAssigneeCount !== assigneeIds.length) {
      throw new Error("One or more assignees are not on this team.");
    }
  }

  return prisma.task.create({
    data: {
      title: input.title.trim(),
      description: input.description?.trim() || null,
      type: input.type,
      priority: input.priority,
      dueDate: input.dueDate ?? undefined,
      teamId: input.teamId,
      createdBy: input.createdBy,
      assignments:
        assigneeIds.length > 0
          ? { create: assigneeIds.map((userId) => ({ userId })) }
          : undefined,
    },
    include: taskListTaskInclude,
  });
}

export async function updateTaskForTeam(
  input: UpdateTaskInput,
): Promise<TaskListTask> {
  const existing = await prisma.task.findFirst({
    where: { id: input.taskId, teamId: input.teamId },
    select: { id: true },
  });

  if (!existing) {
    throw new Error("Task not found.");
  }

  const data: {
    title?: string;
    description?: string | null;
    status?: TaskStatus;
  } = {};

  if (input.title !== undefined) {
    const title = input.title.trim();
    if (!title) {
      throw new Error("Title is required.");
    }
    data.title = title;
  }

  if (input.description !== undefined) {
    data.description = input.description?.trim() || null;
  }

  if (input.status !== undefined) {
    data.status = input.status;
  }

  if (Object.keys(data).length === 0) {
    throw new Error("No changes to save.");
  }

  return prisma.task.update({
    where: { id: input.taskId },
    data,
    include: taskListTaskInclude,
  });
}
