import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  createTestTask,
  createTestTeam,
  createTestUser,
  deleteTestTeam,
  hasTestDatabase,
} from "../../helpers/test-database.js";
import { createAutocompleteInteractionStub } from "../../helpers/discord-fixtures.js";
import completeTaskCommand from "../../../src/commands/tasks/completeTask.js";

const describeIntegration = hasTestDatabase() ? describe : describe.skip;

describeIntegration("complete-task autocomplete integration", () => {
  let teamAId = "";
  let teamBId = "";
  const userADiscordId = "101010101010101010";

  beforeEach(async () => {
    const teamA = await createTestTeam();
    const teamB = await createTestTeam();
    teamAId = teamA.id;
    teamBId = teamB.id;

    const userA = await createTestUser(teamAId, { discordId: userADiscordId });
    const userB = await createTestUser(teamBId);

    await createTestTask(teamAId, userA.id, { title: "Alpha task" });
    await createTestTask(teamBId, userB.id, { title: "Beta task" });
  });

  afterEach(async () => {
    if (teamAId) await deleteTestTeam(teamAId);
    if (teamBId) await deleteTestTeam(teamBId);

    teamAId = "";
    teamBId = "";
  });

  it("returns only tasks from the user's team", async () => {
    const interaction = createAutocompleteInteractionStub({
      userId: userADiscordId,
      focused: { name: "task", value: "" },
    });

    await completeTaskCommand.autocomplete?.(interaction as never);

    expect(interaction.respond).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ name: expect.stringContaining("Alpha task") }),
      ]),
    );

    const choices = interaction.respond.mock.calls[0]?.[0] as Array<{ name: string }>;
    expect(choices.some((choice) => choice.name.includes("Beta task"))).toBe(false);
  });
});
