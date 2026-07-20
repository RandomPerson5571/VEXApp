import "server-only";

import { prisma } from "@stlvex/database";

import { toCalendarEvent } from "@/lib/mappers/events";
import type { DashboardSummaryStats } from "@/lib/types/team";

function isInventoryDepleted(
  totalStock: number,
  signOuts: { quantity: number }[],
): boolean {
  const checkedOut = signOuts.reduce((sum, signOut) => sum + signOut.quantity, 0);
  return totalStock - checkedOut <= 0;
}

export async function getDashboardSummary(
  teamId: string,
): Promise<DashboardSummaryStats> {
  const now = new Date();

  const [taskStatusCounts, overdueTasks, nextEvent, inventoryRows] =
    await Promise.all([
      prisma.task.groupBy({
        by: ["status"],
        where: { teamId, parentTaskId: null },
        _count: { _all: true },
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
          startDate: { gte: now },
          teams: { some: { id: teamId } },
        },
        orderBy: { startDate: "asc" },
      }),
      prisma.inventoryItem.findMany({
        select: {
          totalStock: true,
          signOuts: {
            where: { returnedAt: null },
            select: { quantity: true },
          },
        },
      }),
    ]);

  const countByStatus = new Map(
    taskStatusCounts.map((row) => [row.status, row._count._all]),
  );
  const incompleteTasks =
    (countByStatus.get("NotStarted") ?? 0) +
    (countByStatus.get("InProgress") ?? 0);
  const completedTasks = countByStatus.get("Done") ?? 0;

  const inventoryItems = inventoryRows.length;
  const inventoryWarning = inventoryRows.some((item) =>
    isInventoryDepleted(item.totalStock, item.signOuts),
  );

  const nextEventCal = nextEvent ? toCalendarEvent(nextEvent) : null;

  return {
    incompleteTasks,
    completedTasks,
    overdueTasks,
    nextEvent: nextEventCal?.title ?? "No upcoming events",
    nextEventDate: nextEvent
      ? formatTimeUntil(nextEvent.startDate, now)
      : "—",
    inventoryItems,
    inventoryWarning,
  };
}

function formatTimeUntil(start: Date, now: Date): string {
  const ms = start.getTime() - now.getTime();
  if (ms <= 0) return "Starting now";

  const hourMs = 1000 * 60 * 60;
  const dayMs = hourMs * 24;
  const hours = Math.ceil(ms / hourMs);

  if (hours < 24) {
    return hours === 1 ? "in 1 hour" : `in ${hours} hours`;
  }

  const days = Math.ceil(ms / dayMs);
  return days === 1 ? "in 1 day" : `in ${days} days`;
}
