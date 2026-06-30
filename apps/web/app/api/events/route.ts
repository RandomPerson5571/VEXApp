import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/current-user";
import { getTeamCalendarEvents } from "@/lib/queries/events.server";

export async function GET() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  if (!currentUser.profile.teamId) {
    return NextResponse.json([]);
  }

  const events = await getTeamCalendarEvents(currentUser.profile.teamId);
  return NextResponse.json(events);
}
