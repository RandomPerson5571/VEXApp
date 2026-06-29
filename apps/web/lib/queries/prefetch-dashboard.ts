import type { QueryClient } from "@tanstack/react-query";

import { prefetchDashboardSummary } from "@/lib/queries/prefetch-dashboard-summary";
import { prefetchTeamEvents } from "@/lib/queries/prefetch-team-events";
import { prefetchTeamInventory } from "@/lib/queries/prefetch-team-inventory";
import { prefetchTeamTasks } from "@/lib/queries/prefetch-team-tasks";

export async function prefetchDashboard(
  queryClient: QueryClient,
  teamId: string,
) {
  await Promise.all([
    prefetchTeamEvents(queryClient, teamId),
    prefetchTeamTasks(queryClient, teamId),
    prefetchTeamInventory(queryClient, teamId),
    prefetchDashboardSummary(queryClient, teamId),
  ]);
}
