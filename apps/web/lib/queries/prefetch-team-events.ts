import type { QueryClient } from "@tanstack/react-query";

import { teamEventsQueryOptions } from "@/lib/queries/events.server";

export async function prefetchTeamEvents(
  queryClient: QueryClient,
  teamId: string,
) {
  await queryClient.prefetchQuery(teamEventsQueryOptions(teamId));
}
