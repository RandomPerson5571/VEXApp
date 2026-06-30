import "server-only";

import { listInventoryForTeam } from "@/lib/data/inventory";
import { queryKeys } from "@/lib/query-client";
import type { TeamInventoryItem } from "@stlvex/database/types";

export async function getTeamInventory(
  teamId: string,
): Promise<TeamInventoryItem[]> {
  return listInventoryForTeam(teamId);
}

export function teamInventoryQueryOptions(teamId: string) {
  return {
    queryKey: queryKeys.inventory.forTeam(teamId),
    queryFn: () => getTeamInventory(teamId),
  };
}
