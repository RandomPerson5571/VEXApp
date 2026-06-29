"use client";

import { useQuery } from "@tanstack/react-query";

import { useTeam } from "@/components/providers/UserProvider";
import { teamInventoryQueryOptions } from "@/lib/queries/inventory";

export function useTeamInventory() {
  const team = useTeam();
  const teamId = team?.id;

  return useQuery({
    ...teamInventoryQueryOptions(teamId ?? ""),
    enabled: !!teamId,
  });
}
