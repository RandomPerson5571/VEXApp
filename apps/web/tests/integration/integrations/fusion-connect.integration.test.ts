import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  createTestFusionIntegration,
  createTestTeam,
  createTestUser,
  deleteTestTeam,
  hasTestDatabase,
} from "../../helpers/auth/test-database";

const getFusionProjectDetailsMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/integrations/fusion/app.server", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/integrations/fusion/app.server")>();
  return {
    ...actual,
    getFusionProjectDetails: getFusionProjectDetailsMock,
    createProjectWebhook: vi.fn().mockResolvedValue("hook-123"),
  };
});

import {
  connectTeamFusionProject,
  TeamFusionIntegrationError,
} from "@/lib/integrations/fusion/team.server";

const describeIntegration = hasTestDatabase() ? describe : describe.skip;
const PROJECT_URN = "urn:adsk.wipprod:fs.folder:co.vitest123";

describeIntegration("connectTeamFusionProject integration", () => {
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

    getFusionProjectDetailsMock.mockResolvedValue({
      folderUrn: PROJECT_URN,
      projectName: "Vitest Fusion Project",
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

  it("persists a Fusion integration on success", async () => {
    const integration = await connectTeamFusionProject({
      teamId: teamAId,
      userId: userAId,
      accessToken: "token",
      projectUrn: PROJECT_URN,
      projectName: "Vitest Fusion Project",
    });

    expect(integration.teamId).toBe(teamAId);
    expect(integration.projectUrn).toBe(PROJECT_URN);
  });

  it("throws ALREADY_CONNECTED when team already has an integration", async () => {
    await createTestFusionIntegration(teamAId, { projectUrn: PROJECT_URN });

    await expect(
      connectTeamFusionProject({
        teamId: teamAId,
        userId: userAId,
        accessToken: "token",
        projectUrn: PROJECT_URN,
        projectName: null,
      }),
    ).rejects.toMatchObject({ code: "ALREADY_CONNECTED" });
  });

  it("throws PROJECT_IN_USE for another team", async () => {
    await createTestFusionIntegration(teamBId, { projectUrn: PROJECT_URN });

    await expect(
      connectTeamFusionProject({
        teamId: teamAId,
        userId: userAId,
        accessToken: "token",
        projectUrn: PROJECT_URN,
        projectName: null,
      }),
    ).rejects.toMatchObject({ code: "PROJECT_IN_USE" });
  });

  it("throws FORBIDDEN for cross-team users", async () => {
    await expect(
      connectTeamFusionProject({
        teamId: teamAId,
        userId: userBId,
        accessToken: "token",
        projectUrn: PROJECT_URN,
        projectName: null,
      }),
    ).rejects.toBeInstanceOf(TeamFusionIntegrationError);

    await expect(
      connectTeamFusionProject({
        teamId: teamAId,
        userId: userBId,
        accessToken: "token",
        projectUrn: PROJECT_URN,
        projectName: null,
      }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
