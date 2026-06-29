"use client";

import { useQuery } from "@tanstack/react-query";

import { useTeam } from "@/components/providers/UserProvider";
import { dashboardSummaryQueryOptions } from "@/lib/queries/dashboard-summary";

export function useDashboardSummary() {
  const team = useTeam();
  const teamId = team?.id;

  return useQuery({
    ...dashboardSummaryQueryOptions(teamId ?? ""),
    enabled: !!teamId,
  });
}
