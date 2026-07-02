import { queryOptions } from "@tanstack/react-query";
import type { TeamInventoryItem } from "@stlvex/database/types";

import { queryKeys } from "@/lib/query-client";

export function createTeamInventoryQueryOptions(
  teamId: string,
  queryFn: () => Promise<TeamInventoryItem[]>,
) {
  return queryOptions({
    queryKey: queryKeys.inventory.forTeam(teamId),
    queryFn,
  });
}
