import { banUser } from "@stlvex/database";
import { SlashCommandBuilder } from "discord.js";

import type { SlashCommand } from "../../types.js";
import {
  formatModerationError,
  resolveActor,
  resolveBanTarget,
} from "../../utils/moderation-resolve.js";
import { moderationTelemetrySideEffects } from "../../utils/moderation-telemetry.js";

// ponytail: bot bans set bannedAt only — web sessions die on next getCurrentUser;
// Supabase global signOut runs from the web ban path.

const banCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Platform-ban a user (blocks login until unbanned)")
    .addUserOption((option) =>
      option.setName("user").setDescription("Discord user currently in the server"),
    )
    .addStringOption((option) =>
      option
        .setName("user_id")
        .setDescription("Platform user UUID (if they left Discord)"),
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
      await banUser(
        {
          actorId: actor.id,
          targetUserId: target.id,
          reason: interaction.options.getString("reason"),
        },
        moderationTelemetrySideEffects(interaction.client, interaction.guildId),
      );
      await interaction.editReply({
        content: `✅ Banned **${target.firstName} ${target.lastName}** (\`${target.id}\`).`,
      });
    } catch (error) {
      await interaction.editReply({ content: formatModerationError(error) });
    }
  },
};

export default banCommand;
