import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/current-user";
import { getUpcomingRobotEventsForTeamNumber } from "@/lib/robotevents/upcoming-events.server";

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }
    if (!currentUser.team?.number) {
      return NextResponse.json({ error: "No team assigned." }, { status: 404 });
    }

    const start = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const result = await getUpcomingRobotEventsForTeamNumber(
      currentUser.team.number,
      start,
    );

    return NextResponse.json({
      ...result,
      events: result.events.map((event) => ({
        id: Number(event.id.replace(/^re-/, "")),
        name: event.title,
        date: event.date,
        sku: event.time,
      })),
    });
  } catch {
    return NextResponse.json({
      configured: true,
      available: false,
      teamNumber: "",
      events: [],
    });
  }
}
