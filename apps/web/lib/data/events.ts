import "server-only";

import { prisma } from "@stlvex/database";
import type { Event } from "@stlvex/database/types";

export async function listEventsForTeam(teamId: string): Promise<Event[]> {
  return prisma.event.findMany({
    where: {
      teams: {
        some: { id: teamId },
      },
    },
    orderBy: { startDate: "asc" },
  });
}
