import "server-only";

import { listInventoryForTeam } from "@/lib/data/inventory";
import { createTeamInventoryQueryOptions } from "@/lib/queries/shared/inventory";
import type { TeamInventoryItem } from "@stlvex/database/types";

export async function getTeamInventory(
  teamId: string,
): Promise<TeamInventoryItem[]> {
  return listInventoryForTeam(teamId);
}

export function teamInventoryQueryOptions(teamId: string) {
  return createTeamInventoryQueryOptions(teamId, () => getTeamInventory(teamId));
}
