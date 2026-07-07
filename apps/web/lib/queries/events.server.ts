import "server-only";

import {
  createEventForTeam,
  listEventsForTeam,
  type CreateEventInput,
} from "@/lib/data/events";
import { toCalendarEvent, toCalendarEvents } from "@/lib/mappers/events";
import { createTeamEventsQueryOptions } from "@/lib/queries/shared/events";
import type { CalendarEvent } from "@/lib/types/team";

export async function getTeamCalendarEvents(
  teamId: string,
): Promise<CalendarEvent[]> {
  const events = await listEventsForTeam(teamId);
  return toCalendarEvents(events);
}

export async function createTeamEvent(
  input: CreateEventInput,
): Promise<CalendarEvent> {
  const event = await createEventForTeam(input);
  return toCalendarEvent(event);
}

export function teamEventsQueryOptions(teamId: string) {
  return createTeamEventsQueryOptions(teamId, () => getTeamCalendarEvents(teamId));
}
