import { createTeamEventsQueryOptions } from "@/lib/queries/shared/events";
import type { CalendarEvent } from "@/lib/types/team";

export async function fetchTeamEventsFromApi(): Promise<CalendarEvent[]> {
  const response = await fetch("/api/events");

  if (!response.ok) {
    throw new Error("Failed to fetch team events.");
  }

  return response.json() as Promise<CalendarEvent[]>;
}

export function teamEventsQueryOptions(teamId: string) {
  return createTeamEventsQueryOptions(teamId, fetchTeamEventsFromApi);
}
