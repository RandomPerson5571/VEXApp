import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  createTestGitHubIntegration,
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

import { handleGitHubEvent } from "../../src/api/handlers/github-event.js";
import type { WebhookContext } from "../../src/api/context.js";

const describeIntegration = hasTestDatabase() ? describe : describe.skip;

const REPO = "vitest-org/push-repo";

function mockContext(): WebhookContext {
  return { client: { isReady: () => true } as WebhookContext["client"] };
}

const pushPayload = {
  ref: "refs/heads/main",
  pusher: { name: "alice" },
  commits: [{}],
  repository: { full_name: REPO, html_url: `https://github.com/${REPO}` },
};

describeIntegration("github event integration", () => {
  let teamId = "";
  let pushDiscordId = "";
  let deploymentDiscordId = "";

  beforeEach(async () => {
    vi.clearAllMocks();
    sendDiscordDmBatchMock.mockResolvedValue(undefined);

    const suffix = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
    pushDiscordId = `1111${suffix}`.slice(0, 18);
    deploymentDiscordId = `2222${suffix}`.slice(0, 18);

    const team = await createTestTeam();
    teamId = team.id;

    await createTestGitHubIntegration(teamId, {
      repositoryFullName: REPO,
      isActive: true,
    });

    const pushUser = await createTestUser(teamId, {
      discordId: pushDiscordId,
    });
    await createTestNotificationSettings(pushUser.id, {
      githubNotifsEnabled: true,
      githubEvents: ["push"],
      enableDiscordPushNotifs: true,
    });

    const deploymentOnlyUser = await createTestUser(teamId, {
      discordId: deploymentDiscordId,
    });
    await createTestNotificationSettings(deploymentOnlyUser.id, {
      githubNotifsEnabled: true,
      githubEvents: ["deployment"],
      enableDiscordPushNotifs: true,
    });

    const optedOutUser = await createTestUser(teamId, {
      discordId: `3333${suffix}`.slice(0, 18),
    });
    await createTestNotificationSettings(optedOutUser.id, {
      githubNotifsEnabled: true,
      githubEvents: ["push"],
      enableDiscordPushNotifs: false,
    });
  });

  afterEach(async () => {
    if (teamId) {
      await deleteTestTeam(teamId);
    }

    teamId = "";
  });

  it("notifies only push-opted users with linked Discord IDs", async () => {
    await handleGitHubEvent(mockContext(), "push", pushPayload);

    expect(sendDiscordDmBatchMock).toHaveBeenCalledOnce();
    const [, discordIds] = sendDiscordDmBatchMock.mock.calls[0]!;
    expect(discordIds).toEqual([pushDiscordId]);
  });

  it("filters deployment_status recipients by deployment preference", async () => {
    await handleGitHubEvent(mockContext(), "deployment_status", {
      repository: { full_name: REPO },
      deployment_status: {
        environment: "production",
        state: "success",
      },
    });

    expect(sendDiscordDmBatchMock).toHaveBeenCalledOnce();
    const [, discordIds] = sendDiscordDmBatchMock.mock.calls[0]!;
    expect(discordIds).toEqual([deploymentDiscordId]);
  });

  it("skips unmapped repositories", async () => {
    await handleGitHubEvent(mockContext(), "push", {
      ...pushPayload,
      repository: { full_name: "unknown/other-repo" },
    });

    expect(sendDiscordDmBatchMock).not.toHaveBeenCalled();
  });
});
