import { queryOptions } from "@tanstack/react-query";
import type { TaskListAssignee } from "@stlvex/database/types";

import { queryKeys } from "@/lib/query-client";

export function createTeamMembersQueryOptions(
  teamId: string,
  queryFn: () => Promise<TaskListAssignee[]>,
) {
  return queryOptions({
    queryKey: queryKeys.teams.members(teamId),
    queryFn,
    placeholderData: (previousData) => previousData,
  });
}
