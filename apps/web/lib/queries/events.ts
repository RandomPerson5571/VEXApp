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
  forAllTeams?: boolean;
};

export async function fetchTeamEventsFromApi(): Promise<CalendarEvent[]> {
  const response = await fetch("/api/events");

  if (!response.ok) {
    throw new Error("Failed to fetch team events.");
  }

  return response.json() as Promise<CalendarEvent[]>;
}

export type UpdateEventPayload = CreateEventPayload & {
  eventId: string;
};

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

export async function updateTeamEventFromApi(
  payload: UpdateEventPayload,
): Promise<CalendarEvent> {
  const { eventId, ...body } = payload;
  const response = await fetch(`/api/events/${eventId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const result = (await response.json()) as CalendarEvent | { error?: string };

  if (!response.ok) {
    throw new Error(
      "error" in result && result.error ? result.error : "Failed to update event.",
    );
  }

  return result as CalendarEvent;
}

export async function deleteTeamEventFromApi(eventId: string): Promise<void> {
  const response = await fetch(`/api/events/${eventId}`, { method: "DELETE" });

  if (response.status === 204) return;

  const body = (await response.json()) as { error?: string };

  throw new Error(body.error ?? "Failed to delete event.");
}

export function teamEventsQueryOptions(teamId: string) {
  return createTeamEventsQueryOptions(teamId, fetchTeamEventsFromApi);
}
