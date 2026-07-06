import { beforeEach, describe, expect, it, vi } from "vitest";

const findTeamGitHubIntegrationByRepoMock = vi.hoisted(() => vi.fn());
const findGitHubNotificationRecipientsMock = vi.hoisted(() => vi.fn());
const sendDiscordDmBatchMock = vi.hoisted(() => vi.fn());

vi.mock("@stlvex/database", () => ({
  findTeamGitHubIntegrationByRepo: findTeamGitHubIntegrationByRepoMock,
  findGitHubNotificationRecipients: findGitHubNotificationRecipientsMock,
}));

vi.mock("../../src/services/discord-dm.js", () => ({
  sendDiscordDmBatch: sendDiscordDmBatchMock,
}));

import { handleGitHubEvent } from "../../src/api/handlers/github-event.js";
import type { WebhookContext } from "../../src/api/context.js";

const REPO = "vex-team/robot-code";
const TEAM_ID = "team-1";

const pushPayload = {
  ref: "refs/heads/main",
  pusher: { name: "alice" },
  commits: [{}],
  repository: { full_name: REPO, html_url: `https://github.com/${REPO}` },
};

function mockContext(): WebhookContext {
  return { client: {} as WebhookContext["client"] };
}

function mockIntegration(overrides: { isActive?: boolean } = {}) {
  return {
    teamId: TEAM_ID,
    repositoryFullName: REPO,
    isActive: overrides.isActive ?? true,
    team: { id: TEAM_ID },
  };
}

function mockRecipient(
  overrides: {
    id?: string;
    discordId?: string | null;
    discordAccount?: { discordId: string } | null;
  } = {},
) {
  return {
    id: overrides.id ?? "user-1",
    discordId:
      "discordId" in overrides
        ? (overrides.discordId ?? null)
        : "111222333444555666",
    discordAccount:
      "discordAccount" in overrides
        ? (overrides.discordAccount ?? null)
        : null,
    notificationSettings: {
      enableDiscordPushNotifs: true,
      githubNotifsEnabled: true,
      githubEvents: ["push"],
    },
  };
}

