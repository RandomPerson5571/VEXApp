import { findUserByDiscordId, prisma } from "@stlvex/database";
import { ChannelType, SlashCommandBuilder, channelMention, inlineCode } from "discord.js";
import type { SlashCommand } from "../../types.js";
import {
  autocompleteTeamOption,
  isPlatformAdmin,
  resolveTargetTeam,
} from "../../utils/team-options.js";

const setAnnouncementsChannel: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("set-announcements-channel")
    .setDescription("Set the announcements channel for a team")
    .addStringOption((option) =>
      option
        .setName("team")
        .setDescription("Team to set the announcements channel for")
        .setRequired(true)
        .setAutocomplete(true),
    )
    .addChannelOption((option) =>
      option
        .setName("channel")
        .setDescription("The announcements channel")
        .setRequired(true)
        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement),
    ),
  autocomplete: autocompleteTeamOption,
  async execute(interaction) {
    if (!interaction.inGuild()) {
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
        content: "❌ Only admins can set a team's announcements channel.",
      });
      return;
    }

    const teamIdInput = interaction.options.getString("team");
    const channel = interaction.options.getChannel("channel", true);

    const targetTeam = await resolveTargetTeam(dbUser, teamIdInput, {
      adminRequiredMessage: "❌ Admins must select a team.",
      leaderScopeMessage: "❌ Only admins can set a team's announcements channel.",
    });

    if (!targetTeam.ok) {
      await interaction.editReply({ content: targetTeam.message });
      return;
    }

    try {
      const updatedTeam = await prisma.team.update({
        where: { id: targetTeam.teamId },
        data: { annoucementsChannelId: channel.id },
      });

      await interaction.editReply({
        content: `✅ Announcements channel for team ${inlineCode(updatedTeam.number)} set to ${channelMention(channel.id)}.`,
      });
    } catch {
      await interaction.editReply({
        content: "❌ Could not update that team. It may not exist.",
      });
    }
  },
};

export default setAnnouncementsChannel;
