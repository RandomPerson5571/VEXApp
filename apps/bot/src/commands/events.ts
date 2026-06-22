import { prisma, type Prisma } from "@stlvex/database";
import { SlashCommandBuilder, EmbedBuilder, inlineCode, time, bold } from "discord.js";
import type { SlashCommand } from "../types.js";

export const data = new SlashCommandBuilder()
  .setName("events")
  .setDescription("Fetches and displays upcoming events from the database")
  .addStringOption((option) =>
    option
      .setName("range")
      .setDescription("The range of events to fetch (defaults to week)")
      .setRequired(false)
      .addChoices(
        { name: "Week", value: "week" },
        { name: "Month", value: "month" },
        { name: "All", value: "all" }
      )
  );

const eventsCommand: SlashCommand = {
  data: data,
  async execute(interaction) {
    if (!interaction.inGuild() || !interaction.guild) {
      await interaction.reply({
        content: "This command can only be used in a server.",
        ephemeral: true,
      });
      return;
    }

    // Defer reply immediately so slow database lookups don't crash the command
    await interaction.deferReply({ ephemeral: true });

    const range = interaction.options.getString("range") || "week";
    const discordId = interaction.user.id;

    // Fetch user and their team assignment
    const dbUser = await prisma.user.findUnique({
      where: { discordId },
      include: { team: true },
    });

    if (!dbUser) {
      await interaction.editReply({
        content: "❌ No matching account was found. Ask a team lead/admin to link your Discord ID first.",
      });
      return;
    }

    if (!dbUser.teamId || !dbUser.team) {
      await interaction.editReply({
        content: "⚠️ Your account is missing a team assignment in the database.",
      });
      return;
    }

    // Set up date filtering
    const now = new Date();
    const dateFilter: { gte: Date; lte?: Date } = { gte: now };

    if (range === "week") {
      dateFilter.lte = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    } else if (range === "month") {
      dateFilter.lte = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    } // "all" ignores the lte bound completely

    // Fetch the scheduled events via the join relation
    const events = await prisma.event.findMany({
      where: {
        teams: {
          some: {
            id: dbUser.teamId,
          },
        },
        date: dateFilter,
      },
      orderBy: { startDate: "asc" },
    });

    // Structure a pretty visual Embed response
    const embed = new EmbedBuilder()
      .setColor(0x5865F2) // Discord Blurple
      .setTitle(`📅 Upcoming Events — Team ${dbUser.team.number}`)
      .setDescription(`Displaying scheduled items filtered by: ${inlineCode(range.toUpperCase())}`)
      .setTimestamp();

    if (events.length === 0) {
      embed.setDescription(`📅 No upcoming events found for ${inlineCode(range.toUpperCase())}. You're all clear!`);
      
      await interaction.editReply({ embeds: [embed] });
      return;
    }

    // Map your events into clean list blocks
    events.forEach((event, index) => {
      // Safely turn Date objects into native Discord timestamp strings
      const eventStart = event.startDate ? time(new Date(event.startDate), "F") : "TBD";
      const relativeTime = event.startDate ? time(new Date(event.startDate), "R") : "";

      embed.addFields({
        name: `${index + 1}. 📌 ${event.name || "Untitled Event"}`,
        value: `${bold("When:")} ${eventStart} (${relativeTime})\n${bold("Description:")} ${event.description || "*No description provided.*"}\n\u200b`
      });
    });

    await interaction.editReply({
      embeds: [embed],
    });
  },
};

export default eventsCommand;