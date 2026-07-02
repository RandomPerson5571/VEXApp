import { queryOptions } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-client";
import type { DashboardSummaryStats } from "@/lib/types/team";

export function createDashboardSummaryQueryOptions(
  teamId: string,
  queryFn: () => Promise<DashboardSummaryStats>,
) {
  return queryOptions({
    queryKey: queryKeys.dashboard.summary(teamId),
    queryFn,
  });
}
