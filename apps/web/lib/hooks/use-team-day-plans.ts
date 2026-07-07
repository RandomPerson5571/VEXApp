"use client";

import { useQuery } from "@tanstack/react-query";

import { useTeam } from "@/components/providers/UserProvider";
import { teamDayPlansQueryOptions } from "@/lib/queries/day-plans";

export function useTeamDayPlans() {
  const team = useTeam();
  const teamId = team?.id;

  return useQuery({
    ...teamDayPlansQueryOptions(teamId ?? ""),
    enabled: !!teamId,
  });
}
