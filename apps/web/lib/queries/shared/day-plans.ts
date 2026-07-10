import { queryOptions } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-client";
import type { TeamDayPlan } from "@/lib/types/team";

export function createTeamDayPlansQueryOptions(
  teamId: string,
  queryFn: () => Promise<TeamDayPlan[]>,
) {
  return queryOptions({
    queryKey: queryKeys.dayPlans.forTeam(teamId),
    queryFn,
    placeholderData: (previousData) => previousData,
  });
}
