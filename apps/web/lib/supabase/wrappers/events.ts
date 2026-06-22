import type { SupabaseClient } from "@supabase/supabase-js";

import { SupabaseWrapperError } from "./errors";
import { parseDates, unwrap } from "./result";
import { TABLES } from "./tables";
import type { Event, EventType, EventWithTeams, Team } from "./types";

const EVENT_DATE_FIELDS = ["startDate", "endDate", "createdAt"] as const;
const TEAM_DATE_FIELDS = ["createdAt"] as const;

type EventRow = Omit<Event, "startDate" | "endDate" | "createdAt"> & {
  startDate: string | Date;
  endDate: string | Date;
  createdAt: string | Date;
};

type TeamRow = Omit<Team, "createdAt"> & { createdAt: string | Date };

function parseEvent(row: EventRow): Event {
  return parseDates(row, [...EVENT_DATE_FIELDS]) as Event;
}

function parseTeam(row: TeamRow): Team {
  return parseDates(row, [...TEAM_DATE_FIELDS]) as Team;
}

export type CreateEventInput = {
  name: string;
  description?: string | null;
  location: string;
  type?: EventType;
  startDate: Date | string;
  endDate: Date | string;
};

export type ListEventsOptions = {
  from?: Date;
  to?: Date;
};

async function getEventIdsForTeam(
  supabase: SupabaseClient,
  teamId: string,
): Promise<string[]> {
  const { data, error } = await supabase
    .from(TABLES.teamEvents)
    .select("A")
    .eq("B", teamId);

  const links = unwrap(data, error, TABLES.teamEvents) as { A: string }[];
  return links.map((link) => link.A);
}

export async function listEventsForTeam(
  supabase: SupabaseClient,
  teamId: string,
  options: ListEventsOptions = {},
): Promise<Event[]> {
  const eventIds = await getEventIdsForTeam(supabase, teamId);

  if (eventIds.length === 0) {
    return [];
  }

  let query = supabase
    .from(TABLES.event)
    .select("*")
    .in("id", eventIds)
    .order("startDate", { ascending: true });

  if (options.from) {
    query = query.gte("startDate", options.from.toISOString());
  }

  if (options.to) {
    query = query.lte("startDate", options.to.toISOString());
  }

  const { data, error } = await query;
  const rows = unwrap(data as EventRow[] | null, error, TABLES.event);

  return rows.map(parseEvent);
}

export async function getEventById(
  supabase: SupabaseClient,
  eventId: string,
): Promise<EventWithTeams> {
  const { data, error } = await supabase
    .from(TABLES.event)
    .select("*, teams:Team(*)")
    .eq("id", eventId)
    .single();

  const row = unwrap(data, error, TABLES.event) as EventRow & {
    teams: TeamRow[];
  };

  return {
    ...parseEvent(row),
    teams: (row.teams ?? []).map(parseTeam),
  };
}

export async function createEvent(
  supabase: SupabaseClient,
  input: CreateEventInput,
): Promise<Event> {
  const { data, error } = await supabase
    .from(TABLES.event)
    .insert({
      name: input.name,
      description: input.description ?? null,
      location: input.location,
      type: input.type ?? "WORK_SESSION",
      startDate:
        input.startDate instanceof Date
          ? input.startDate.toISOString()
          : input.startDate,
      endDate:
        input.endDate instanceof Date
          ? input.endDate.toISOString()
          : input.endDate,
    })
    .select("*")
    .single();

  return parseEvent(unwrap(data as EventRow, error, TABLES.event));
}

export async function linkEventToTeam(
  supabase: SupabaseClient,
  eventId: string,
  teamId: string,
): Promise<void> {
  const { error } = await supabase.from(TABLES.teamEvents).insert({
    A: eventId,
    B: teamId,
  });

  if (error) {
    throw new SupabaseWrapperError(TABLES.teamEvents, error);
  }
}

export async function unlinkEventFromTeam(
  supabase: SupabaseClient,
  eventId: string,
  teamId: string,
): Promise<void> {
  const { error } = await supabase
    .from(TABLES.teamEvents)
    .delete()
    .eq("A", eventId)
    .eq("B", teamId);

  if (error) {
    throw new SupabaseWrapperError(TABLES.teamEvents, error);
  }
}
