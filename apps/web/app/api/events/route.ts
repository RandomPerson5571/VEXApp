import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/current-user";
import { enforceApiRateLimit } from "@/lib/security/enforce-api-rate-limit";
import { fromUiEventType } from "@/lib/mappers/events";
import {
  createTeamEvent,
  getTeamCalendarEvents,
} from "@/lib/queries/events.server";
import type { EventType as UiEventType } from "@/lib/types/team";
import { combineDateAndTime } from "@/lib/utils/calendar";

const UI_EVENT_TYPES = new Set<UiEventType>([
  "build",
  "practice_match",
  "scrimmage",
  "championship",
  "meeting",
]);

type CreateEventRequestBody = {
  title?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  type?: UiEventType;
  location?: string;
  description?: string;
};

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

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const teamId = currentUser.profile.teamId;

  if (!teamId) {
    return NextResponse.json(
      { error: "You must belong to a team to create events." },
      { status: 400 },
    );
  }

  const limited = await enforceApiRateLimit(
    request,
    currentUser.profile.id,
    "team",
  );
  if (limited) return limited;

  let body: CreateEventRequestBody;

  try {
    body = (await request.json()) as CreateEventRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const title = body.title?.trim();
  const date = body.date?.trim();
  const startTime = body.startTime?.trim();
  const endTime = body.endTime?.trim();
  const location = body.location?.trim();

  if (!title) {
    return NextResponse.json({ error: "Title is required." }, { status: 400 });
  }

  if (!date) {
    return NextResponse.json({ error: "Date is required." }, { status: 400 });
  }

  if (!startTime || !endTime) {
    return NextResponse.json(
      { error: "Start and end times are required." },
      { status: 400 },
    );
  }

  if (!location) {
    return NextResponse.json({ error: "Location is required." }, { status: 400 });
  }

  if (!body.type || !UI_EVENT_TYPES.has(body.type)) {
    return NextResponse.json({ error: "Invalid event type." }, { status: 400 });
  }

  const startDate = combineDateAndTime(date, startTime);
  const endDate = combineDateAndTime(date, endTime);

  if (!startDate || !endDate) {
    return NextResponse.json(
      { error: "Invalid date or time format." },
      { status: 400 },
    );
  }

  try {
    const event = await createTeamEvent({
      name: title,
      description: body.description ?? null,
      location,
      type: fromUiEventType(body.type),
      startDate,
      endDate,
      teamId,
    });

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create event.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
