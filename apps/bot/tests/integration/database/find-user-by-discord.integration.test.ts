import { findUserByDiscordId, prisma } from "@stlvex/database";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  createTestTeam,
  createTestUser,
  deleteTestTeam,
  hasTestDatabase,
} from "../../helpers/test-database.js";

const describeIntegration = hasTestDatabase() ? describe : describe.skip;

describeIntegration("findUserByDiscordId integration", () => {
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

  it("finds users by User.discordId", async () => {
    const user = await createTestUser(teamId, {
      discordId: "181818181818181818",
    });

    const found = await findUserByDiscordId("181818181818181818");
    expect(found?.id).toBe(user.id);
  });

  it("finds users by DiscordAccount.discordId when User.discordId is null", async () => {
    const accountDiscordId = "191919191919191919";
    const user = await createTestUser(teamId, {
      discordId: null,
      withDiscordAccount: true,
    });

    await prisma.discordAccount.updateMany({
      where: { userId: user.id },
      data: { discordId: accountDiscordId },
    });

    const found = await findUserByDiscordId(accountDiscordId);
    expect(found?.id).toBe(user.id);
  });
});
