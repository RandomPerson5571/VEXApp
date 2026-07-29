import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/current-user";
import { getUpcomingRobotEventsForTeamNumber } from "@/lib/robotevents/upcoming-events.server";

export async function GET() {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const team = currentUser.team;
    if (!team?.number) {
      return NextResponse.json({ error: "No team assigned." }, { status: 404 });
    }

    const result = await getUpcomingRobotEventsForTeamNumber(team.number);
    return NextResponse.json(result);
  } catch {
    // ponytail: never 500 the calendar merge path for RE outages
    return NextResponse.json({
      configured: true,
      available: false,
      teamNumber: "",
      events: [],
    });
  }
}
