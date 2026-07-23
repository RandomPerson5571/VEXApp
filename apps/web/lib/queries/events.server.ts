import "server-only";

import {
  createEventForTeam,
  deleteEventForTeam,
  listEventsForTeam,
  updateEventForTeam,
  type CreateEventInput,
  type UpdateEventInput,
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

export async function updateTeamEvent(
  input: UpdateEventInput,
): Promise<CalendarEvent> {
  const event = await updateEventForTeam(input);
  return toCalendarEvent(event);
}

export async function deleteTeamEvent(
  eventId: string,
  teamId: string,
): Promise<void> {
  await deleteEventForTeam(eventId, teamId);
}

export function teamEventsQueryOptions(teamId: string) {
  return createTeamEventsQueryOptions(teamId, () => getTeamCalendarEvents(teamId));
}
