import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/current-user";
import { getDashboardTasks } from "@/lib/queries/tasks.server";

export async function GET() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  if (!currentUser.profile.teamId) {
    return NextResponse.json([]);
  }

  const tasks = await getDashboardTasks(currentUser.profile.teamId);
  return NextResponse.json(tasks);
}
