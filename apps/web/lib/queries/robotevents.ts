import type { UpcomingMatch } from "@/lib/types/team";
import { queryKeys } from "@/lib/query-client";

export type UpcomingRobotEventsResponse = {
  configured: boolean;
  available: boolean;
  teamNumber: string;
  events: UpcomingMatch[];
};

export type PicklistRobotEvent = {
  id: number;
  name: string;
  date: string;
  sku: string;
};

export type PicklistRobotEventsResponse = Omit<
  UpcomingRobotEventsResponse,
  "events"
> & {
  events: PicklistRobotEvent[];
};

export type TeamEventStats = {
  opr: number | null;
  dpr: number | null;
  ccwm: number | null;
  ap: number | null;
  averagePoints: number | null;
  rank: number | null;
  wins: number | null;
  losses: number | null;
  ties: number | null;
};

export type EventAnalyticsResponse = {
  configured: boolean;
  available: boolean;
  eventId: number;
  teams: Record<string, TeamEventStats>;
};

export async function fetchUpcomingRobotEventsFromApi(): Promise<UpcomingRobotEventsResponse> {
  const response = await fetch("/api/robotevents/upcoming");

  if (!response.ok) {
    throw new Error("Failed to fetch RobotEvents schedule.");
  }

  return response.json() as Promise<UpcomingRobotEventsResponse>;
}

export function upcomingRobotEventsQueryOptions(teamId: string) {
  return {
    queryKey: queryKeys.robotevents.upcoming(teamId),
    queryFn: fetchUpcomingRobotEventsFromApi,
    staleTime: 15 * 60 * 1000,
  };
}

async function fetchPicklistRobotEvents(): Promise<PicklistRobotEventsResponse> {
  const response = await fetch("/api/robotevents/picklist-events");
  if (!response.ok) throw new Error("Failed to fetch RobotEvents events.");
  return response.json() as Promise<PicklistRobotEventsResponse>;
}

export function picklistRobotEventsQueryOptions(teamId: string) {
  return {
    queryKey: queryKeys.robotevents.picklistEvents(teamId),
    queryFn: fetchPicklistRobotEvents,
    staleTime: 15 * 60 * 1000,
  };
}

async function fetchEventAnalytics(
  eventId: string,
): Promise<EventAnalyticsResponse> {
  const response = await fetch(
    `/api/robotevents/event-analytics?eventId=${encodeURIComponent(eventId)}`,
  );
  if (!response.ok) throw new Error("Failed to fetch event analytics.");
  return response.json() as Promise<EventAnalyticsResponse>;
}

export function eventAnalyticsQueryOptions(eventId: string) {
  return {
    queryKey: queryKeys.robotevents.eventAnalytics(eventId),
    queryFn: () => fetchEventAnalytics(eventId),
    staleTime: 2 * 60 * 1000,
  };
}
