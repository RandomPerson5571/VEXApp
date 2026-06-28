import { queryKeys } from "@/lib/query-client";
import type { CalendarEvent } from "@/lib/types/team";

export async function fetchTeamEventsFromApi(): Promise<CalendarEvent[]> {
  const response = await fetch("/api/events");

  if (!response.ok) {
    throw new Error("Failed to fetch team events.");
  }

  return response.json() as Promise<CalendarEvent[]>;
}

export function teamEventsQueryOptions(teamId: string) {
  return {
    queryKey: queryKeys.events.forTeam(teamId),
    queryFn: fetchTeamEventsFromApi,
  };
}
