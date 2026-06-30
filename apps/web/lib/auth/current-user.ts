import { prisma } from "@stlvex/database";
import type { User as AuthUser } from "@supabase/supabase-js";
import { cache } from "react";

import { verifySessionIdentity } from "@/lib/auth/identity";
import { getAuthUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { Team, User } from "@stlvex/database/types";

export type CurrentUser = {
  authUser: AuthUser;
  profile: User;
  team: Team | null;
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
      user: { authUser, profile: userProfile, team },
    };
  } catch {
    return { status: "unauthenticated" };
  }
});

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const state = await getCurrentUserState();
  return state.status === "ready" ? state.user : null;
}
