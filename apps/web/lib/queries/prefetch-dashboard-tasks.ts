import type { QueryClient } from "@tanstack/react-query";

import { dashboardTasksQueryOptions } from "@/lib/queries/tasks.server";

export async function prefetchDashboardTasks(
  queryClient: QueryClient,
  teamId: string,
) {
  await queryClient.prefetchQuery(dashboardTasksQueryOptions(teamId));
}
