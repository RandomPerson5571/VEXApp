import "server-only";

import {
  createInventoryItem,
  deleteInventoryItem,
  listInventoryForTeam,
  returnInventorySignOut,
  signOutInventoryItem,
  updateInventoryItem,
  type CreateInventoryItemInput,
  type ReturnInventorySignOutInput,
  type SignOutInventoryItemInput,
  type UpdateInventoryItemInput,
} from "@/lib/data/inventory";
import {
  markInventoryOrderPlaced,
  syncInventoryStockAlerts,
} from "@/lib/data/inventory-alerts";
import { createTeamInventoryQueryOptions } from "@/lib/queries/shared/inventory";
import { dispatchTelemetry } from "@/lib/telemetry/dispatch";
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

export async function updateTeamInventoryItem(
  input: UpdateInventoryItemInput & { teamId?: string },
): Promise<TeamInventoryItem> {
  const item = await updateInventoryItem(input);
  if (input.teamId) {
    return syncInventoryStockAlerts(item.id, input.teamId);
  }
  return item;
}

export async function deleteTeamInventoryItem(itemId: string): Promise<void> {
  await deleteInventoryItem(itemId);
}

export async function signOutTeamInventoryItem(
  input: SignOutInventoryItemInput,
): Promise<TeamInventoryItem> {
  await signOutInventoryItem(input);
  return syncInventoryStockAlerts(input.inventoryItemId, input.teamId);
}

export async function returnTeamInventorySignOut(
  input: ReturnInventorySignOutInput,
): Promise<TeamInventoryItem> {
  await returnInventorySignOut(input);
  dispatchTelemetry({ teamId: input.teamId, event: "partsReturned" });
  return syncInventoryStockAlerts(input.inventoryItemId, input.teamId);
}

export async function orderPlacedTeamInventoryItem(
  itemId: string,
): Promise<TeamInventoryItem> {
  return markInventoryOrderPlaced(itemId);
}

export function teamInventoryQueryOptions(teamId: string) {
  return createTeamInventoryQueryOptions(teamId, () => getTeamInventory(teamId));
}
