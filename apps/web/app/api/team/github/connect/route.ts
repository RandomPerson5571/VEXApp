import { NextResponse } from "next/server";

import { requireTeamIntegrationAccess } from "@/lib/integrations/github/api-auth.server";
import { buildGitHubInstallUrl } from "@/lib/integrations/github/install-url.server";
import { GitHubApiError } from "@/lib/integrations/github/app.server";
import {
  connectTeamRepository,
  getTeamGitHubIntegration,
  TeamGitHubIntegrationError,
} from "@/lib/integrations/github/team.server";

type ConnectRepositoryPayload = {
  installationId?: number;
  repositoryFullName?: string;
};

function integrationErrorStatus(
  error: TeamGitHubIntegrationError,
): number {
  switch (error.code) {
    case "ALREADY_CONNECTED":
    case "INSTALLATION_IN_USE":
      return 409;
    case "FORBIDDEN":
      return 403;
    case "NOT_FOUND":
      return 404;
    default:
      return 400;
  }
}

function parseInstallationId(value: unknown): number | null {
  if (typeof value === "number" && Number.isInteger(value) && value > 0) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number.parseInt(value, 10);

    if (Number.isInteger(parsed) && parsed > 0) {
      return parsed;
    }
  }

  return null;
}

export async function GET() {
  const access = await requireTeamIntegrationAccess();

  if (!access.ok) {
    return access.response;
  }

  const existing = await getTeamGitHubIntegration(access.teamId);

  if (existing) {
    return NextResponse.json(
      {
        error:
          "Team already has a GitHub integration. Disconnect it before connecting a new repository.",
      },
      { status: 409 },
    );
  }

  try {
    const installUrl = buildGitHubInstallUrl(access.teamId, access.userId);

    return NextResponse.json({ installUrl });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to build install URL.";

    return NextResponse.json({ error: message }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const access = await requireTeamIntegrationAccess();

  if (!access.ok) {
    return access.response;
  }

  let body: ConnectRepositoryPayload;

  try {
    body = (await request.json()) as ConnectRepositoryPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const installationId = parseInstallationId(body.installationId);
  const repositoryFullName = body.repositoryFullName?.trim();

  if (!installationId) {
    return NextResponse.json(
      { error: "installationId must be a positive integer." },
      { status: 400 },
    );
  }

  if (!repositoryFullName) {
    return NextResponse.json(
      { error: "repositoryFullName is required." },
      { status: 400 },
    );
  }

  try {
    const integration = await connectTeamRepository({
      teamId: access.teamId,
      userId: access.userId,
      installationId,
      repositoryFullName,
    });

    return NextResponse.json({
      integration,
      message: "GitHub repository connected.",
    });
  } catch (error) {
    if (error instanceof TeamGitHubIntegrationError) {
      return NextResponse.json(
        { error: error.message },
        { status: integrationErrorStatus(error) },
      );
    }

    if (error instanceof GitHubApiError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status ?? 502 },
      );
    }
  }
}
