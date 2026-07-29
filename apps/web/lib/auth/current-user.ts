import { getLatestModerationEvent, prisma } from "@stlvex/database";
import type { User as AuthUser } from "@supabase/supabase-js";
import { connection } from "next/server";
import { cache } from "react";

import {
  getDiscordAvatarUrlFromAuthUser,
  verifySessionIdentity,
} from "@/lib/auth/identity";
import { isUserSuppressed } from "@/lib/auth/moderation";
import { getAuthUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { Team, User } from "@stlvex/database/types";

export type CurrentUser = {
  authUser: AuthUser;
  profile: User;
  team: Team | null;
  discordAvatarUrl: string | null;
  /** Latest ModerationEvent reason when suppressed; audit-sourced, not on User. */
  moderationReason: string | null;
};

export type CurrentUserState =
  | { status: "unauthenticated" }
  | { status: "banned" }
  | { status: "needs_verification"; error: string }
  | { status: "needs_onboarding"; authUser: AuthUser }
  | { status: "ready"; user: CurrentUser };

/**
 * Fetches the authenticated user, database profile, and team once per request.
 * Wrapped in React cache() so layouts, pages, and server actions share one pass.
 */
export const getCurrentUserState = cache(async (): Promise<CurrentUserState> => {
  await connection();

  try {
    const authUser = await getAuthUser();

    if (!authUser) {
      return { status: "unauthenticated" };
    }

    const sessionCheck = await verifySessionIdentity(authUser);

    if (!sessionCheck.ok) {
      const supabase = await createClient();
      await supabase.auth.signOut();
      return { status: "needs_verification", error: sessionCheck.error };
    }

    const profile = await prisma.user.findUnique({
      where: { id: authUser.id },
      include: { team: true },
    });

    if (!profile) {
      return { status: "needs_onboarding", authUser };
    }

    if (profile.bannedAt) {
      const supabase = await createClient();
      await supabase.auth.signOut();
      return { status: "banned" };
    }

    const { team, ...userProfile } = profile;

    let moderationReason: string | null = null;
    if (isUserSuppressed(userProfile)) {
      const latest = await getLatestModerationEvent(userProfile.id);
      moderationReason = latest?.reason ?? null;
    }

    return {
      status: "ready",
      user: {
        authUser,
        profile: userProfile,
        team,
        discordAvatarUrl: getDiscordAvatarUrlFromAuthUser(authUser),
        moderationReason,
      },
    };
  } catch (error) {
    // ponytail: only map auth client failures to unauthenticated — DB/schema
    // errors used to 307 → /login and look like a session bug.
    const message = error instanceof Error ? error.message : String(error);
    if (/JWT|session|Auth session|Invalid Refresh Token|refresh_token/i.test(message)) {
      return { status: "unauthenticated" };
    }
    throw error;
  }
});

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const state = await getCurrentUserState();
  return state.status === "ready" ? state.user : null;
}
