import { prisma } from "@stlvex/database";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  createTestTask,
  createTestTeam,
  createTestUser,
  deleteTestTeam,
  hasTestDatabase,
} from "../../helpers/test-database.js";
import { createChatInputInteractionStub } from "../../helpers/discord-fixtures.js";
import tasksCommand from "../../../src/commands/tasks/viewTasks.js";

const describeIntegration = hasTestDatabase() ? describe : describe.skip;

describeIntegration("tasks filters integration", () => {
  let teamId = "";
  let userId = "";
  const discordId = "121212121212121212";

  beforeEach(async () => {
    const team = await createTestTeam();
    teamId = team.id;

    const user = await createTestUser(teamId, { discordId });
    userId = user.id;

    await createTestTask(teamId, userId, {
      title: "High priority open",
      priority: "High",
      status: "InProgress",
    });

    const doneTask = await createTestTask(teamId, userId, {
      title: "Done task",
      status: "Done",
    });

    await prisma.taskAssignment.create({
      data: { taskId: doneTask.id, userId },
    });
  });

  afterEach(async () => {
    if (teamId) {
      await deleteTestTeam(teamId);
    }

    teamId = "";
    userId = "";
  });

  it("defaults to incomplete tasks", async () => {
    const interaction = createChatInputInteractionStub({ userId: discordId });

    await tasksCommand.execute(interaction as never);

    const payload = interaction.editReply.mock.calls[0]?.[0] as {
      embeds: Array<{ toJSON: () => { fields?: Array<{ name: string }> } }>;
    };
    const fields = payload.embeds[0]?.toJSON().fields ?? [];
    expect(fields.some((field) => field.name.includes("High priority open"))).toBe(true);
    expect(fields.some((field) => field.name.includes("Done task"))).toBe(false);
  });

  it("filters assigned-to-me tasks", async () => {
    const interaction = createChatInputInteractionStub({
      userId: discordId,
      options: { "assigned-to-me": "true", status: "ALL" },
    });

    await tasksCommand.execute(interaction as never);

    const payload = interaction.editReply.mock.calls[0]?.[0] as {
      embeds: Array<{ toJSON: () => { fields?: Array<{ name: string }> } }>;
    };
    const fields = payload.embeds[0]?.toJSON().fields ?? [];
    expect(fields).toHaveLength(1);
    expect(fields[0]?.name).toContain("Done task");
  });
});
