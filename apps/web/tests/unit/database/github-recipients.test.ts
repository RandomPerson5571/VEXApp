import { prisma } from "@stlvex/database";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { findGitHubNotificationRecipients } from "@stlvex/database";

describe("findGitHubNotificationRecipients", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("filters recipients by team, Discord linkage, and notification preferences", async () => {
    const findMany = vi.spyOn(prisma.user, "findMany").mockResolvedValue([]);

    await findGitHubNotificationRecipients("team-123", "push");

    expect(findMany).toHaveBeenCalledWith({
      where: {
        teamId: "team-123",
        OR: [
          { discordId: { not: null } },
          { discordAccount: { isNot: null } },
        ],
        notificationSettings: {
          enableDiscordPushNotifs: true,
          githubNotifsEnabled: true,
          githubEvents: { has: "push" },
        },
      },
      include: { discordAccount: true, notificationSettings: true },
    });
  });

  it("passes the requested GitHub event type into the preference filter", async () => {
    const findMany = vi.spyOn(prisma.user, "findMany").mockResolvedValue([]);

    await findGitHubNotificationRecipients("team-456", "pull_request");

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          teamId: "team-456",
          notificationSettings: expect.objectContaining({
            githubEvents: { has: "pull_request" },
          }),
        }),
      }),
    );
  });
});
