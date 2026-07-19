import "server-only";

import {
  createInventoryItem,
  listInventoryForTeam,
  returnInventorySignOut,
  signOutInventoryItem,
  type CreateInventoryItemInput,
  type ReturnInventorySignOutInput,
  type SignOutInventoryItemInput,
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

export async function signOutTeamInventoryItem(
  input: SignOutInventoryItemInput,
): Promise<TeamInventoryItem> {
  return signOutInventoryItem(input);
}

export async function returnTeamInventorySignOut(
  input: ReturnInventorySignOutInput,
): Promise<TeamInventoryItem> {
  return returnInventorySignOut(input);
}

export function teamInventoryQueryOptions(teamId: string) {
  return createTeamInventoryQueryOptions(teamId, () => getTeamInventory(teamId));
}
