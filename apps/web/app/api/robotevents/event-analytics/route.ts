import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/current-user";
import { getEventAnalytics } from "@/lib/robotevents/event-analytics.server";

export async function GET(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  if (!currentUser.team?.number) {
    return NextResponse.json({ error: "No team assigned." }, { status: 404 });
  }

  const eventId = Number(new URL(request.url).searchParams.get("eventId"));
  if (!Number.isInteger(eventId) || eventId <= 0) {
    return NextResponse.json(
      { error: "A valid eventId is required." },
      { status: 400 },
    );
  }

  return NextResponse.json(await getEventAnalytics(eventId));
}
