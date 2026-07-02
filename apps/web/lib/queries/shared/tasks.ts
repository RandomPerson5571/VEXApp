import { queryOptions } from "@tanstack/react-query";
import type { DashboardTask, TaskListTask } from "@stlvex/database/types";

import { queryKeys } from "@/lib/query-client";

export function createTeamTasksQueryOptions(
  teamId: string,
  queryFn: () => Promise<TaskListTask[]>,
) {
  return queryOptions({
    queryKey: queryKeys.tasks.forTeam(teamId),
    queryFn,
  });
}

export function createDashboardTasksQueryOptions(
  teamId: string,
  limit: number,
  queryFn: () => Promise<DashboardTask[]>,
) {
  return queryOptions({
    queryKey: queryKeys.dashboard.tasks(teamId, limit),
    queryFn,
  });
}
