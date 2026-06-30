import "server-only";

import { prisma } from "@stlvex/database";

import {
  countInventoryItems,
  hasDepletedInventory,
} from "@/lib/data/inventory";
import { MOCK_TEAM_RANK } from "@/lib/mock/dashboard-rank";
import { toCalendarEvent } from "@/lib/mappers/events";
import type { DashboardSummaryStats } from "@/lib/types/team";

export async function getDashboardSummary(
  teamId: string,
): Promise<DashboardSummaryStats> {
  const now = new Date();

  const [
    incompleteTasks,
    completedTasks,
    overdueTasks,
    nextEvent,
    inventoryItems,
    inventoryWarning,
  ] = await Promise.all([
    prisma.task.count({
      where: {
        teamId,
        parentTaskId: null,
        status: { in: ["NotStarted", "InProgress"] },
      },
    }),
    prisma.task.count({
      where: { teamId, parentTaskId: null, status: "Done" },
    }),
    prisma.task.count({
      where: {
        teamId,
        parentTaskId: null,
        status: { in: ["NotStarted", "InProgress"] },
        dueDate: { lt: now },
      },
    }),
    prisma.event.findFirst({
      where: {
        startDate: { gte: new Date() },
        teams: { some: { id: teamId } },
      },
      orderBy: { startDate: "asc" },
    }),
    countInventoryItems(),
    hasDepletedInventory(),
  ]);

  const nextEventCal = nextEvent ? toCalendarEvent(nextEvent) : null;

  return {
    incompleteTasks,
    completedTasks,
    overdueTasks,
    nextEvent: nextEventCal?.title ?? "No upcoming events",
    nextEventDate: nextEventCal
      ? `${nextEventCal.date} at ${nextEventCal.startTime}`
      : "—",
    inventoryItems,
    inventoryWarning,
    ...MOCK_TEAM_RANK,
  };
}
