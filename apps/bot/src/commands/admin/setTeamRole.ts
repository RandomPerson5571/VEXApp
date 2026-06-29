import { prisma, type Prisma } from "@stlvex/database";
import { SlashCommandBuilder, EmbedBuilder, inlineCode, userMention, roleMention, MessageFlags } from "discord.js";
import type { SlashCommand } from "../../types.js";

import { autocompleteTeamOption } from "../../utils/team-options.js";

export const data = new SlashCommandBuilder()
  .setName("setTeamRole")
  .setDescription("Set the role for a team")
  .addStringOption((option) =>
    option
      .setName("team")
      .setDescription("The team to set the role for")
      .setRequired(true)
      .setAutocomplete(true),
  )
  .addRoleOption((option) =>
    option
      .setName("role")
      .setDescription("The role to set for the team")
      .setRequired(true)
  );

const setTeamRole: SlashCommand = {
  data: data,
  autocomplete: autocompleteTeamOption,
  async execute(interaction) {

    // Acknowledge the interaction immediately to prevent timeouts if DB is slow
    await interaction.deferReply();

    // Fallback to the command executor if no target user is supplied
    const targetUser = interaction.options.getUser("user") || interaction.user;

    // Fetch target user and their team data
    const dbUser = await prisma.user.findUnique({
      where: { discordId: targetUser.id },
      include: { team: true },
    });

    if (!dbUser) {
      await interaction.editReply({
        content: `❌ No matching account was found for ${targetUser}. Please link your discord account first.`,
      });
      return;
    }

    const role = interaction.options.getRole("role");
    if (!role) {
      await interaction.editReply({
        content: `❌ No role was provided.`,
      });
      return;
    }

    const team = interaction.options.getString("team");
    if (!team) {
      await interaction.editReply({
        content: `❌ No team was provided.`,
      });
      return;
    }

    const updatedTeam = await prisma.team.update({
      where: { id: team },
      data: {
        discordRoleId: role.id,
      },
    });

    await interaction.editReply({
      content: `✅ Role set for team ${inlineCode(updatedTeam.number)} to ${roleMention(role.id)}`,
    });
  },
};

export default setTeamRole;