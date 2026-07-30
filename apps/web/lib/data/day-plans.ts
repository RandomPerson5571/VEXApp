import "server-only";

import { prisma } from "@stlvex/database";
import type { DayPlanType } from "@stlvex/database/types";

import { logTelemetry } from "@/lib/telemetry/dispatch";
import {
  formatTelemetryDateTime,
  telemetryFields,
} from "@/lib/telemetry/detail";
import {
  dayPlanCreatedMessage,
  dayPlanDeletedMessage,
  dayPlanUpdatedMessage,
} from "@/lib/telemetry/messages";

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
  const dateKey = input.date.trim();

  const existing = await prisma.teamDayPlan.findUnique({
    where: {
      teamId_date: {
        teamId: input.teamId,
        date,
      },
    },
    select: { id: true },
  });

  const plan = await prisma.teamDayPlan.upsert({
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

  logTelemetry({
    category: "info",
    teamId: input.teamId,
    message: existing
      ? dayPlanUpdatedMessage(dateKey, input.type)
      : dayPlanCreatedMessage(dateKey, input.type),
    action: existing ? "day_plan.updated" : "day_plan.created",
    entityType: "day_plan",
    entityId: plan.id,
    actorId: input.createdBy,
    occurredAt: plan.updatedAt,
    fields: telemetryFields({
      Date: dateKey,
      Type: input.type,
      "Plan ID": plan.id,
    }),
  });

  return plan;
}

export async function deleteDayPlan(
  teamId: string,
  date: string,
  actorId?: string,
) {
  const parsed = parseDateOnly(date);
  const existing = await prisma.teamDayPlan.findUnique({
    where: {
      teamId_date: { teamId, date: parsed },
    },
    select: { id: true },
  });

  if (!existing) {
    return;
  }

  await prisma.teamDayPlan.deleteMany({
    where: {
      teamId,
      date: parsed,
    },
  });

  logTelemetry({
    category: "info",
    teamId,
    message: dayPlanDeletedMessage(date.trim()),
    action: "day_plan.deleted",
    entityType: "day_plan",
    entityId: existing.id,
    actorId,
    occurredAt: new Date(),
    fields: telemetryFields({
      Date: date.trim(),
      "Plan ID": existing.id,
    }),
  });
}
