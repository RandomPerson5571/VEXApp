import { NextResponse } from "next/server";

import { requireTeamIntegrationAccess } from "@/lib/integrations/github/api-auth.server";
import { buildFusionAuthorizeUrl } from "@/lib/integrations/fusion/auth-url.server";
import { FusionApiError } from "@/lib/integrations/fusion/app.server";
import {
  connectTeamFusionProject,
  getTeamFusionIntegration,
  TeamFusionIntegrationError,
} from "@/lib/integrations/fusion/team.server";
import {
  FusionConnectSessionError,
  verifyFusionConnectSession,
} from "@/lib/integrations/fusion/connect-session.server";

type ConnectProjectPayload = {
  connectSession?: string;
  projectUrn?: string;
  projectName?: string | null;
};

function integrationErrorStatus(
  error: TeamFusionIntegrationError,
): number {
  switch (error.code) {
    case "ALREADY_CONNECTED":
    case "PROJECT_IN_USE":
      return 409;
    case "FORBIDDEN":
      return 403;
    case "NOT_FOUND":
      return 404;
    default:
      return 400;
  }
}

export async function GET() {
  const access = await requireTeamIntegrationAccess();

  if (!access.ok) {
    return access.response;
  }

  const existing = await getTeamFusionIntegration(access.teamId);

  if (existing) {
    return NextResponse.json(
      {
        error:
          "Team already has a Fusion integration. Disconnect it before connecting a new project.",
      },
      { status: 409 },
    );
  }

  try {
    const authorizeUrl = buildFusionAuthorizeUrl(access.teamId, access.userId);

    return NextResponse.json({ authorizeUrl });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to build authorize URL.";

    return NextResponse.json({ error: message }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const access = await requireTeamIntegrationAccess();

  if (!access.ok) {
    return access.response;
  }

  let body: ConnectProjectPayload;

  try {
    body = (await request.json()) as ConnectProjectPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const connectSession = body.connectSession?.trim();
  const projectUrn = body.projectUrn?.trim();
  const projectName =
    typeof body.projectName === "string" ? body.projectName : null;

  if (!connectSession) {
    return NextResponse.json(
      { error: "connectSession is required." },
      { status: 400 },
    );
  }

  if (!projectUrn) {
    return NextResponse.json(
      { error: "projectUrn is required." },
      { status: 400 },
    );
  }

  let session;

  try {
    session = verifyFusionConnectSession(connectSession);
  } catch (error) {
    const message =
      error instanceof FusionConnectSessionError
        ? error.message
        : "Invalid or expired Fusion connect session.";

    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (session.userId !== access.userId || session.teamId !== access.teamId) {
    return NextResponse.json(
      { error: "Fusion connect session does not match your account." },
      { status: 403 },
    );
  }

  try {
    const integration = await connectTeamFusionProject({
      teamId: access.teamId,
      userId: access.userId,
      accessToken: session.accessToken,
      projectUrn,
      projectName,
    });

    return NextResponse.json({
      integration,
      message: "Fusion project connected.",
    });
  } catch (error) {
    if (error instanceof TeamFusionIntegrationError) {
      return NextResponse.json(
        { error: error.message },
        { status: integrationErrorStatus(error) },
      );
    }

    if (error instanceof FusionApiError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status ?? 502 },
      );
    }

    throw error;
  }
}
