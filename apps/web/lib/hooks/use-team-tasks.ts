"use client";

import { useQuery } from "@tanstack/react-query";

import { useTeam } from "@/components/providers/UserProvider";
import { teamTasksQueryOptions } from "@/lib/queries/tasks";

export function useTeamTasks() {
  const team = useTeam();
  const teamId = team?.id;

  return useQuery({
    ...teamTasksQueryOptions(teamId ?? ""),
    enabled: !!teamId,
  });
}
