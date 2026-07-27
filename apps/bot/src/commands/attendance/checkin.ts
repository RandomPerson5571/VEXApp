import { prisma } from "@stlvex/database";
import { EmbedBuilder, SlashCommandBuilder, bold, time } from "discord.js";
import type { SlashCommand } from "../../types.js";
import {
  authorizeTeamMember,
  todayUtcDate,
  todayUtcDateString,
} from "../../utils/authorize-team-member.js";

const checkinCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("checkin")
    .setDescription("Check in for today's meeting / work session"),
  async execute(interaction) {
    const dbUser = await authorizeTeamMember(interaction);
    if (!dbUser) return;

    await interaction.deferReply({ ephemeral: true });

    const date = todayUtcDate();
    const dayStart = date;
    const dayEnd = new Date(date.getTime() + 24 * 60 * 60 * 1000);

    const event = await prisma.event.findFirst({
      where: {
        teams: { some: { id: dbUser.teamId } },
        type: "CHECK_IN",
        startDate: { lt: dayEnd },
        endDate: { gt: dayStart },
      },
      orderBy: { startDate: "asc" },
      select: { id: true, name: true, startDate: true },
    });

    const existing = await prisma.attendanceCheckIn.findUnique({
      where: {
        teamId_userId_date: {
          teamId: dbUser.teamId,
          userId: dbUser.id,
          date,
        },
      },
    });

    if (existing) {
      const embed = new EmbedBuilder()
        .setColor(0xfee75c)
        .setTitle("Already checked in")
        .setDescription(
          `You're already checked in for ${bold(todayUtcDateString())} (team ${dbUser.team.number}).`,
        )
        .addFields({
          name: "Checked in",
          value: `${time(existing.checkedInAt, "f")} (${time(existing.checkedInAt, "R")})`,
        })
        .setTimestamp();

      if (event) {
        embed.addFields({ name: "Event", value: event.name });
      }

      await interaction.editReply({ embeds: [embed] });
      return;
    }

    const checkIn = await prisma.attendanceCheckIn.create({
      data: {
        teamId: dbUser.teamId,
        userId: dbUser.id,
        eventId: event?.id,
        date,
      },
    });

    const count = await prisma.attendanceCheckIn.count({
      where: { teamId: dbUser.teamId, date },
    });

    const embed = new EmbedBuilder()
      .setColor(0x57f287)
      .setTitle("✅ Checked in")
      .setDescription(
        `Checked in for ${bold(todayUtcDateString())} — team ${dbUser.team.number}.`,
      )
      .addFields(
        {
          name: "Time",
          value: `${time(checkIn.checkedInAt, "f")} (${time(checkIn.checkedInAt, "R")})`,
        },
        {
          name: "Team total today",
          value: `${count} check-in${count === 1 ? "" : "s"}`,
        },
      )
      .setTimestamp();

    if (event) {
      embed.addFields({ name: "Linked event", value: event.name });
    }

    await interaction.editReply({ embeds: [embed] });
  },
};

export default checkinCommand;
