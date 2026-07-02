import "server-only";

import { NextResponse } from "next/server";

import { canManageTeamIntegrations } from "@/lib/auth/auth-guards";
import { verifyCurrentUserPermissions } from "@/lib/auth/auth-guards-server";
import { getCurrentUser } from "@/lib/auth/current-user";

type TeamIntegrationAccess =
  | { ok: true; teamId: string; userId: string }
  | { ok: false; response: NextResponse };

export async function requireTeamIntegrationAccess(): Promise<TeamIntegrationAccess> {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Not authenticated." },
        { status: 401 },
      ),
    };
  }

  const teamId = currentUser.profile.teamId?.trim();

  if (!teamId) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "You must belong to a team to manage integrations." },
        { status: 400 },
      ),
    };
  }

  const permissions = await verifyCurrentUserPermissions(teamId);

  if (!canManageTeamIntegrations(permissions)) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Forbidden." }, { status: 403 }),
    };
  }

  return {
    ok: true,
    teamId,
    userId: currentUser.profile.id,
  };
}
