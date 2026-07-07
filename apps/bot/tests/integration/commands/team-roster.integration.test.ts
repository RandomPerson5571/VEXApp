import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  createTestTeam,
  createTestUser,
  deleteTestTeam,
  hasTestDatabase,
} from "../../helpers/test-database.js";
import { createChatInputInteractionStub } from "../../helpers/discord-fixtures.js";
import teamCommand from "../../../src/commands/teams/team.js";

const describeIntegration = hasTestDatabase() ? describe : describe.skip;

describeIntegration("team roster integration", () => {
  let teamId = "";
  const viewerDiscordId = "151515151515151515";

  beforeEach(async () => {
    const team = await createTestTeam();
    teamId = team.id;

    await createTestUser(teamId, {
      discordId: viewerDiscordId,
      firstName: "Viewer",
      lastName: "One",
    });
    await createTestUser(teamId, {
      discordId: "161616161616161616",
      firstName: "Member",
      lastName: "Two",
    });
  });

  afterEach(async () => {
    if (teamId) {
      await deleteTestTeam(teamId);
    }

    teamId = "";
  });

  it("embed roster matches database members", async () => {
    const interaction = createChatInputInteractionStub({
      userId: viewerDiscordId,
    });

    await teamCommand.execute(interaction as never);

    const payload = interaction.editReply.mock.calls[0]?.[0] as {
      embeds: Array<{ toJSON: () => { fields?: Array<{ name: string; value: string }> } }>;
    };
    const rosterField = payload.embeds[0]?.toJSON().fields?.find((field) =>
      field.name.startsWith("👥 Roster"),
    );

    expect(rosterField?.value).toContain("<@161616161616161616>");
    expect(rosterField?.value).toContain("<@151515151515151515>");
  });
});
