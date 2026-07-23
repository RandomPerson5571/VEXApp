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

export function replaceTeamEvent(
  queryClient: QueryClient,
  teamId: string,
  updatedEvent: CalendarEvent,
): void {
  queryClient.setQueryData<CalendarEvent[]>(
    queryKeys.events.forTeam(teamId),
    (old) => {
      if (!old) return [updatedEvent];
      return old.map((event) =>
        event.id === updatedEvent.id ? updatedEvent : event,
      );
    },
  );
}

export function removeTeamEvent(
  queryClient: QueryClient,
  teamId: string,
  eventId: string,
): void {
  queryClient.setQueryData<CalendarEvent[]>(
    queryKeys.events.forTeam(teamId),
    (old) => (old ? old.filter((event) => event.id !== eventId) : old),
  );
}
