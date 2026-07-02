import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/current-user";
import {
  GitHubInstallStateError,
  verifyGitHubInstallState,
} from "@/lib/integrations/github/state.server";

function getAppOrigin(): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (siteUrl) {
    return siteUrl.replace(/\/$/, "");
  }

  throw new Error("NEXT_PUBLIC_SITE_URL is not configured.");
}

function redirectToTeamManagement(installationId: number): NextResponse {
  const origin = getAppOrigin();
  const url = new URL("/team-management", origin);
  url.searchParams.set("githubInstall", String(installationId));

  return NextResponse.redirect(url);
}

function redirectWithError(message: string): NextResponse {
  const origin = getAppOrigin();
  const url = new URL("/team-management", origin);
  url.searchParams.set("githubError", message);

  return NextResponse.redirect(url);
}

function parseInstallationId(value: string | null): number | null {
  if (!value?.trim()) {
    return null;
  }

  const parsed = Number.parseInt(value, 10);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

export async function GET(request: Request) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const state = searchParams.get("state");
  const installationId = parseInstallationId(
    searchParams.get("installation_id"),
  );

  if (!state) {
    return redirectWithError("Missing GitHub install state.");
  }

  let payload;

  try {
    payload = verifyGitHubInstallState(state);
  } catch (error) {
    const message =
      error instanceof GitHubInstallStateError
        ? error.message
        : "Invalid or expired GitHub install state.";

    return redirectWithError(message);
  }

  if (payload.userId !== currentUser.profile.id) {
    return redirectWithError("GitHub install state does not match your account.");
  }

  if (!currentUser.profile.teamId) {
    return redirectWithError("You must belong to a team to connect GitHub.");
  }

  if (payload.teamId !== currentUser.profile.teamId) {
    return redirectWithError("GitHub install state does not match your team.");
  }

  if (!installationId) {
    return redirectWithError("Missing GitHub installation id.");
  }

  try {
    return redirectToTeamManagement(installationId);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "GitHub callback failed.";

    return NextResponse.json({ error: message }, { status: 503 });
  }
}
