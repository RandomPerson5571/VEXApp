import type { TeamInventoryItem } from "@stlvex/database/types";

import { createTeamInventoryQueryOptions } from "@/lib/queries/shared/inventory";
import { throwIfRateLimited } from "@/lib/queries/api-response";

export type CreateInventoryItemPayload = {
  name: string;
  description?: string;
  totalStock: number;
  imageUrl?: string;
};

export async function fetchTeamInventoryFromApi(): Promise<TeamInventoryItem[]> {
  const response = await fetch("/api/inventory");

  if (!response.ok) {
    throw new Error("Failed to fetch team inventory.");
  }

  return response.json() as Promise<TeamInventoryItem[]>;
}

export async function createInventoryItemFromApi(
  payload: CreateInventoryItemPayload,
): Promise<TeamInventoryItem> {
  const response = await fetch("/api/inventory", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  throwIfRateLimited(response);

  const body = (await response.json()) as TeamInventoryItem | { error?: string };

  if (!response.ok) {
    throw new Error(
      "error" in body && body.error ? body.error : "Failed to create inventory item.",
    );
  }

  return body as TeamInventoryItem;
}

export function teamInventoryQueryOptions(teamId: string) {
  return createTeamInventoryQueryOptions(teamId, fetchTeamInventoryFromApi);
}
