import "server-only";

import { listEventsForTeam } from "@/lib/data/events";
import { toCalendarEvents } from "@/lib/mappers/events";
import { queryKeys } from "@/lib/query-client";
import type { CalendarEvent } from "@/lib/types/team";

export async function getTeamCalendarEvents(
  teamId: string,
): Promise<CalendarEvent[]> {
  const events = await listEventsForTeam(teamId);
  return toCalendarEvents(events);
}

export function teamEventsQueryOptions(teamId: string) {
  return {
    queryKey: queryKeys.events.forTeam(teamId),
    queryFn: () => getTeamCalendarEvents(teamId),
  };
}
