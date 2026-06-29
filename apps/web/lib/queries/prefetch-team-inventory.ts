import type { QueryClient } from "@tanstack/react-query";

import { teamInventoryQueryOptions } from "@/lib/queries/inventory.server";

export async function prefetchTeamInventory(
  queryClient: QueryClient,
  teamId: string,
) {
  await queryClient.prefetchQuery(teamInventoryQueryOptions(teamId));
}
