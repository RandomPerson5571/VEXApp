import type { TeamInventoryItem } from "@stlvex/database/types";

import { createTeamInventoryQueryOptions } from "@/lib/queries/shared/inventory";

export async function fetchTeamInventoryFromApi(): Promise<TeamInventoryItem[]> {
  const response = await fetch("/api/inventory");

  if (!response.ok) {
    throw new Error("Failed to fetch team inventory.");
  }

  return response.json() as Promise<TeamInventoryItem[]>;
}

export function teamInventoryQueryOptions(teamId: string) {
  return createTeamInventoryQueryOptions(teamId, fetchTeamInventoryFromApi);
}
