import { prisma } from "@stlvex/database";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  createTestTeam,
  createTestUser,
  deleteTestTeam,
  hasTestDatabase,
} from "../../helpers/test-database.js";
import { createChatInputInteractionStub } from "../../helpers/discord-fixtures.js";
import inviteUsersCommand from "../../../src/commands/invite.js";

const describeIntegration = hasTestDatabase() ? describe : describe.skip;

describeIntegration("invite-users RBAC integration", () => {
  let teamId = "";
  const leaderDiscordId = "131313131313131313";
  const memberDiscordId = "141414141414141414";

  beforeEach(async () => {
    const team = await createTestTeam();
    teamId = team.id;

    await createTestUser(teamId, {
      discordId: leaderDiscordId,
      role: "TEAM_LEADER",
    });
    await createTestUser(teamId, {
      discordId: memberDiscordId,
      role: "TEAM_MEMBER",
    });
  });

  afterEach(async () => {
    if (teamId) {
      await deleteTestTeam(teamId);
    }

    teamId = "";
  });

  it("allows team leaders to create invites", async () => {
    const interaction = createChatInputInteractionStub({
      userId: leaderDiscordId,
    });

    await inviteUsersCommand.execute(interaction as never);

    expect(await prisma.invite.count({ where: { teamId } })).toBe(1);
    expect(interaction.editReply).toHaveBeenCalled();
  });

  it("blocks standard members", async () => {
    const interaction = createChatInputInteractionStub({
      userId: memberDiscordId,
    });

    await inviteUsersCommand.execute(interaction as never);

    expect(await prisma.invite.count({ where: { teamId } })).toBe(0);
    expect(interaction.editReply).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.stringContaining("Only admins and team leaders"),
      }),
    );
  });
});
