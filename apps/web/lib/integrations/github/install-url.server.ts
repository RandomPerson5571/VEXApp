import "server-only";

import { getGitHubAppUrl } from "@/lib/integrations/env";

import { createGitHubInstallState } from "./state.server";

export function buildGitHubInstallUrl(teamId: string, userId: string): string {
  const baseUrl = getGitHubAppUrl();

  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_GITHUB_APP_URL is not configured.");
  }

  const url = new URL(baseUrl);
  url.searchParams.set("state", createGitHubInstallState(teamId, userId));

  return url.toString();
}
