import "server-only";

import { listTeamMembersForTeam } from "@/lib/data/team-members";
import { createTeamMembersQueryOptions } from "@/lib/queries/shared/team-members";
import type { TaskListAssignee } from "@stlvex/database/types";

export async function getTeamMembers(
  teamId: string,
): Promise<TaskListAssignee[]> {
  return listTeamMembersForTeam(teamId);
}

export function teamMembersQueryOptions(teamId: string) {
  return createTeamMembersQueryOptions(teamId, () => getTeamMembers(teamId));
}
