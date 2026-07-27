import { prisma } from "@stlvex/database";
import type { DayPlanType } from "@stlvex/database/types";
import { EmbedBuilder, SlashCommandBuilder, bold } from "discord.js";
import type { SlashCommand } from "../../types.js";
import {
  authorizeTeamMember,
  todayUtcDate,
  todayUtcDateString,
} from "../../utils/authorize-team-member.js";

const PLAN_LABELS: Record<DayPlanType, string> = {
  BUILD: "Build day",
  CODING: "Coding day",
  TESTING: "Testing day",
};

const PLAN_COLORS: Record<DayPlanType, number> = {
  BUILD: 0xed4245,
  CODING: 0x5865f2,
  TESTING: 0x57f287,
};

const dayPlanCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("day-plan")
    .setDescription("See today's day plan for your team"),
  async execute(interaction) {
    const dbUser = await authorizeTeamMember(interaction);
    if (!dbUser) return;

    await interaction.deferReply({ ephemeral: true });

    const date = todayUtcDate();
    const plan = await prisma.teamDayPlan.findUnique({
      where: {
        teamId_date: {
          teamId: dbUser.teamId,
          date,
        },
      },
      select: { type: true },
    });

    if (!plan) {
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(0x99aab5)
            .setTitle(`Day plan — ${todayUtcDateString()}`)
            .setDescription(
              `No day plan set for team ${bold(dbUser.team.number)} today. Set one on the calendar in the web app.`,
            )
            .setTimestamp(),
        ],
      });
      return;
    }

    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(PLAN_COLORS[plan.type])
          .setTitle(`Day plan — ${todayUtcDateString()}`)
          .setDescription(
            [
              `Team ${bold(dbUser.team.number)}`,
              `**Focus:** ${PLAN_LABELS[plan.type]}`,
            ].join("\n"),
          )
          .setTimestamp(),
      ],
    });
  },
};

export default dayPlanCommand;
