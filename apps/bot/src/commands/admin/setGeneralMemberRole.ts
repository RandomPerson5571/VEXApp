import { findUserByDiscordId, prisma } from "@stlvex/database";
import { SlashCommandBuilder, roleMention } from "discord.js";
import type { SlashCommand } from "../../types.js";
import { isPlatformAdmin } from "../../utils/team-options.js";

const setGeneralMemberRole: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("set-general-member-role")
    .setDescription("Set the general member role given to verified users in this server")
    .addRoleOption((option) =>
      option
        .setName("role")
        .setDescription("Role assigned to verified members")
        .setRequired(true),
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
        content: "❌ Only admins can set the general member role.",
      });
      return;
    }

    const role = interaction.options.getRole("role", true);

    try {
      await prisma.discordGuildSettings.upsert({
        where: { guildId: interaction.guildId },
        create: {
          guildId: interaction.guildId,
          generalMemberRoleId: role.id,
        },
        update: { generalMemberRoleId: role.id },
      });

      await interaction.editReply({
        content: `✅ General member role set to ${roleMention(role.id)}.`,
      });
    } catch {
      await interaction.editReply({
        content: "❌ Could not save the general member role.",
      });
    }
  },
};

export default setGeneralMemberRole;
