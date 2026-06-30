"use client";

import { useQuery } from "@tanstack/react-query";

import { useTeam } from "@/components/providers/UserProvider";
import { dashboardTasksQueryOptions } from "@/lib/queries/tasks";

export function useDashboardTasks() {
  const team = useTeam();
  const teamId = team?.id;

  return useQuery({
    ...dashboardTasksQueryOptions(teamId ?? ""),
    enabled: !!teamId,
  });
}
