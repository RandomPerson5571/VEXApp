import type { QueryClient } from "@tanstack/react-query";

import { prefetchDashboardSummary } from "@/lib/queries/prefetch-dashboard-summary";
import { prefetchDashboardTasks } from "@/lib/queries/prefetch-dashboard-tasks";
import { prefetchTeamEvents } from "@/lib/queries/prefetch-team-events";
import { prefetchTeamInventory } from "@/lib/queries/prefetch-team-inventory";

export async function prefetchDashboard(
  queryClient: QueryClient,
  teamId: string,
) {
  await Promise.all([
    prefetchTeamEvents(queryClient, teamId),
    prefetchDashboardTasks(queryClient, teamId),
    prefetchTeamInventory(queryClient, teamId),
    prefetchDashboardSummary(queryClient, teamId),
  ]);
}
