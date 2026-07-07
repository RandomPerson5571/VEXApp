import { NextResponse } from "next/server";

import { requireTeamIntegrationAccess } from "@/lib/integrations/github/api-auth.server";
import {
  FusionApiError,
  listFusionProjects,
} from "@/lib/integrations/fusion/app.server";
import {
  FusionConnectSessionError,
  verifyFusionConnectSession,
} from "@/lib/integrations/fusion/connect-session.server";

export async function GET(request: Request) {
  const access = await requireTeamIntegrationAccess();

  if (!access.ok) {
    return access.response;
  }

  const { searchParams } = new URL(request.url);
  const connectSession = searchParams.get("connectSession")?.trim();

  if (!connectSession) {
    return NextResponse.json(
      { error: "connectSession query parameter is required." },
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
    const projects = await listFusionProjects(session.accessToken);

    return NextResponse.json({ projects });
  } catch (error) {
    if (error instanceof FusionApiError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status ?? 502 },
      );
    }

    const message =
      error instanceof Error
        ? error.message
        : "Failed to list Fusion projects.";

    return NextResponse.json({ error: message }, { status: 502 });
  }
}
