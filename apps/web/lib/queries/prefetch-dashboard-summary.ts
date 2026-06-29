import type { QueryClient } from "@tanstack/react-query";

import { dashboardSummaryQueryOptions } from "@/lib/queries/dashboard-summary.server";

export async function prefetchDashboardSummary(
  queryClient: QueryClient,
  teamId: string,
) {
  await queryClient.prefetchQuery(dashboardSummaryQueryOptions(teamId));
}
