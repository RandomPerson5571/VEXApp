import "server-only";

import { getDashboardSummary } from "@/lib/data/dashboard-summary";
import { createDashboardSummaryQueryOptions } from "@/lib/queries/shared/dashboard-summary";
import type { DashboardSummaryStats } from "@/lib/types/team";

export async function getTeamDashboardSummary(
  teamId: string,
): Promise<DashboardSummaryStats> {
  return getDashboardSummary(teamId);
}

export function dashboardSummaryQueryOptions(teamId: string) {
  return createDashboardSummaryQueryOptions(teamId, () =>
    getTeamDashboardSummary(teamId),
  );
}
