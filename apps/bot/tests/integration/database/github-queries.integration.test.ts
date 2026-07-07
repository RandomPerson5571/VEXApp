import {
  findGitHubNotificationRecipients,
  findTeamGitHubIntegrationByRepo,
} from "@stlvex/database";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  createTestGitHubIntegration,
  createTestNotificationSettings,
  createTestTeam,
  createTestUser,
  deleteTestTeam,
  hasTestDatabase,
} from "../../helpers/test-database.js";

const describeIntegration = hasTestDatabase() ? describe : describe.skip;
const REPO = "vitest-org/query-repo";

describeIntegration("github database queries integration", () => {
  let teamId = "";

  beforeEach(async () => {
    const team = await createTestTeam();
    teamId = team.id;
  });

  afterEach(async () => {
    if (teamId) {
      await deleteTestTeam(teamId);
    }

    teamId = "";
  });

  it("finds active integrations by repository full name", async () => {
    await createTestGitHubIntegration(teamId, {
      repositoryFullName: REPO,
      isActive: true,
    });

    const found = await findTeamGitHubIntegrationByRepo(REPO);
    expect(found?.teamId).toBe(teamId);
  });

  it("returns null for inactive integrations", async () => {
    await createTestGitHubIntegration(teamId, {
      repositoryFullName: REPO,
      isActive: false,
    });

    await expect(findTeamGitHubIntegrationByRepo(REPO)).resolves.toBeNull();
  });

  it("returns null for unknown repositories", async () => {
    await expect(findTeamGitHubIntegrationByRepo("missing/repo")).resolves.toBeNull();
  });

  it("filters notification recipients by event preference and Discord linkage", async () => {
    const linkedUser = await createTestUser(teamId, {
      discordId: "444444444444444444",
    });
    await createTestNotificationSettings(linkedUser.id, {
      githubNotifsEnabled: true,
      githubEvents: ["push"],
      enableDiscordPushNotifs: true,
    });

    const accountOnlyUser = await createTestUser(teamId, {
      discordId: null,
      withDiscordAccount: true,
    });
    await createTestNotificationSettings(accountOnlyUser.id, {
      githubNotifsEnabled: true,
      githubEvents: ["push"],
      enableDiscordPushNotifs: true,
    });
    await createTestUser(teamId, { discordId: null });

    const recipients = await findGitHubNotificationRecipients(teamId, "push");

    expect(recipients).toHaveLength(2);
    expect(recipients.every((user) => user.notificationSettings?.githubEvents.includes("push"))).toBe(
      true,
    );
  });
});
