import type { QueryClient } from "@tanstack/react-query";

import { teamMembersQueryOptions } from "@/lib/queries/team-members.server";

export async function prefetchTeamMembers(
  queryClient: QueryClient,
  teamId: string,
) {
  await queryClient.prefetchQuery(teamMembersQueryOptions(teamId));
}
