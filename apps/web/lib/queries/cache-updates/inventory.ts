import type { QueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-client";
import type { TeamInventoryItem } from "@stlvex/database/types";

export function prependTeamInventoryItem(
  queryClient: QueryClient,
  teamId: string,
  newItem: TeamInventoryItem,
): void {
  queryClient.setQueryData<TeamInventoryItem[]>(
    queryKeys.inventory.forTeam(teamId),
    (old) => {
      if (!old) return [newItem];
      return [...old, newItem].sort((a, b) => a.name.localeCompare(b.name));
    },
  );
}

export function replaceTeamInventoryItem(
  queryClient: QueryClient,
  teamId: string,
  updatedItem: TeamInventoryItem,
): void {
  queryClient.setQueryData<TeamInventoryItem[]>(
    queryKeys.inventory.forTeam(teamId),
    (old) => {
      if (!old) return [updatedItem];
      return old.map((item) => (item.id === updatedItem.id ? updatedItem : item));
    },
  );
}
