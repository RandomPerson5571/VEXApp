import "server-only";

import { listTeamMembersForTeam } from "@/lib/data/team-members";
import { queryKeys } from "@/lib/query-client";
import type { TaskListAssignee } from "@stlvex/database/types";

export async function getTeamMembers(
  teamId: string,
): Promise<TaskListAssignee[]> {
  return listTeamMembersForTeam(teamId);
}

export function teamMembersQueryOptions(teamId: string) {
  return {
    queryKey: queryKeys.teams.members(teamId),
    queryFn: () => getTeamMembers(teamId),
  };
}
