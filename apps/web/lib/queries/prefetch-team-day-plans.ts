import type { QueryClient } from "@tanstack/react-query";

import { teamDayPlansQueryOptions } from "@/lib/queries/day-plans.server";

export async function prefetchTeamDayPlans(
  queryClient: QueryClient,
  teamId: string,
) {
  await queryClient.prefetchQuery(teamDayPlansQueryOptions(teamId));
}
