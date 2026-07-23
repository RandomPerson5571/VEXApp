import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/current-user";
import { enforceApiRateLimit } from "@/lib/security/enforce-api-rate-limit";
import { fromUiEventType } from "@/lib/mappers/events";
import {
  deleteTeamEvent,
  updateTeamEvent,
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

type UpdateEventRequestBody = {
  title?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  type?: UiEventType;
  location?: string;
  description?: string;
};

type RouteContext = {
  params: Promise<{ eventId: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const teamId = currentUser.profile.teamId;

  if (!teamId) {
    return NextResponse.json(
      { error: "You must belong to a team to update events." },
      { status: 400 },
    );
  }

  const limited = await enforceApiRateLimit(
    request,
    currentUser.profile.id,
    "team",
  );
  if (limited) return limited;

  const { eventId } = await context.params;

  if (!eventId?.trim()) {
    return NextResponse.json({ error: "Event id is required." }, { status: 400 });
  }

  let body: UpdateEventRequestBody;

  try {
    body = (await request.json()) as UpdateEventRequestBody;
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
    const event = await updateTeamEvent({
      eventId,
      teamId,
      name: title,
      description: body.description ?? null,
      location,
      type: fromUiEventType(body.type),
      startDate,
      endDate,
    });

    return NextResponse.json(event);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update event.";
    const status = message === "Event not found." ? 404 : 400;

    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const teamId = currentUser.profile.teamId;

  if (!teamId) {
    return NextResponse.json(
      { error: "You must belong to a team to delete events." },
      { status: 400 },
    );
  }

  const limited = await enforceApiRateLimit(
    request,
    currentUser.profile.id,
    "team",
  );
  if (limited) return limited;

  const { eventId } = await context.params;

  if (!eventId?.trim()) {
    return NextResponse.json({ error: "Event id is required." }, { status: 400 });
  }

  try {
    await deleteTeamEvent(eventId, teamId);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete event.";
    const status = message === "Event not found." ? 404 : 400;

    return NextResponse.json({ error: message }, { status });
  }
}
