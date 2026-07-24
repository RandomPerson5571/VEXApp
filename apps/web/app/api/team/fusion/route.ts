import { NextResponse } from "next/server";

import { requireTeamIntegrationAccess } from "@/lib/integrations/github/api-auth.server";
import { enforceApiRateLimit } from "@/lib/security/enforce-api-rate-limit";
import {
  disconnectTeamFusionIntegration,
  getTeamFusionIntegration,
  setTeamFusionIntegrationActive,
  TeamFusionIntegrationError,
} from "@/lib/integrations/fusion/team.server";

type ToggleActivePayload = {
  isActive?: boolean;
};

export async function GET() {
  const access = await requireTeamIntegrationAccess();

  if (!access.ok) {
    return access.response;
  }

  const integration = await getTeamFusionIntegration(access.teamId);

  return NextResponse.json({ integration });
}

export async function PATCH(request: Request) {
  const access = await requireTeamIntegrationAccess();

  if (!access.ok) {
    return access.response;
  }

  const limited = await enforceApiRateLimit(
    request,
    access.userId,
    "integrations",
  );
  if (limited) return limited;

  let body: ToggleActivePayload;

  try {
    body = (await request.json()) as ToggleActivePayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (typeof body.isActive !== "boolean") {
    return NextResponse.json(
      { error: "isActive must be a boolean." },
      { status: 400 },
    );
  }

  try {
    const integration = await setTeamFusionIntegrationActive(
      access.teamId,
      body.isActive,
    );

    return NextResponse.json({
      integration,
      message: body.isActive
        ? "Fusion integration activated."
        : "Fusion integration paused.",
    });
  } catch (error) {
    if (error instanceof TeamFusionIntegrationError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    throw error;
  }
}

export async function DELETE(request: Request) {
  const access = await requireTeamIntegrationAccess();

  if (!access.ok) {
    return access.response;
  }

  const limited = await enforceApiRateLimit(
    request,
    access.userId,
    "integrations",
  );
  if (limited) return limited;

  const disconnected = await disconnectTeamFusionIntegration(access.teamId);

  if (!disconnected) {
    return NextResponse.json(
      { error: "No Fusion integration found for this team." },
      { status: 404 },
    );
  }

  return NextResponse.json({
    message: "Fusion integration disconnected.",
  });
}
