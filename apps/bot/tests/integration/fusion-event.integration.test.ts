import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  createTestFusionIntegration,
  createTestNotificationSettings,
  createTestTeam,
  createTestUser,
  deleteTestTeam,
  hasTestDatabase,
} from "../helpers/test-database.js";

const sendDiscordDmBatchMock = vi.hoisted(() => vi.fn());

vi.mock("../../src/services/discord-dm.js", () => ({
  sendDiscordDmBatch: sendDiscordDmBatchMock,
}));

import { handleFusionEvent } from "../../src/api/handlers/fusion-event.js";
import type { WebhookContext } from "../../src/api/context.js";

const describeIntegration = hasTestDatabase() ? describe : describe.skip;
const PROJECT_URN = "urn:adsk.wipprod:fs.folder:co.fusion-event";

function mockContext(): WebhookContext {
  return { client: { isReady: () => true } as WebhookContext["client"] };
}

describeIntegration("fusion event integration", () => {
  let teamId = "";

  beforeEach(async () => {
    vi.clearAllMocks();
    sendDiscordDmBatchMock.mockResolvedValue(undefined);

    const team = await createTestTeam();
    teamId = team.id;

    await createTestFusionIntegration(teamId, {
      projectUrn: PROJECT_URN,
      isActive: true,
    });

    const optedIn = await createTestUser(teamId, {
      discordId: "555555555555555555",
    });
    await createTestNotificationSettings(optedIn.id, {
      fusionNotifsEnabled: true,
      enableDiscordPushNotifs: true,
    });

    const optedOut = await createTestUser(teamId, {
      discordId: "666666666666666666",
    });
    await createTestNotificationSettings(optedOut.id, {
      fusionNotifsEnabled: false,
      enableDiscordPushNotifs: true,
    });
  });

  afterEach(async () => {
    if (teamId) {
      await deleteTestTeam(teamId);
    }

    teamId = "";
  });

  it("notifies fusion-opted users for mapped projects", async () => {
    await handleFusionEvent(mockContext(), {
      hook: {
        event: "dm.version.added",
        scope: { folder: PROJECT_URN },
      },
      payload: { name: "Bracket", versionNumber: 2 },
    });

    expect(sendDiscordDmBatchMock).toHaveBeenCalledOnce();
    const [, discordIds] = sendDiscordDmBatchMock.mock.calls[0]!;
    expect(discordIds).toEqual(["555555555555555555"]);
  });
});
