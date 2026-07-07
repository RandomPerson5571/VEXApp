import { prisma } from "@stlvex/database";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  createTestTeam,
  createTestUser,
  deleteTestTeam,
  hasTestDatabase,
} from "../../helpers/test-database.js";
import { createChatInputInteractionStub } from "../../helpers/discord-fixtures.js";
import eventsCommand from "../../../src/commands/events/events.js";

const describeIntegration = hasTestDatabase() ? describe : describe.skip;

describeIntegration("events command integration", () => {
  let teamAId = "";
  let teamBId = "";
  const userDiscordId = "171717171717171717";

  beforeEach(async () => {
    const teamA = await createTestTeam();
    const teamB = await createTestTeam();
    teamAId = teamA.id;
    teamBId = teamB.id;

    await createTestUser(teamAId, { discordId: userDiscordId });

    await prisma.event.create({
      data: {
        name: "Team A practice",
        location: "Lab",
        type: "WORK_SESSION",
        startDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 25 * 60 * 60 * 1000),
        teams: { connect: [{ id: teamAId }] },
      },
    });

    await prisma.event.create({
      data: {
        name: "Team B tournament",
        location: "Arena",
        type: "TOURNAMENT",
        startDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 26 * 60 * 60 * 1000),
        teams: { connect: [{ id: teamBId }] },
      },
    });
  });

  afterEach(async () => {
    if (teamAId) await deleteTestTeam(teamAId);
    if (teamBId) await deleteTestTeam(teamBId);

    teamAId = "";
    teamBId = "";
  });

  it("scopes events to the user's team", async () => {
    const interaction = createChatInputInteractionStub({
      userId: userDiscordId,
    });
    interaction.options.getString = () => "week";

    await eventsCommand.execute(interaction as never);

    const payload = interaction.editReply.mock.calls[0]?.[0] as {
      embeds: Array<{ toJSON: () => { fields?: Array<{ name: string }> } }>;
    };
    const fields = payload.embeds[0]?.toJSON().fields ?? [];

    expect(fields.some((field) => field.name.includes("Team A practice"))).toBe(true);
    expect(fields.some((field) => field.name.includes("Team B tournament"))).toBe(false);
  });
});
