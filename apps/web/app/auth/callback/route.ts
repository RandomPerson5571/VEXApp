import { prisma } from "@stlvex/database";
import { NextResponse } from "next/server";

import {
  getValidInviteFromCookies,
  INVITE_REQUIRED_MESSAGE,
} from "@/lib/auth/invite";
import { resolveSameOriginRedirect } from "@/lib/auth/redirect";
import { lookupUserProfile } from "@/lib/auth/profile";
import {
  isDiscordAuthUser,
  syncDiscordIdToProfile,
  verifyDiscordAuthIdentity,
  verifySessionIdentity,
} from "@/lib/auth/identity";
import { createClient } from "@/lib/supabase/server";
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const origin = requestUrl.origin;
  const next = resolveSameOriginRedirect(
    requestUrl.searchParams.get("next"),
    origin,
  );

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent(error.message)}`,
      );
    }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${origin}/login`);
  }

  if (isDiscordAuthUser(user)) {
    const existingProfile = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true },
    });

    if (existingProfile) {
      const syncResult = await syncDiscordIdToProfile(user);
      const discordCheck = await verifyDiscordAuthIdentity(user);

      if (!discordCheck.ok) {
        const errorMessage =
          !syncResult.ok &&
          (syncResult.code === "conflict" || syncResult.code === "mismatch")
            ? syncResult.error
            : discordCheck.error;

        return NextResponse.redirect(
          `${origin}/settings?error=${encodeURIComponent(errorMessage)}`,
        );
      }
    }
  }

  const sessionCheck = await verifySessionIdentity(user);

  if (!sessionCheck.ok) {
    await supabase.auth.signOut();
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(sessionCheck.error)}`,
    );
  }

  const profile = await lookupUserProfile(user.id);

  if (profile.status === "unavailable") {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(
        "Unable to reach the database. Check your connection settings and try again.",
      )}`,
    );
  }

  if (profile.status === "missing") {
    const invite = await getValidInviteFromCookies();

    if (!invite) {
      await supabase.auth.signOut();
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent(INVITE_REQUIRED_MESSAGE)}`,
      );
    }

    return NextResponse.redirect(`${origin}/onboarding?next=${encodeURIComponent(next)}`);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
