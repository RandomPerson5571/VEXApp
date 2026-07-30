import { unbanUser } from "@stlvex/database";
import { SlashCommandBuilder } from "discord.js";

import type { SlashCommand } from "../../types.js";
import {
  formatModerationError,
  resolveActor,
  resolveBanTarget,
} from "../../utils/moderation-resolve.js";
import { moderationTelemetrySideEffects } from "../../utils/moderation-telemetry.js";

const unbanCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("unban")
    .setDescription("Lift a platform ban")
    .addUserOption((option) =>
      option.setName("user").setDescription("Discord user currently in the server"),
    )
    .addStringOption((option) =>
      option
        .setName("user_id")
        .setDescription("Platform user UUID"),
    )
    .addStringOption((option) =>
      option
        .setName("discord_id")
        .setDescription("Raw Discord snowflake ID"),
    )
    .addStringOption((option) =>
      option.setName("reason").setDescription("Optional reason"),
    ),
  async execute(interaction) {
    const actor = await resolveActor(interaction);
    if (!actor) return;

    await interaction.deferReply({ ephemeral: true });

    const target = await resolveBanTarget(interaction);
    if (!target) return;

    try {
      await unbanUser(
        {
          actorId: actor.id,
          targetUserId: target.id,
          reason: interaction.options.getString("reason"),
        },
        moderationTelemetrySideEffects(interaction.client, interaction.guildId),
      );
      await interaction.editReply({
        content: `✅ Unbanned **${target.firstName} ${target.lastName}** (\`${target.id}\`).`,
      });
    } catch (error) {
      await interaction.editReply({ content: formatModerationError(error) });
    }
  },
};

export default unbanCommand;
