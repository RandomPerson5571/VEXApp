import "server-only";

import { prisma } from "@stlvex/database";

import { listInventoryForTeam } from "@/lib/data/inventory";
import { getAvailableStock } from "@/lib/inventory/inventory-utils";
import { MOCK_TEAM_RANK } from "@/lib/mock/dashboard-rank";
import { toCalendarEvent } from "@/lib/mappers/events";
import type { DashboardSummaryStats } from "@/lib/types/team";

export async function getDashboardSummary(
  teamId: string,
): Promise<DashboardSummaryStats> {
  const [incompleteTasks, completedTasks, nextEvent, inventory] =
    await Promise.all([
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
      prisma.event.findFirst({
        where: {
          startDate: { gte: new Date() },
          teams: { some: { id: teamId } },
        },
        orderBy: { startDate: "asc" },
      }),
      listInventoryForTeam(teamId),
    ]);

  const inventoryWarning = inventory.some(
    (item) => getAvailableStock(item) <= 0,
  );

  const nextEventCal = nextEvent ? toCalendarEvent(nextEvent) : null;

  return {
    incompleteTasks,
    completedTasks,
    nextEvent: nextEventCal?.title ?? "No upcoming events",
    nextEventDate: nextEventCal
      ? `${nextEventCal.date} at ${nextEventCal.startTime}`
      : "—",
    inventoryItems: inventory.length,
    inventoryWarning,
    ...MOCK_TEAM_RANK,
  };
}
