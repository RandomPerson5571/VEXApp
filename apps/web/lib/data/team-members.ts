import "server-only";

import { prisma } from "@stlvex/database";
import type { TaskListAssignee } from "@stlvex/database/types";

export async function listTeamMembersForTeam(
  teamId: string,
): Promise<TaskListAssignee[]> {
  return prisma.user.findMany({
    where: { teamId },
    select: { id: true, firstName: true, lastName: true },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });
}
