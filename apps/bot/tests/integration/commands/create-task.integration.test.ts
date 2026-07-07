import { prisma } from "@stlvex/database";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  createTestTeam,
  createTestUser,
  deleteTestTeam,
  hasTestDatabase,
} from "../../helpers/test-database.js";
import { createModalSubmitInteractionStub } from "../../helpers/discord-fixtures.js";
import createTaskCommand from "../../../src/commands/tasks/createTask.js";

const describeIntegration = hasTestDatabase() ? describe : describe.skip;

describeIntegration("create-task modal submit integration", () => {
  let teamId = "";
  let userId = "";
  const discordId = "888888888888888888";

  beforeEach(async () => {
    const team = await createTestTeam();
    teamId = team.id;

    const user = await createTestUser(teamId, { discordId });
    userId = user.id;
  });

  afterEach(async () => {
    if (teamId) {
      await deleteTestTeam(teamId);
    }

    teamId = "";
    userId = "";
  });

  it("creates a task scoped to the user's team", async () => {
    const interaction = createModalSubmitInteractionStub({
      userId: discordId,
      customId: "create-task:Software:High",
      fields: {
        "task-title": "Integration task",
        "task-description": "Created from integration test",
        "task-due-date": "",
      },
    });

    await createTaskCommand.modalSubmit?.(interaction as never);

    expect(interaction.deferReply).toHaveBeenCalled();
    expect(interaction.editReply).toHaveBeenCalled();

    const task = await prisma.task.findFirst({
      where: { teamId, createdBy: userId },
    });

    expect(task).toMatchObject({
      title: "Integration task",
      type: "Software",
      priority: "High",
      teamId,
      createdBy: userId,
    });
  });
});
