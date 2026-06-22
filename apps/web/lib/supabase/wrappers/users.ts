import type { SupabaseClient } from "@supabase/supabase-js";

import { parseDates, unwrap, unwrapNullable } from "./result";
import { TABLES } from "./tables";
import type { User, UserWithTeam } from "./types";

const USER_DATE_FIELDS = ["createdAt", "updatedAt"] as const;

type UserRow = Omit<User, "createdAt" | "updatedAt"> & {
  createdAt: string | Date;
  updatedAt: string | Date;
};

function parseUser(row: UserRow): User {
  return parseDates(row, [...USER_DATE_FIELDS]) as User;
}

export async function getUserByAuthId(
  supabase: SupabaseClient,
  authUserId: string,
): Promise<User | null> {
  const { data, error } = await supabase
    .from(TABLES.user)
    .select("*")
    .eq("authUserId", authUserId)
    .maybeSingle();

  const row = unwrapNullable(data as UserRow | null, error, TABLES.user);
  return row ? parseUser(row) : null;
}

export async function getUserByEmail(
  supabase: SupabaseClient,
  email: string,
): Promise<User | null> {
  const { data, error } = await supabase
    .from(TABLES.user)
    .select("*")
    .eq("email", email)
    .maybeSingle();

  const row = unwrapNullable(data as UserRow | null, error, TABLES.user);
  return row ? parseUser(row) : null;
}

export async function getUserWithTeam(
  supabase: SupabaseClient,
  userId: string,
): Promise<UserWithTeam> {
  const { data, error } = await supabase
    .from(TABLES.user)
    .select("*, team:Team(*)")
    .eq("id", userId)
    .single();

  const row = unwrap(data, error, TABLES.user) as UserRow & {
    team: UserWithTeam["team"];
  };

  return {
    ...parseUser(row),
    team: row.team ?? null,
  };
}

export type UserProfileUpdate = {
  firstName?: string;
  lastName?: string;
};

export async function updateUserProfile(
  supabase: SupabaseClient,
  userId: string,
  data: UserProfileUpdate,
): Promise<User> {
  const { data: row, error } = await supabase
    .from(TABLES.user)
    .update(data)
    .eq("id", userId)
    .select("*")
    .single();

  return parseUser(unwrap(row as UserRow, error, TABLES.user));
}

export type CreateUserProfileInput = {
  authUserId: string;
  email: string;
  firstName: string;
  lastName: string;
  discordId: string;
};

export async function createUserProfile(
  supabase: SupabaseClient,
  input: CreateUserProfileInput,
): Promise<User> {
  const { data, error } = await supabase
    .from(TABLES.user)
    .insert(input)
    .select("*")
    .single();

  return parseUser(unwrap(data as UserRow, error, TABLES.user));
}

export async function linkAuthUserToProfile(
  supabase: SupabaseClient,
  userId: string,
  authUserId: string,
): Promise<User> {
  const { data, error } = await supabase
    .from(TABLES.user)
    .update({ authUserId })
    .eq("id", userId)
    .is("authUserId", null)
    .select("*")
    .single();

  return parseUser(unwrap(data as UserRow, error, TABLES.user));
}
