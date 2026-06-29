import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/current-user";
import { getTeamDashboardSummary } from "@/lib/queries/dashboard-summary.server";

export async function GET() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  if (!currentUser.profile.teamId) {
    return NextResponse.json({ error: "No team assigned." }, { status: 404 });
  }

  const summary = await getTeamDashboardSummary(currentUser.profile.teamId);
  return NextResponse.json(summary);
}
