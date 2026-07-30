import { findUserByDiscordId, prisma } from "@stlvex/database";
import { ChannelType, SlashCommandBuilder, channelMention } from "discord.js";
import type { SlashCommand } from "../../types.js";
import { isPlatformAdmin } from "../../utils/team-options.js";

const setAdminLogsChannel: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("set-admin-logs-channel")
    .setDescription("Set this server's private admin-logs channel for security alerts")
    .addChannelOption((option) =>
      option
        .setName("channel")
        .setDescription("Admin logs channel for this server")
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
        content: "❌ Only admins can set the admin-logs channel.",
      });
      return;
    }

    const channel = interaction.options.getChannel("channel", true);

    try {
      await prisma.discordGuildSettings.upsert({
        where: { guildId: interaction.guildId },
        create: {
          guildId: interaction.guildId,
          adminLogsChannelId: channel.id,
        },
        update: { adminLogsChannelId: channel.id },
      });

      await interaction.editReply({
        content: `✅ Admin-logs channel for this server set to ${channelMention(channel.id)}.`,
      });
    } catch {
      await interaction.editReply({
        content: "❌ Could not save the admin-logs channel.",
      });
    }
  },
};

export default setAdminLogsChannel;
