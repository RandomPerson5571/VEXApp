import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/current-user";
import { enforceApiRateLimit } from "@/lib/security/enforce-api-rate-limit";
import { createTeamTask, getTeamTasks } from "@/lib/queries/tasks.server";
import type { TaskPriority, TaskType } from "@stlvex/database/types";

const TASK_TYPES = new Set<TaskType>(["Hardware", "Software", "CAD", "Other"]);
const TASK_PRIORITIES = new Set<TaskPriority>(["Low", "Medium", "High"]);

type CreateTaskRequestBody = {
  title?: string;
  description?: string;
  type?: TaskType;
  priority?: TaskPriority;
  dueDate?: string;
  assigneeIds?: string[];
};

function parseDueDate(dueDate: string | undefined): Date | null {
  if (!dueDate?.trim()) return null;
  return new Date(`${dueDate.trim()}T17:00:00.000Z`);
}

export async function GET() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  if (!currentUser.profile.teamId) {
    return NextResponse.json([]);
  }

  const tasks = await getTeamTasks(currentUser.profile.teamId);
  return NextResponse.json(tasks);
}

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const teamId = currentUser.profile.teamId;

  if (!teamId) {
    return NextResponse.json(
      { error: "You must belong to a team to create tasks." },
      { status: 400 },
    );
  }

  const limited = await enforceApiRateLimit(
    request,
    currentUser.profile.id,
    "team",
  );
  if (limited) return limited;

  let body: CreateTaskRequestBody;

  try {
    body = (await request.json()) as CreateTaskRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const title = body.title?.trim();

  if (!title) {
    return NextResponse.json({ error: "Title is required." }, { status: 400 });
  }

  if (!body.type || !TASK_TYPES.has(body.type)) {
    return NextResponse.json({ error: "Invalid task type." }, { status: 400 });
  }

  if (!body.priority || !TASK_PRIORITIES.has(body.priority)) {
    return NextResponse.json({ error: "Invalid task priority." }, { status: 400 });
  }

  const assigneeIds = Array.isArray(body.assigneeIds)
    ? body.assigneeIds.filter((id): id is string => typeof id === "string")
    : [];

  try {
    const task = await createTeamTask({
      title,
      description: body.description ?? null,
      type: body.type,
      priority: body.priority,
      dueDate: parseDueDate(body.dueDate),
      teamId,
      createdBy: currentUser.profile.id,
      assigneeIds,
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create task.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
