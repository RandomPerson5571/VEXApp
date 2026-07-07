import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  createTestTask,
  createTestTeam,
  createTestUser,
  deleteTestTeam,
  hasTestDatabase,
} from "../../helpers/test-database.js";
import { createChatInputInteractionStub } from "../../helpers/discord-fixtures.js";
import completeTaskCommand from "../../../src/commands/tasks/completeTask.js";

const describeIntegration = hasTestDatabase() ? describe : describe.skip;

describeIntegration("complete-task team isolation integration", () => {
  let teamAId = "";
  let teamBId = "";
  let userAId = "";
  const userADiscordId = "999999999999999999";

  let teamBTaskId = "";

  beforeEach(async () => {
    const teamA = await createTestTeam();
    const teamB = await createTestTeam();
    teamAId = teamA.id;
    teamBId = teamB.id;

    const userA = await createTestUser(teamAId, { discordId: userADiscordId });
    userAId = userA.id;

    const userB = await createTestUser(teamBId);
    const otherTeamTask = await createTestTask(teamBId, userB.id, {
      title: "Other team task",
    });
    teamBTaskId = otherTeamTask.id;
  });

  afterEach(async () => {
    if (teamAId) await deleteTestTeam(teamAId);
    if (teamBId) await deleteTestTeam(teamBId);

    teamAId = "";
    teamBId = "";
    userAId = "";
  });

  it("rejects completing a task from another team", async () => {
    const interaction = createChatInputInteractionStub({
      userId: userADiscordId,
      options: { task: teamBTaskId, status: "Done" },
    });

    await completeTaskCommand.execute(interaction as never);

    expect(interaction.editReply).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.stringContaining("only update tasks on your own team"),
      }),
    );
  });

  it("completes a task on the user's own team", async () => {
    const ownTask = await createTestTask(teamAId, userAId, {
      title: "Own team task",
    });

    const interaction = createChatInputInteractionStub({
      userId: userADiscordId,
      options: { task: ownTask.id, status: "Done" },
    });

    await completeTaskCommand.execute(interaction as never);

    expect(interaction.editReply).toHaveBeenCalledWith(
      expect.objectContaining({
        embeds: expect.any(Array),
      }),
    );
  });
});
