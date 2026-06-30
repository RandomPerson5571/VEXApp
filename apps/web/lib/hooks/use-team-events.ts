"use client";

import { useQuery } from "@tanstack/react-query";

import { useTeam } from "@/components/providers/UserProvider";
import { teamEventsQueryOptions } from "@/lib/queries/events";

export function useTeamEvents() {
  const team = useTeam();
  const teamId = team?.id;

  return useQuery({
    ...teamEventsQueryOptions(teamId ?? ""),
    enabled: !!teamId,
  });
}
