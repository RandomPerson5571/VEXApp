import "server-only";

import { prisma } from "@stlvex/database";
import type { DayPlanType } from "@stlvex/database/types";

export type UpsertDayPlanInput = {
  teamId: string;
  date: string;
  type: DayPlanType;
  createdBy: string;
};

function parseDateOnly(date: string): Date {
  return new Date(`${date.trim()}T00:00:00.000Z`);
}

export async function listDayPlansForTeam(teamId: string) {
  return prisma.teamDayPlan.findMany({
    where: { teamId },
    orderBy: { date: "asc" },
  });
}

export async function upsertDayPlan(input: UpsertDayPlanInput) {
  const date = parseDateOnly(input.date);

  return prisma.teamDayPlan.upsert({
    where: {
      teamId_date: {
        teamId: input.teamId,
        date,
      },
    },
    create: {
      teamId: input.teamId,
      date,
      type: input.type,
      createdBy: input.createdBy,
    },
    update: {
      type: input.type,
    },
  });
}

export async function deleteDayPlan(teamId: string, date: string) {
  await prisma.teamDayPlan.deleteMany({
    where: {
      teamId,
      date: parseDateOnly(date),
    },
  });
}
