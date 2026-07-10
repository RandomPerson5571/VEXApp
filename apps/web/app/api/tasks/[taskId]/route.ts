import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/current-user";
import { enforceApiRateLimit } from "@/lib/security/enforce-api-rate-limit";
import { updateTeamTask } from "@/lib/queries/tasks.server";
import type { TaskPriority, TaskStatus, TaskType } from "@stlvex/database/types";

const TASK_STATUSES = new Set<TaskStatus>(["NotStarted", "InProgress", "Done"]);
const TASK_TYPES = new Set<TaskType>(["Hardware", "Software", "CAD", "Other"]);
const TASK_PRIORITIES = new Set<TaskPriority>(["Low", "Medium", "High"]);

type UpdateTaskRequestBody = {
  title?: string;
  description?: string;
  status?: TaskStatus;
  type?: TaskType;
  priority?: TaskPriority;
  dueDate?: string | null;
  assigneeIds?: string[];
};

type RouteContext = {
  params: Promise<{ taskId: string }>;
};

function parseDueDate(dueDate: string | null | undefined): Date | null | undefined {
  if (dueDate === undefined) return undefined;
  if (!dueDate?.trim()) return null;
  return new Date(`${dueDate.trim()}T17:00:00.000Z`);
}

export async function PATCH(request: Request, context: RouteContext) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const teamId = currentUser.profile.teamId;

  if (!teamId) {
    return NextResponse.json(
      { error: "You must belong to a team to update tasks." },
      { status: 400 },
    );
  }

  const limited = await enforceApiRateLimit(
    request,
    currentUser.profile.id,
    "team",
  );
  if (limited) return limited;

  const { taskId } = await context.params;

  if (!taskId?.trim()) {
    return NextResponse.json({ error: "Task id is required." }, { status: 400 });
  }

  let body: UpdateTaskRequestBody;

  try {
    body = (await request.json()) as UpdateTaskRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const hasTitle = body.title !== undefined;
  const hasDescription = body.description !== undefined;
  const hasStatus = body.status !== undefined;
  const hasType = body.type !== undefined;
  const hasPriority = body.priority !== undefined;
  const hasDueDate = body.dueDate !== undefined;
  const hasAssigneeIds = body.assigneeIds !== undefined;

  if (
    !hasTitle &&
    !hasDescription &&
    !hasStatus &&
    !hasType &&
    !hasPriority &&
    !hasDueDate &&
    !hasAssigneeIds
  ) {
    return NextResponse.json(
      { error: "At least one field to update is required." },
      { status: 400 },
    );
  }

  if (hasStatus && (!body.status || !TASK_STATUSES.has(body.status))) {
    return NextResponse.json({ error: "Invalid task status." }, { status: 400 });
  }

  if (hasType && (!body.type || !TASK_TYPES.has(body.type))) {
    return NextResponse.json({ error: "Invalid task type." }, { status: 400 });
  }

  if (hasPriority && (!body.priority || !TASK_PRIORITIES.has(body.priority))) {
    return NextResponse.json({ error: "Invalid task priority." }, { status: 400 });
  }

  const assigneeIds = hasAssigneeIds
    ? Array.isArray(body.assigneeIds)
      ? body.assigneeIds.filter((id): id is string => typeof id === "string")
      : []
    : undefined;

  try {
    const task = await updateTeamTask({
      taskId,
      teamId,
      title: hasTitle ? body.title : undefined,
      description: hasDescription ? body.description ?? null : undefined,
      status: hasStatus ? body.status : undefined,
      type: hasType ? body.type : undefined,
      priority: hasPriority ? body.priority : undefined,
      dueDate: hasDueDate ? parseDueDate(body.dueDate) : undefined,
      assigneeIds,
    });

    return NextResponse.json(task);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update task.";

    const status = message === "Task not found." ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
