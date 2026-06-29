import "server-only";

import { getDashboardSummary } from "@/lib/data/dashboard-summary";
import { queryKeys } from "@/lib/query-client";
import type { DashboardSummaryStats } from "@/lib/types/team";

export async function getTeamDashboardSummary(
  teamId: string,
): Promise<DashboardSummaryStats> {
  return getDashboardSummary(teamId);
}

export function dashboardSummaryQueryOptions(teamId: string) {
  return {
    queryKey: queryKeys.dashboard.summary(teamId),
    queryFn: () => getTeamDashboardSummary(teamId),
  };
}
