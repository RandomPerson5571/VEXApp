import "server-only";

import {
  createInventoryItem,
  listInventoryForTeam,
  type CreateInventoryItemInput,
} from "@/lib/data/inventory";
import { createTeamInventoryQueryOptions } from "@/lib/queries/shared/inventory";
import type { TeamInventoryItem } from "@stlvex/database/types";

export async function getTeamInventory(
  teamId: string,
): Promise<TeamInventoryItem[]> {
  return listInventoryForTeam(teamId);
}

export async function createTeamInventoryItem(
  input: CreateInventoryItemInput,
): Promise<TeamInventoryItem> {
  return createInventoryItem(input);
}

export function teamInventoryQueryOptions(teamId: string) {
  return createTeamInventoryQueryOptions(teamId, () => getTeamInventory(teamId));
}
