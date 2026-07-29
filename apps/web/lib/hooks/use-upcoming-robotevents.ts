"use client";

import { useQuery } from "@tanstack/react-query";

import { useTeam } from "@/components/providers/UserProvider";
import { upcomingRobotEventsQueryOptions } from "@/lib/queries/robotevents";

export function useUpcomingRobotEvents() {
  const team = useTeam();
  const teamId = team?.id;

  return useQuery({
    ...upcomingRobotEventsQueryOptions(teamId ?? ""),
    enabled: !!teamId,
  });
}
