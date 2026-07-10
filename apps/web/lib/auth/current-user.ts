import { prisma } from "@stlvex/database";
import type { User as AuthUser } from "@supabase/supabase-js";
import { connection } from "next/server";
import { appendFileSync } from "node:fs";
import { cache } from "react";

import {
  getDiscordAvatarUrlFromAuthUser,
  verifySessionIdentity,
} from "@/lib/auth/identity";
import { getAuthUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { Team, User } from "@stlvex/database/types";

export type CurrentUser = {
  authUser: AuthUser;
  profile: User;
  team: Team | null;
  discordAvatarUrl: string | null;
};

export type CurrentUserState =
  | { status: "unauthenticated" }
  | { status: "needs_verification"; error: string }
  | { status: "needs_onboarding"; authUser: AuthUser }
  | { status: "ready"; user: CurrentUser };

/**
 * Fetches the authenticated user, database profile, and team once per request.
 * Wrapped in React cache() so layouts, pages, and server actions share one pass.
 */
export const getCurrentUserState = cache(async (): Promise<CurrentUserState> => {
  // #region agent log
  try {
    appendFileSync(
      "c:/Users/griff/OneDrive/Documents/coding-workspace/VexRobotics/VEXApp/debug-d8eb0f.log",
      `${JSON.stringify({ sessionId: "d8eb0f", runId: "post-fix", hypothesisId: "H-C", location: "current-user.ts:getCurrentUserState", message: "about to call connection()", data: {}, timestamp: Date.now() })}\n`,
    );
  } catch {
    /* ignore */
  }
  // #endregion
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

    const { team, ...userProfile } = profile;

    return {
      status: "ready",
      user: {
        authUser,
        profile: userProfile,
        team,
        discordAvatarUrl: getDiscordAvatarUrlFromAuthUser(authUser),
      },
    };
  } catch {
    return { status: "unauthenticated" };
  }
});

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const state = await getCurrentUserState();
  return state.status === "ready" ? state.user : null;
}
