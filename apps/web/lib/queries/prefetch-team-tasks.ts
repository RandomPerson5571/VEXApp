import type { QueryClient } from "@tanstack/react-query";

import { teamTasksQueryOptions } from "@/lib/queries/tasks.server";

export async function prefetchTeamTasks(
  queryClient: QueryClient,
  teamId: string,
) {
  await queryClient.prefetchQuery(teamTasksQueryOptions(teamId));
}
