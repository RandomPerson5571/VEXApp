import { kickUser } from "@stlvex/database";
import { SlashCommandBuilder } from "discord.js";

import type { SlashCommand } from "../../types.js";
import {
  formatModerationError,
  resolveActor,
  resolveTargetFromUserOption,
} from "../../utils/moderation-resolve.js";

const kickMemberCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("kick-member")
    .setDescription("Remove a member from their team (app kick, not Discord)")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("Discord user to kick from the team")
        .setRequired(true),
    )
    .addStringOption((option) =>
      option.setName("reason").setDescription("Optional reason"),
    ),
  async execute(interaction) {
    const actor = await resolveActor(interaction);
    if (!actor) return;

    await interaction.deferReply({ ephemeral: true });

    const target = await resolveTargetFromUserOption(interaction);
    if (!target) return;

    try {
      await kickUser({
        actorId: actor.id,
        targetUserId: target.dbUser.id,
        reason: interaction.options.getString("reason"),
      });
      await interaction.editReply({
        content: `✅ Kicked **${target.discordUser.tag}** from their team.`,
      });
    } catch (error) {
      await interaction.editReply({ content: formatModerationError(error) });
    }
  },
};

export default kickMemberCommand;
