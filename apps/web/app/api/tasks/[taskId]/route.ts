import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/current-user";
import { updateTeamTask } from "@/lib/queries/tasks.server";
import type { TaskStatus } from "@stlvex/database/types";

const TASK_STATUSES = new Set<TaskStatus>(["NotStarted", "InProgress", "Done"]);

type UpdateTaskRequestBody = {
  title?: string;
  description?: string;
  status?: TaskStatus;
};

type RouteContext = {
  params: Promise<{ taskId: string }>;
};

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

  if (!hasTitle && !hasDescription && !hasStatus) {
    return NextResponse.json(
      { error: "At least one field to update is required." },
      { status: 400 },
    );
  }

  if (hasStatus && (!body.status || !TASK_STATUSES.has(body.status))) {
    return NextResponse.json({ error: "Invalid task status." }, { status: 400 });
  }

  try {
    const task = await updateTeamTask({
      taskId,
      teamId,
      title: hasTitle ? body.title : undefined,
      description: hasDescription ? body.description ?? null : undefined,
      status: hasStatus ? body.status : undefined,
    });

    return NextResponse.json(task);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update task.";

    const status = message === "Task not found." ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
