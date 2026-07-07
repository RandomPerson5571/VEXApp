import {
  findFusionNotificationRecipients,
  findTeamFusionIntegrationByProjectUrn,
} from "@stlvex/database";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  createTestFusionIntegration,
  createTestNotificationSettings,
  createTestTeam,
  createTestUser,
  deleteTestTeam,
  hasTestDatabase,
} from "../../helpers/test-database.js";

const describeIntegration = hasTestDatabase() ? describe : describe.skip;
const PROJECT_URN = "urn:adsk.wipprod:fs.folder:co.fusion-query";

describeIntegration("fusion database queries integration", () => {
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

  it("finds active integrations by project URN", async () => {
    await createTestFusionIntegration(teamId, {
      projectUrn: PROJECT_URN,
      isActive: true,
    });

    const found = await findTeamFusionIntegrationByProjectUrn(PROJECT_URN);
    expect(found?.teamId).toBe(teamId);
  });

  it("returns null for inactive integrations", async () => {
    await createTestFusionIntegration(teamId, {
      projectUrn: PROJECT_URN,
      isActive: false,
    });

    await expect(findTeamFusionIntegrationByProjectUrn(PROJECT_URN)).resolves.toBeNull();
  });

  it("returns fusion notification recipients with Discord linkage", async () => {
    const user = await createTestUser(teamId, {
      discordId: "777777777777777777",
    });
    await createTestNotificationSettings(user.id, {
      fusionNotifsEnabled: true,
      enableDiscordPushNotifs: true,
    });

    const recipients = await findFusionNotificationRecipients(teamId);
    expect(recipients).toHaveLength(1);
    expect(recipients[0]?.notificationSettings?.fusionNotifsEnabled).toBe(true);
  });
});
