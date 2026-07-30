import { suppressUser } from "@stlvex/database";
import { SlashCommandBuilder } from "discord.js";

import type { SlashCommand } from "../../types.js";
import {
  formatModerationError,
  resolveActor,
  resolveTargetFromUserOption,
} from "../../utils/moderation-resolve.js";
import { moderationTelemetrySideEffects } from "../../utils/moderation-telemetry.js";

const timeoutCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("timeout")
    .setDescription("Put a team member in read-only mode (app timeout)")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("Discord user to timeout")
        .setRequired(true),
    )
    .addIntegerOption((option) =>
      option
        .setName("hours")
        .setDescription("Duration in hours (default 24)")
        .setMinValue(1)
        .setMaxValue(720),
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

    const hours = interaction.options.getInteger("hours") ?? 24;
    const reason = interaction.options.getString("reason");
    const until = new Date(Date.now() + hours * 3_600_000);

    try {
      await suppressUser(
        {
          actorId: actor.id,
          targetUserId: target.dbUser.id,
          reason,
          until,
        },
        moderationTelemetrySideEffects(interaction.client),
      );
      await interaction.editReply({
        content: `✅ Timed out **${target.discordUser.tag}** for ${hours}h.`,
      });
    } catch (error) {
      await interaction.editReply({ content: formatModerationError(error) });
    }
  },
};

export default timeoutCommand;
