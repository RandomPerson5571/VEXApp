import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  createTestTeam,
  createTestUser,
  deleteTestTeam,
  hasTestDatabase,
} from "../../helpers/auth/test-database";

const getCurrentUserMock = vi.hoisted(() => vi.fn());
const exchangeAuthorizationCodeMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/auth/current-user", () => ({
  getCurrentUser: getCurrentUserMock,
}));

vi.mock("@/lib/integrations/fusion/app.server", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/integrations/fusion/app.server")>();
  return {
    ...actual,
    exchangeAuthorizationCode: exchangeAuthorizationCodeMock,
  };
});

import { GET as getGitHubCallback } from "@/app/api/integrations/github/callback/route";
import { GET as getFusionCallback } from "@/app/api/integrations/fusion/callback/route";
import { createGitHubInstallState } from "@/lib/integrations/github/state.server";
import { createFusionOAuthState } from "@/lib/integrations/fusion/state.server";

const describeIntegration = hasTestDatabase() ? describe : describe.skip;

describeIntegration("oauth integration callback integration", () => {
  let teamId = "";
  let userId = "";
  const savedSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const savedGithubSecret = process.env.GITHUB_INSTALL_STATE_SECRET;
  const savedFusionSecret = process.env.FUSION_OAUTH_STATE_SECRET;

  beforeEach(async () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://example.test";
    process.env.GITHUB_INSTALL_STATE_SECRET = "vitest-github-state-secret";
    process.env.FUSION_OAUTH_STATE_SECRET = "vitest-fusion-state-secret";

    const team = await createTestTeam();
    teamId = team.id;

    const user = await createTestUser(teamId);
    userId = user.id;

    getCurrentUserMock.mockResolvedValue({ profile: user });
    exchangeAuthorizationCodeMock.mockResolvedValue("fusion-access-token");
  });

  afterEach(async () => {
    if (teamId) {
      await deleteTestTeam(teamId);
    }

    teamId = "";
    userId = "";

    if (savedSiteUrl === undefined) {
      delete process.env.NEXT_PUBLIC_SITE_URL;
    } else {
      process.env.NEXT_PUBLIC_SITE_URL = savedSiteUrl;
    }

    if (savedGithubSecret === undefined) {
      delete process.env.GITHUB_INSTALL_STATE_SECRET;
    } else {
      process.env.GITHUB_INSTALL_STATE_SECRET = savedGithubSecret;
    }

    if (savedFusionSecret === undefined) {
      delete process.env.FUSION_OAUTH_STATE_SECRET;
    } else {
      process.env.FUSION_OAUTH_STATE_SECRET = savedFusionSecret;
    }
  });

  it("redirects GitHub callback with installation id on valid state", async () => {
    const state = createGitHubInstallState(teamId, userId);

    const response = await getGitHubCallback(
      new Request(
        `https://example.test/api/integrations/github/callback?state=${encodeURIComponent(state)}&installation_id=12345`,
      ),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("githubInstall=12345");
  });

  it("redirects Fusion callback with connect session on valid state", async () => {
    const state = createFusionOAuthState(teamId, userId);

    const response = await getFusionCallback(
      new Request(
        `https://example.test/api/integrations/fusion/callback?state=${encodeURIComponent(state)}&code=fusion-code`,
      ),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("fusionConnect=");
  });
});