describe("handleGitHubEvent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sendDiscordDmBatchMock.mockResolvedValue(undefined);
  });

  it("ignores ping events without touching the database", async () => {
    await handleGitHubEvent(mockContext(), "ping", pushPayload);

    expect(findTeamGitHubIntegrationByRepoMock).not.toHaveBeenCalled();
    expect(sendDiscordDmBatchMock).not.toHaveBeenCalled();
  });

  it("skips when repository.full_name is missing", async () => {
    await handleGitHubEvent(mockContext(), "push", { ref: "refs/heads/main" });

    expect(findTeamGitHubIntegrationByRepoMock).not.toHaveBeenCalled();
    expect(sendDiscordDmBatchMock).not.toHaveBeenCalled();
  });

  it("skips unmapped GitHub event types", async () => {
    await handleGitHubEvent(mockContext(), "star", pushPayload);

    expect(findTeamGitHubIntegrationByRepoMock).not.toHaveBeenCalled();
    expect(sendDiscordDmBatchMock).not.toHaveBeenCalled();
  });

  it("skips when no active integration exists for the repository", async () => {
    findTeamGitHubIntegrationByRepoMock.mockResolvedValue(null);

    await handleGitHubEvent(mockContext(), "push", pushPayload);

    expect(findTeamGitHubIntegrationByRepoMock).toHaveBeenCalledWith(REPO);
    expect(findGitHubNotificationRecipientsMock).not.toHaveBeenCalled();
    expect(sendDiscordDmBatchMock).not.toHaveBeenCalled();
  });

  it("skips when the integration is inactive", async () => {
    findTeamGitHubIntegrationByRepoMock.mockResolvedValue(
      mockIntegration({ isActive: false }),
    );

    await handleGitHubEvent(mockContext(), "push", pushPayload);

    expect(findGitHubNotificationRecipientsMock).not.toHaveBeenCalled();
    expect(sendDiscordDmBatchMock).not.toHaveBeenCalled();
  });

  it("skips when no team members opted into the event", async () => {
    findTeamGitHubIntegrationByRepoMock.mockResolvedValue(mockIntegration());
    findGitHubNotificationRecipientsMock.mockResolvedValue([]);

    await handleGitHubEvent(mockContext(), "push", pushPayload);

    expect(findGitHubNotificationRecipientsMock).toHaveBeenCalledWith(
      TEAM_ID,
      "push",
    );
    expect(sendDiscordDmBatchMock).not.toHaveBeenCalled();
  });

  it("skips when recipients have no linked Discord accounts", async () => {
    findTeamGitHubIntegrationByRepoMock.mockResolvedValue(mockIntegration());
    findGitHubNotificationRecipientsMock.mockResolvedValue([
      mockRecipient({ discordId: null, discordAccount: null }),
    ]);

    await handleGitHubEvent(mockContext(), "push", pushPayload);

    expect(sendDiscordDmBatchMock).not.toHaveBeenCalled();
  });

  it("sends a Discord DM embed to opted-in recipients", async () => {
    const context = mockContext();
    findTeamGitHubIntegrationByRepoMock.mockResolvedValue(mockIntegration());
    findGitHubNotificationRecipientsMock.mockResolvedValue([mockRecipient()]);

    await handleGitHubEvent(context, "push", pushPayload);

    expect(sendDiscordDmBatchMock).toHaveBeenCalledOnce();
    const [client, discordIds, embed] = sendDiscordDmBatchMock.mock.calls[0]!;
    expect(client).toBe(context.client);
    expect(discordIds).toEqual(["111222333444555666"]);
    expect(embed.toJSON().title).toBe("Push to main");
    expect(embed.toJSON().description).toContain(`**Repository:** ${REPO}`);
  });

  it("resolves Discord IDs from discordAccount when user.discordId is null", async () => {
    findTeamGitHubIntegrationByRepoMock.mockResolvedValue(mockIntegration());
    findGitHubNotificationRecipientsMock.mockResolvedValue([
      mockRecipient({
        discordId: null,
        discordAccount: { discordId: "999888777666555444" },
      }),
    ]);

    await handleGitHubEvent(mockContext(), "push", pushPayload);

    const [, discordIds] = sendDiscordDmBatchMock.mock.calls[0]!;
    expect(discordIds).toEqual(["999888777666555444"]);
  });

  it("deduplicates Discord IDs across multiple recipients", async () => {
    findTeamGitHubIntegrationByRepoMock.mockResolvedValue(mockIntegration());
    findGitHubNotificationRecipientsMock.mockResolvedValue([
      mockRecipient({ id: "user-1", discordId: "111222333444555666" }),
      mockRecipient({ id: "user-2", discordId: "111222333444555666" }),
      mockRecipient({
        id: "user-3",
        discordId: null,
        discordAccount: { discordId: "777888999000111222" },
      }),
    ]);

    await handleGitHubEvent(mockContext(), "push", pushPayload);

    const [, discordIds] = sendDiscordDmBatchMock.mock.calls[0]!;
    expect(discordIds).toEqual(["111222333444555666", "777888999000111222"]);
  });

  it("maps deployment_status to deployment preferences and embeds", async () => {
    findTeamGitHubIntegrationByRepoMock.mockResolvedValue(mockIntegration());
    findGitHubNotificationRecipientsMock.mockResolvedValue([mockRecipient()]);

    const payload = {
      repository: { full_name: REPO },
      deployment_status: {
        environment: "production",
        state: "success",
        log_url: `https://github.com/${REPO}/deployments`,
      },
    };

    await handleGitHubEvent(mockContext(), "deployment_status", payload);

    expect(findGitHubNotificationRecipientsMock).toHaveBeenCalledWith(
      TEAM_ID,
      "deployment",
    );
    const [, , embed] = sendDiscordDmBatchMock.mock.calls[0]!;
    expect(embed.toJSON().title).toBe("Deployment Status");
  });
});
