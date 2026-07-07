import { createTeamEventsQueryOptions } from "@/lib/queries/shared/events";
import type { CalendarEvent, EventType } from "@/lib/types/team";

export type CreateEventPayload = {
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  type: EventType;
  location: string;
  description?: string;
};

export async function fetchTeamEventsFromApi(): Promise<CalendarEvent[]> {
  const response = await fetch("/api/events");

  if (!response.ok) {
    throw new Error("Failed to fetch team events.");
  }

  return response.json() as Promise<CalendarEvent[]>;
}

export async function createTeamEventFromApi(
  payload: CreateEventPayload,
): Promise<CalendarEvent> {
  const response = await fetch("/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const body = (await response.json()) as CalendarEvent | { error?: string };

  if (!response.ok) {
    throw new Error(
      "error" in body && body.error ? body.error : "Failed to create event.",
    );
  }

  return body as CalendarEvent;
}

export function teamEventsQueryOptions(teamId: string) {
  return createTeamEventsQueryOptions(teamId, fetchTeamEventsFromApi);
}
