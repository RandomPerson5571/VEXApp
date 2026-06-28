import { prisma, type Prisma } from "@stlvex/database";
import { SlashCommandBuilder, EmbedBuilder, inlineCode, userMention, roleMention } from "discord.js";
import type { SlashCommand } from "../../types.js";

export const data = new SlashCommandBuilder()
  .setName("team")
  .setDescription("Get information about your or the user of your choice's team from the database")
  .addUserOption((option) =>
    option
      .setName("user")
      .setDescription("The user to get team information for (defaults to yourself)")
      .setRequired(false)
  );

const verify: SlashCommand = {
  data: data,
  async execute(interaction) {
    if (!interaction.inGuild() || !interaction.guild) {
      await interaction.reply({
        content: "This command can only be used in a server.",
        ephemeral: true,
      });
      return;
    }

    // Acknowledge the interaction immediately to prevent timeouts if DB is slow
    await interaction.deferReply({ ephemeral: true });

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

    if (!dbUser.team) {
      await interaction.editReply({
        content: `⚠️ The account for ${targetUser} is missing a team assignment in the database.`,
      });
      return;
    }

    // Fetch all members on this specific team
    const teamMembers = await prisma.user.findMany({
      where: { teamId: dbUser.teamId },
    });

    // Format the list of team members into dynamic mentions or standard names
    const formattedRoster = teamMembers.map((member) => {
      return member.discordId ? userMention(member.discordId) : `• ${member.firstName + " " + member.lastName + " (Unverified)" || "Unknown User"}`;
    }).join("\n") || "*No members assigned*";

    // Build a pretty rich embed layout
    const teamEmbed = new EmbedBuilder()
      .setColor(0x5865F2) // Discord Blurple color
      .setTitle(`🧱 Team Information: ${dbUser.team.name}`)
      .setDescription(`Here is the database profile breakdown requested for ${targetUser}.`)
      .setThumbnail(targetUser.displayAvatarURL())
      .addFields(
        { 
          name: "🔢 Team Number", 
          value: inlineCode(dbUser.team.number.toString()), 
          inline: true 
        },
        { 
          name: "🎭 Discord Role", 
          value: dbUser.team.discordRoleId ? roleMention(dbUser.team.discordRoleId) : inlineCode("Not Set"), 
          inline: true 
        },
        { 
          name: `👥 Roster (${teamMembers.length})`, 
          value: formattedRoster 
        }
      )
      .setFooter({ text: "Database Sync Profile" })
      .setTimestamp();

    await interaction.editReply({
      content: "", // Clear out empty message data
      embeds: [teamEmbed],
    });
  },
};

export default verify;