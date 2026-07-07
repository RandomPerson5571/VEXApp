import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  createTestGitHubIntegration,
  createTestTeam,
  createTestUser,
  deleteTestTeam,
  hasTestDatabase,
} from "../../helpers/auth/test-database";

const getRepositoryMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/integrations/github/app.server", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/integrations/github/app.server")>();
  return {
    ...actual,
    getRepository: getRepositoryMock,
  };
});

import {
  connectTeamRepository,
  TeamGitHubIntegrationError,
} from "@/lib/integrations/github/team.server";

const describeIntegration = hasTestDatabase() ? describe : describe.skip;
const REPO = "vitest-org/robot-code";

describeIntegration("connectTeamRepository integration", () => {
  let teamAId = "";
  let teamBId = "";
  let userAId = "";
  let userBId = "";

  beforeEach(async () => {
    vi.clearAllMocks();

    const teamA = await createTestTeam();
    const teamB = await createTestTeam();
    teamAId = teamA.id;
    teamBId = teamB.id;

    const userA = await createTestUser(teamAId);
    const userB = await createTestUser(teamBId);
    userAId = userA.id;
    userBId = userB.id;

    getRepositoryMock.mockResolvedValue({
      repositoryId: 123,
      fullName: REPO,
      htmlUrl: `https://github.com/${REPO}`,
    });
  });

  afterEach(async () => {
    if (teamAId) await deleteTestTeam(teamAId);
    if (teamBId) await deleteTestTeam(teamBId);

    teamAId = "";
    teamBId = "";
    userAId = "";
    userBId = "";
  });

  it("persists a GitHub integration on success", async () => {
    const integration = await connectTeamRepository({
      teamId: teamAId,
      userId: userAId,
      installationId: 42,
      repositoryFullName: REPO,
    });

    expect(integration.teamId).toBe(teamAId);
    expect(integration.repositoryFullName).toBe(REPO);
  });

  it("throws ALREADY_CONNECTED when team already has an integration", async () => {
    await createTestGitHubIntegration(teamAId, { repositoryFullName: REPO });

    await expect(
      connectTeamRepository({
        teamId: teamAId,
        userId: userAId,
        installationId: 42,
        repositoryFullName: REPO,
      }),
    ).rejects.toMatchObject({ code: "ALREADY_CONNECTED" });
  });

  it("throws INSTALLATION_IN_USE for another team", async () => {
    await createTestGitHubIntegration(teamBId, {
      repositoryFullName: "other/repo",
      installationId: 99,
    });

    await expect(
      connectTeamRepository({
        teamId: teamAId,
        userId: userAId,
        installationId: 99,
        repositoryFullName: REPO,
      }),
    ).rejects.toMatchObject({ code: "INSTALLATION_IN_USE" });
  });

  it("throws FORBIDDEN for cross-team users", async () => {
    await expect(
      connectTeamRepository({
        teamId: teamAId,
        userId: userBId,
        installationId: 42,
        repositoryFullName: REPO,
      }),
    ).rejects.toBeInstanceOf(TeamGitHubIntegrationError);

    await expect(
      connectTeamRepository({
        teamId: teamAId,
        userId: userBId,
        installationId: 42,
        repositoryFullName: REPO,
      }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
