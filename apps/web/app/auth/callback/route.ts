import { prisma } from "@stlvex/database";
import { NextResponse } from "next/server";

import {
  applyInviteCookieToResponse,
  assertInviteUsable,
  clearInviteCookieFromResponse,
  DISCORD_LOGIN_REQUIRES_ACCOUNT_MESSAGE,
  getInviteFailureReasonFromError,
  getInviteInvalidReasonForAuthUser,
  getInviteJoinFailureReason,
  reserveInviteForUser,
  resolveInviteForAuthUser,
} from "@/lib/auth/invite";
import { resolveSameOriginRedirect } from "@/lib/auth/redirect";
import { lookupUserProfile } from "@/lib/auth/profile";
import {
  getDiscordIdFromAuthUser,
  isDiscordAuthUser,
  resolveAuthUserWithIdentities,
  syncDiscordIdToProfile,
  verifyDiscordAuthIdentity,
  verifySessionIdentity,
} from "@/lib/auth/identity";
import { createClient } from "@/lib/supabase/server";

function discordLinkFlowRedirect(
  origin: string,
  next: string,
  error: string,
): NextResponse {
  const url = new URL(
    resolveSameOriginRedirect(next, origin, "/settings/integrations"),
    origin,
  );
  url.searchParams.delete("message");
  url.searchParams.set("error", error);
  return NextResponse.redirect(url);
}

function inviteInvalidRedirect(
  origin: string,
  reason: string,
  secure: boolean,
): NextResponse {
  const url = new URL("/invite-invalid", origin);
  url.searchParams.set("reason", reason);
  return clearInviteCookieFromResponse(NextResponse.redirect(url), secure);
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const origin = requestUrl.origin;
  const secure = requestUrl.protocol === "https:";
  const next = resolveSameOriginRedirect(
    requestUrl.searchParams.get("next"),
    origin,
  );
  const flow = requestUrl.searchParams.get("flow");

  const supabase = await createClient();
  const isLinkFlow = flow === "link";
  let authUser = null;

  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent(error.message)}`,
      );
    }

    authUser = data.session?.user ?? null;
  }

  if (!authUser) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    authUser = user;
  }

  if (!authUser) {
    return NextResponse.redirect(`${origin}/login`);
  }

  const user = await resolveAuthUserWithIdentities(supabase, authUser);
  const linkedDiscordId = getDiscordIdFromAuthUser(user);

  if (linkedDiscordId) {
    const existingProfile = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true },
    });

    if (existingProfile) {
      const syncResult = await syncDiscordIdToProfile(user);

      if (isLinkFlow) {
        if (!syncResult.ok) {
          return discordLinkFlowRedirect(origin, next, syncResult.error);
        }
      } else if (isDiscordAuthUser(user)) {
        const discordCheck = await verifyDiscordAuthIdentity(user);

        if (!discordCheck.ok) {
          const errorMessage =
            !syncResult.ok &&
            (syncResult.code === "conflict" || syncResult.code === "mismatch")
              ? syncResult.error
              : discordCheck.error;

          return NextResponse.redirect(
            `${origin}/settings/integrations?error=${encodeURIComponent(errorMessage)}`,
          );
        }
      }
    }
  } else if (isLinkFlow) {
    return discordLinkFlowRedirect(
      origin,
      next,
      "Discord account was not linked. Try connecting again.",
    );
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
    const { invite, refreshCookie } = await resolveInviteForAuthUser(user);

    if (!invite) {
      await supabase.auth.signOut();

      if (flow === "login") {
        return NextResponse.redirect(
          `${origin}/login?error=${encodeURIComponent(DISCORD_LOGIN_REQUIRES_ACCOUNT_MESSAGE)}`,
        );
      }

      const reason = await getInviteInvalidReasonForAuthUser(user);
      return inviteInvalidRedirect(origin, reason, secure);
    }

    try {
      assertInviteUsable(invite, user.id);

      await prisma.$transaction(async (tx) => {
        await reserveInviteForUser(tx, invite.id, user.id);
      });
    } catch (error) {
      await supabase.auth.signOut();

      const reason =
        error instanceof Error && error.name.startsWith("Invite")
          ? getInviteFailureReasonFromError(error)
          : getInviteJoinFailureReason(invite) ?? "not_found";

      return inviteInvalidRedirect(origin, reason, secure);
    }

    const onboardingUrl = new URL("/onboarding", origin);
    onboardingUrl.searchParams.set("next", next);
    const response = NextResponse.redirect(onboardingUrl);

    if (refreshCookie) {
      applyInviteCookieToResponse(response, invite, secure);
    }

    return response;
  }

  return NextResponse.redirect(`${origin}${next}`);
}
