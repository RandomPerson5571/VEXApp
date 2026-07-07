import type { QueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-client";
import type { CalendarEvent } from "@/lib/types/team";

export function prependTeamEvent(
  queryClient: QueryClient,
  teamId: string,
  newEvent: CalendarEvent,
): void {
  queryClient.setQueryData<CalendarEvent[]>(
    queryKeys.events.forTeam(teamId),
    (old) => (old ? [...old, newEvent] : [newEvent]),
  );
}
