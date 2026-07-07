import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/current-user";
import { exchangeAuthorizationCode } from "@/lib/integrations/fusion/app.server";
import { createFusionConnectSession } from "@/lib/integrations/fusion/connect-session.server";
import {
  FusionOAuthStateError,
  verifyFusionOAuthState,
} from "@/lib/integrations/fusion/state.server";

function getAppOrigin(): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (siteUrl) {
    return siteUrl.replace(/\/$/, "");
  }

  throw new Error("NEXT_PUBLIC_SITE_URL is not configured.");
}

function redirectToTeamManagement(connectSession: string): NextResponse {
  const origin = getAppOrigin();
  const url = new URL("/team-management", origin);
  url.searchParams.set("fusionConnect", connectSession);

  return NextResponse.redirect(url);
}

function redirectWithError(message: string): NextResponse {
  const origin = getAppOrigin();
  const url = new URL("/team-management", origin);
  url.searchParams.set("fusionError", message);

  return NextResponse.redirect(url);
}

export async function GET(request: Request) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const state = searchParams.get("state");
  const code = searchParams.get("code");
  const oauthError = searchParams.get("error");

  if (oauthError) {
    const description = searchParams.get("error_description");
    return redirectWithError(
      description?.trim() || "Fusion authorization was denied.",
    );
  }

  if (!state) {
    return redirectWithError("Missing Fusion OAuth state.");
  }

  if (!code?.trim()) {
    return redirectWithError("Missing Fusion authorization code.");
  }

  let payload;

  try {
    payload = verifyFusionOAuthState(state);
  } catch (error) {
    const message =
      error instanceof FusionOAuthStateError
        ? error.message
        : "Invalid or expired Fusion OAuth state.";

    return redirectWithError(message);
  }

  if (payload.userId !== currentUser.profile.id) {
    return redirectWithError("Fusion OAuth state does not match your account.");
  }

  if (!currentUser.profile.teamId) {
    return redirectWithError("You must belong to a team to connect Fusion.");
  }

  if (payload.teamId !== currentUser.profile.teamId) {
    return redirectWithError("Fusion OAuth state does not match your team.");
  }

  try {
    const accessToken = await exchangeAuthorizationCode(code.trim());
    const connectSession = createFusionConnectSession(
      payload.teamId,
      payload.userId,
      accessToken,
    );

    return redirectToTeamManagement(connectSession);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Fusion callback failed.";

    return redirectWithError(message);
  }
}
