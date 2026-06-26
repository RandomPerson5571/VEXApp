import type { SupabaseClient } from "@supabase/supabase-js";

import { parseDates, unwrap } from "./result";
import { TABLES } from "./tables";
import type { Team, TeamWithMembers, User } from "./types";

const TEAM_DATE_FIELDS = ["createdAt"] as const;
const USER_DATE_FIELDS = ["createdAt", "updatedAt"] as const;

type TeamRow = Omit<Team, "createdAt"> & { createdAt: string | Date };
type UserRow = Omit<User, "createdAt" | "updatedAt"> & {
  createdAt: string | Date;
  updatedAt: string | Date;
};

function parseTeam(row: TeamRow): Team {
  return parseDates(row, [...TEAM_DATE_FIELDS]) as Team;
}

function parseUser(row: UserRow): User {
  return parseDates(row, [...USER_DATE_FIELDS]) as User;
}

export async function getTeamById(
  supabase: SupabaseClient,
  teamId: string,
): Promise<Team> {
  const { data, error } = await supabase
    .from(TABLES.team)
    .select("*")
    .eq("id", teamId)
    .single();

  return parseTeam(unwrap(data as TeamRow, error, TABLES.team));
}

export async function getTeamWithMembers(
  supabase: SupabaseClient,
  teamId: string,
): Promise<TeamWithMembers> {
  const { data, error } = await supabase
    .from(TABLES.team)
    .select("*, members:User(*)")
    .eq("id", teamId)
    .single();

  const row = unwrap(data, error, TABLES.team) as TeamRow & {
    members: UserRow[];
  };

  return {
    ...parseTeam(row),
    members: (row.members ?? []).map(parseUser),
  };
}

export async function getTeamForCurrentUser(
  supabase: SupabaseClient,
  teamId: string | null | undefined,
): Promise<Team | null> {
  if (!teamId) {
    return null;
  }

  return getTeamById(supabase, teamId);
}
