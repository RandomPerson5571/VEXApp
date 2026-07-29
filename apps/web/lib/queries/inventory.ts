import type { TeamInventoryItem } from "@stlvex/database/types";

import { createTeamInventoryQueryOptions } from "@/lib/queries/shared/inventory";
import { throwIfRateLimited } from "@/lib/queries/api-response";

export type CreateInventoryItemPayload = {
  name: string;
  description?: string;
  totalStock: number;
  checkoutLimit?: number;
  imageUrl?: string;
};

export type SignOutInventoryItemPayload = {
  itemId: string;
  quantity: number;
};

export type ReturnInventorySignOutPayload = {
  itemId: string;
  signOutId: string;
};

export async function fetchTeamInventoryFromApi(): Promise<TeamInventoryItem[]> {
  const response = await fetch("/api/inventory");

  if (!response.ok) {
    throw new Error("Failed to fetch team inventory.");
  }

  return response.json() as Promise<TeamInventoryItem[]>;
}

export type UpdateInventoryItemPayload = CreateInventoryItemPayload & {
  itemId: string;
  imageUrl?: string | null;
};

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

export async function updateInventoryItemFromApi(
  payload: UpdateInventoryItemPayload,
): Promise<TeamInventoryItem> {
  const { itemId, ...body } = payload;
  const response = await fetch(`/api/inventory/${itemId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  throwIfRateLimited(response);

  const result = (await response.json()) as TeamInventoryItem | { error?: string };

  if (!response.ok) {
    throw new Error(
      "error" in result && result.error
        ? result.error
        : "Failed to update inventory item.",
    );
  }

  return result as TeamInventoryItem;
}

export async function deleteInventoryItemFromApi(itemId: string): Promise<void> {
  const response = await fetch(`/api/inventory/${itemId}`, { method: "DELETE" });

  throwIfRateLimited(response);

  if (response.status === 204) return;

  const body = (await response.json()) as { error?: string };

  throw new Error(body.error ?? "Failed to delete inventory item.");
}

export async function signOutInventoryItemFromApi(
  payload: SignOutInventoryItemPayload,
): Promise<TeamInventoryItem> {
  const response = await fetch(`/api/inventory/${payload.itemId}/sign-outs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ quantity: payload.quantity }),
  });

  throwIfRateLimited(response);

  const body = (await response.json()) as TeamInventoryItem | { error?: string };

  if (!response.ok) {
    throw new Error(
      "error" in body && body.error ? body.error : "Failed to sign out inventory item.",
    );
  }

  return body as TeamInventoryItem;
}

export async function returnInventorySignOutFromApi(
  payload: ReturnInventorySignOutPayload,
): Promise<TeamInventoryItem> {
  const response = await fetch(
    `/api/inventory/${payload.itemId}/sign-outs/${payload.signOutId}`,
    { method: "PATCH" },
  );

  throwIfRateLimited(response);

  const body = (await response.json()) as TeamInventoryItem | { error?: string };

  if (!response.ok) {
    throw new Error(
      "error" in body && body.error ? body.error : "Failed to return inventory item.",
    );
  }

  return body as TeamInventoryItem;
}

export function teamInventoryQueryOptions(teamId: string) {
  return createTeamInventoryQueryOptions(teamId, fetchTeamInventoryFromApi);
}
