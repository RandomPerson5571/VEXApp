import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  createTestGitHubIntegration,
  createTestTeam,
  createTestUser,
  deleteTestTeam,
  hasTestDatabase,
} from "../../helpers/auth/test-database";

const requireTeamIntegrationAccessMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/integrations/github/api-auth.server", () => ({
  requireTeamIntegrationAccess: requireTeamIntegrationAccessMock,
}));

import { DELETE, GET, PATCH } from "@/app/api/team/github/route";

const describeIntegration = hasTestDatabase() ? describe : describe.skip;

describeIntegration("GitHub integration lifecycle", () => {
  let teamId = "";
  let userId = "";

  beforeEach(async () => {
    vi.clearAllMocks();

    const team = await createTestTeam();
    teamId = team.id;

    const user = await createTestUser(teamId);
    userId = user.id;

    requireTeamIntegrationAccessMock.mockResolvedValue({
      ok: true,
      teamId,
      userId,
    });
  });

  afterEach(async () => {
    if (teamId) {
      await deleteTestTeam(teamId);
    }

    teamId = "";
    userId = "";
  });

  it("GET returns the seeded integration", async () => {
    await createTestGitHubIntegration(teamId, {
      repositoryFullName: "vitest-org/lifecycle",
      isActive: true,
    });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.integration.repositoryFullName).toBe("vitest-org/lifecycle");
  });

  it("PATCH toggles isActive", async () => {
    await createTestGitHubIntegration(teamId, { isActive: true });

    const response = await PATCH(
      new Request("https://example.test/api/team/github", {
        method: "PATCH",
        body: JSON.stringify({ isActive: false }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.integration.isActive).toBe(false);
  });

  it("DELETE removes the integration row", async () => {
    await createTestGitHubIntegration(teamId);

    const response = await DELETE();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.message).toContain("disconnected");

    const followUp = await GET();
    const followUpBody = await followUp.json();
    expect(followUpBody.integration).toBeNull();
  });
});
