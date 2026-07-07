import { prisma } from "@stlvex/database";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { findFusionNotificationRecipients } from "@stlvex/database";

describe("findFusionNotificationRecipients", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("finds team members with fusion notifications enabled", async () => {
    const findMany = vi
      .spyOn(prisma.user, "findMany")
      .mockResolvedValue([]);

    await findFusionNotificationRecipients("team-abc");

    expect(findMany).toHaveBeenCalledWith({
      where: {
        teamId: "team-abc",
        OR: [
          { discordId: { not: null } },
          { discordAccount: { isNot: null } },
        ],
        notificationSettings: {
          enableDiscordPushNotifs: true,
          fusionNotifsEnabled: true,
        },
      },
      include: { discordAccount: true, notificationSettings: true },
    });
  });
});
