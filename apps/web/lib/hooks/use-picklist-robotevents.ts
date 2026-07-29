"use client";

import { useQuery } from "@tanstack/react-query";

import { useTeam } from "@/components/providers/UserProvider";
import {
  eventAnalyticsQueryOptions,
  picklistRobotEventsQueryOptions,
} from "@/lib/queries/robotevents";

export function usePicklistRobotEvents(eventId: string) {
  const teamId = useTeam()?.id ?? "";
  const eventsQuery = useQuery({
    ...picklistRobotEventsQueryOptions(teamId),
    enabled: Boolean(teamId),
  });
  const analyticsQuery = useQuery({
    ...eventAnalyticsQueryOptions(eventId),
    enabled: Boolean(teamId && eventId),
  });

  return { eventsQuery, analyticsQuery };
}
