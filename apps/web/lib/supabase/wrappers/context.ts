import type { SupabaseClient, User as AuthUser } from "@supabase/supabase-js";

import {
  createUserProfile,
  getUserByAuthId,
  getUserByEmail,
  linkAuthUserToProfile,
} from "./users";
import type { User } from "./types";

export type AuthenticatedContext = {
  authUser: AuthUser;
  profile: User | null;
};

function splitName(
  fullName: string | undefined,
  email: string,
): { firstName: string; lastName: string } {
  if (fullName?.trim()) {
    const parts = fullName.trim().split(/\s+/);
    return {
      firstName: parts[0] ?? email.split("@")[0] ?? "User",
      lastName: parts.slice(1).join(" ") || "Member",
    };
  }

  const localPart = email.split("@")[0] ?? "user";
  return {
    firstName: localPart,
    lastName: "Member",
  };
}

export async function getAuthenticatedUser(
  supabase: SupabaseClient,
): Promise<AuthenticatedContext> {
  const {
    data: { user: authUser },
    error,
  } = await supabase.auth.getUser();

  if (error || !authUser) {
    throw new Error(error?.message ?? "Not authenticated");
  }

  const profile = await getUserByAuthId(supabase, authUser.id);

  return { authUser, profile };
}

export async function ensureUserProfile(
  supabase: SupabaseClient,
  authUser: AuthUser,
): Promise<User> {
  const existing = await getUserByAuthId(supabase, authUser.id);
  if (existing) {
    return existing;
  }

  const email = authUser.email;
  if (!email) {
    throw new Error("Authenticated user is missing an email address");
  }

  const byEmail = await getUserByEmail(supabase, email);
  if (byEmail) {
    if (byEmail.authUserId && byEmail.authUserId !== authUser.id) {
      throw new Error("Email is already linked to another account");
    }

    if (!byEmail.authUserId) {
      return linkAuthUserToProfile(supabase, byEmail.id, authUser.id);
    }

    return byEmail;
  }

  const metadataName =
    typeof authUser.user_metadata?.full_name === "string"
      ? authUser.user_metadata.full_name
      : typeof authUser.user_metadata?.name === "string"
        ? authUser.user_metadata.name
        : undefined;

  const { firstName, lastName } = splitName(metadataName, email);

  return createUserProfile(supabase, {
    authUserId: authUser.id,
    email,
    firstName,
    lastName,
    discordId: `auth:${authUser.id}`,
  });
}
