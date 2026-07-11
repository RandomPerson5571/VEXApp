import { findUserByDiscordId, prisma } from "@stlvex/database";
import { SlashCommandBuilder, inlineCode } from "discord.js";
import type { SlashCommand } from "../../types.js";
import {
  autocompleteTeamOption,
  isPlatformAdmin,
  resolveTargetTeam,
} from "../../utils/team-options.js";

const setTeamServer: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("set-team-server")
    .setDescription("Link a team to this Discord server")
    .addStringOption((option) =>
      option
        .setName("team")
        .setDescription("Team to link to this server")
        .setRequired(true)
        .setAutocomplete(true),
    ),
  autocomplete: autocompleteTeamOption,
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
        content: "❌ Only admins can set a team's Discord server.",
      });
      return;
    }

    const teamIdInput = interaction.options.getString("team");

    const targetTeam = await resolveTargetTeam(dbUser, teamIdInput, {
      adminRequiredMessage: "❌ Admins must select a team.",
      leaderScopeMessage: "❌ Only admins can set a team's Discord server.",
    });

    if (!targetTeam.ok) {
      await interaction.editReply({ content: targetTeam.message });
      return;
    }

    try {
      const updatedTeam = await prisma.team.update({
        where: { id: targetTeam.teamId },
        data: { discordServerId: interaction.guildId },
      });

      await interaction.editReply({
        content: `✅ Team ${inlineCode(updatedTeam.number)} linked to this server.`,
      });
    } catch {
      await interaction.editReply({
        content:
          "❌ Could not update that team. Another team may already be linked to this server.",
      });
    }
  },
};

export default setTeamServer;
