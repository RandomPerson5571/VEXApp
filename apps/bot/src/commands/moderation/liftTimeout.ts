import { unsuppressUser } from "@stlvex/database";
import { SlashCommandBuilder } from "discord.js";

import type { SlashCommand } from "../../types.js";
import {
  formatModerationError,
  resolveActor,
  resolveTargetFromUserOption,
} from "../../utils/moderation-resolve.js";

const liftTimeoutCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("lift-timeout")
    .setDescription("Lift an app read-only timeout")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("Discord user to unsuppress")
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
      await unsuppressUser({
        actorId: actor.id,
        targetUserId: target.dbUser.id,
        reason: interaction.options.getString("reason"),
      });
      await interaction.editReply({
        content: `✅ Lifted timeout for **${target.discordUser.tag}**.`,
      });
    } catch (error) {
      await interaction.editReply({ content: formatModerationError(error) });
    }
  },
};

export default liftTimeoutCommand;
