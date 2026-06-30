"use client";

import { useQuery } from "@tanstack/react-query";

import { useTeam } from "@/components/providers/UserProvider";
import { teamMembersQueryOptions } from "@/lib/queries/team-members";

export function useTeamMembers() {
  const team = useTeam();
  const teamId = team?.id;

  return useQuery({
    ...teamMembersQueryOptions(teamId ?? ""),
    enabled: !!teamId,
  });
}
