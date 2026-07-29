import { findUserByDiscordId, prisma } from "@stlvex/database";
import { SlashCommandBuilder, inlineCode, roleMention } from "discord.js";
import type { SlashCommand } from "../../types.js";
import {
  autocompleteTeamOption,
  isPlatformAdmin,
  resolveTargetTeam,
} from "../../utils/team-options.js";

const setPurchasingManagerRole: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("set-purchasing-manager-role")
    .setDescription("Discord role to ping on low-stock / security alerts")
    .addStringOption((option) =>
      option
        .setName("team")
        .setDescription("Team to configure")
        .setRequired(true)
        .setAutocomplete(true),
    )
    .addRoleOption((option) =>
      option
        .setName("role")
        .setDescription("Purchasing manager (or admin) role")
        .setRequired(true),
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
        content: "❌ Only admins can set the purchasing manager role.",
      });
      return;
    }

    const teamIdInput = interaction.options.getString("team");
    const role = interaction.options.getRole("role", true);

    const targetTeam = await resolveTargetTeam(dbUser, teamIdInput, {
      adminRequiredMessage: "❌ Admins must select a team.",
      leaderScopeMessage: "❌ Only admins can set the purchasing manager role.",
    });

    if (!targetTeam.ok) {
      await interaction.editReply({ content: targetTeam.message });
      return;
    }

    try {
      const updatedTeam = await prisma.team.update({
        where: { id: targetTeam.teamId },
        data: { purchasingManagerRoleId: role.id },
      });

      await interaction.editReply({
        content: `✅ Purchasing manager role for team ${inlineCode(updatedTeam.number)} set to ${roleMention(role.id)}.`,
      });
    } catch {
      await interaction.editReply({
        content: "❌ Could not update that team. It may not exist.",
      });
    }
  },
};

export default setPurchasingManagerRole;
