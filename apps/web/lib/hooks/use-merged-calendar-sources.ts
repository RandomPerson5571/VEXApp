"use client";

import { useMemo } from "react";

import { isQueryInitiallyLoading } from "@/lib/hooks/use-query-loading";
import { useTeamEvents } from "@/lib/hooks/use-team-events";
import { useUpcomingRobotEvents } from "@/lib/hooks/use-upcoming-robotevents";
import {
  calendarSourcesWarning,
  resolveCalendarSourcesStatus,
  type CalendarSourcesStatus,
} from "@/lib/mappers/calendar-sources";
import {
  mergeUpcomingMatches,
  toCalendarEventsFromRobotEvents,
} from "@/lib/mappers/upcoming-matches";
import type { CalendarEvent, UpcomingMatch } from "@/lib/types/team";

export type MergedCalendarSources = {
  teamEvents: CalendarEvent[];
  robotEvents: UpcomingMatch[];
  calendarEvents: CalendarEvent[];
  upcomingMatches: UpcomingMatch[];
  status: CalendarSourcesStatus;
  warning: string | null;
  isInitialLoading: boolean;
  configured: boolean;
  teamNumber: string | undefined;
  teamEventsQuery: ReturnType<typeof useTeamEvents>;
  robotEventsQuery: ReturnType<typeof useUpcomingRobotEvents>;
};

/**
 * Fetch Supabase team events + RobotEvents independently, then merge with
 * graceful degradation when either source fails.
 */
export function useMergedCalendarSources(): MergedCalendarSources {
  const teamEventsQuery = useTeamEvents();
  const robotEventsQuery = useUpcomingRobotEvents();

  const teamEvents = teamEventsQuery.isError
    ? []
    : (teamEventsQuery.data ?? []);
  const robotData = robotEventsQuery.isError
    ? undefined
    : robotEventsQuery.data;
  const robotEvents = robotData?.events ?? [];
  const configured = robotData?.configured ?? true;
  const teamNumber = robotData?.teamNumber;

  const isInitialLoading =
    isQueryInitiallyLoading(teamEventsQuery) ||
    isQueryInitiallyLoading(robotEventsQuery);

  const status = resolveCalendarSourcesStatus({
    teamPending: isQueryInitiallyLoading(teamEventsQuery),
    teamError: teamEventsQuery.isError,
    robotPending: isQueryInitiallyLoading(robotEventsQuery),
    robotError: robotEventsQuery.isError,
    robotConfigured: robotData?.configured ?? true,
    robotAvailable: robotData?.available ?? true,
  });

  const calendarEvents = useMemo(
    () => [...teamEvents, ...toCalendarEventsFromRobotEvents(robotEvents)],
    [teamEvents, robotEvents],
  );

  const upcomingMatches = useMemo(
    () => mergeUpcomingMatches(teamEvents, robotEvents),
    [teamEvents, robotEvents],
  );

  return {
    teamEvents,
    robotEvents,
    calendarEvents,
    upcomingMatches,
    status,
    warning: calendarSourcesWarning(status),
    isInitialLoading,
    configured,
    teamNumber,
    teamEventsQuery,
    robotEventsQuery,
  };
}
