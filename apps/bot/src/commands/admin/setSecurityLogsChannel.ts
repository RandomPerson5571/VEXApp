import { findUserByDiscordId, prisma } from "@stlvex/database";
import { ChannelType, SlashCommandBuilder, channelMention } from "discord.js";
import type { SlashCommand } from "../../types.js";
import { isPlatformAdmin } from "../../utils/team-options.js";

function createSetLogsChannelCommand(
  name: string,
  description: string,
  field:
    | "securityLogsChannelId"
    | "infoLogsChannelId"
    | "inventoryLogsChannelId",
  label: string,
): SlashCommand {
  return {
    data: new SlashCommandBuilder()
      .setName(name)
      .setDescription(description)
      .addChannelOption((option) =>
        option
          .setName("channel")
          .setDescription(`The ${label} channel for this server`)
          .setRequired(true)
          .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement),
      ),
    async execute(interaction) {
      if (!interaction.inGuild() || !interaction.guildId) {
        await interaction.reply({
          content: "This command can only be used in a server.",
          ephemeral: true,
        });
        return;
      }

      await interaction.deferReply({ ephemeral: true });

      const dbUser = await findUserByDiscordId(interaction.user.id);

      if (!dbUser) {
        await interaction.editReply({
          content: "❌ No matching account was found. Link your Discord account first.",
        });
        return;
      }

      if (!isPlatformAdmin(dbUser)) {
        await interaction.editReply({
          content: "❌ Only admins can set log channels.",
        });
        return;
      }

      const channel = interaction.options.getChannel("channel", true);

      try {
        await prisma.discordGuildSettings.upsert({
          where: { guildId: interaction.guildId },
          create: {
            guildId: interaction.guildId,
            [field]: channel.id,
          },
          update: { [field]: channel.id },
        });

        await interaction.editReply({
          content: `✅ ${label} channel for this server set to ${channelMention(channel.id)}.`,
        });
      } catch {
        await interaction.editReply({
          content: `❌ Could not save the ${label} channel.`,
        });
      }
    },
  };
}

export default createSetLogsChannelCommand(
  "set-security-logs-channel",
  "Set this server's security logs channel (moderation, errors, warnings)",
  "securityLogsChannelId",
  "Security logs",
);
