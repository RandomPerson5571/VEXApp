import { queryOptions } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-client";
import type { CalendarEvent } from "@/lib/types/team";

export function createTeamEventsQueryOptions(
  teamId: string,
  queryFn: () => Promise<CalendarEvent[]>,
) {
  return queryOptions({
    queryKey: queryKeys.events.forTeam(teamId),
    queryFn,
    placeholderData: (previousData) => previousData,
  });
}
