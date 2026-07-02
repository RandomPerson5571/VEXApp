import { NextResponse } from "next/server";

import {
  GitHubApiError,
  listInstallationRepositories,
} from "@/lib/integrations/github/app.server";
import { requireTeamIntegrationAccess } from "@/lib/integrations/github/api-auth.server";

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
  const access = await requireTeamIntegrationAccess();

  if (!access.ok) {
    return access.response;
  }

  const { searchParams } = new URL(request.url);
  const installationId = parseInstallationId(
    searchParams.get("installationId"),
  );

  if (!installationId) {
    return NextResponse.json(
      { error: "installationId query parameter is required." },
      { status: 400 },
    );
  }

  try {
    const repositories = await listInstallationRepositories(installationId);

    return NextResponse.json({ repositories });
  } catch (error) {
    if (error instanceof GitHubApiError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status ?? 502 },
      );
    }

    const message =
      error instanceof Error
        ? error.message
        : "Failed to list GitHub repositories.";

    return NextResponse.json({ error: message }, { status: 502 });
  }
}
