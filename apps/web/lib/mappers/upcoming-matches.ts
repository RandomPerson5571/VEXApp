import type { CalendarEvent, UpcomingMatch } from "@/lib/types/team";
import {
  addDaysToDateStr,
  getEventStyle,
  getTodayDateStr,
} from "@/lib/utils/calendar";

const UPCOMING_WINDOW_DAYS = 14;
const WIDGET_LIMIT = 6;

export function isRobotEventsId(id: string): boolean {
  return id.startsWith("re-");
}

function formatEventTime(event: CalendarEvent): string {
  if (event.matchesCount) {
    return `${event.startTime} • ${event.matchesCount} matches`;
  }
  return event.startTime;
}

function toUpcomingEvent(event: CalendarEvent): UpcomingMatch {
  const date = new Date(`${event.date}T12:00:00`);

  return {
    id: event.id,
    date: event.date,
    monthLabel: date.toLocaleString("en-US", { month: "short" }),
    day: date.getDate(),
    title: event.title,
    location: event.location ?? "Location TBD",
    time: formatEventTime(event),
    accentClass: getEventStyle(event.type).bg,
    href: event.href,
  };
}

/** All team events from today through the next 2 weeks. */
export function toUpcomingMatches(events: CalendarEvent[]): UpcomingMatch[] {
  const today = getTodayDateStr();
  const end = addDaysToDateStr(today, UPCOMING_WINDOW_DAYS);

  return events
    .filter((event) => event.date >= today && event.date <= end)
    .sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) {
        return dateCompare;
      }
      return a.startTime.localeCompare(b.startTime);
    })
    .map(toUpcomingEvent);
}

/** Map a RobotEvents UpcomingMatch into a read-only calendar row. */
export function toCalendarEventFromRobotEvent(
  match: UpcomingMatch,
): CalendarEvent {
  return {
    id: match.id,
    title: match.title,
    date: match.date,
    startTime: "8:00 AM",
    endTime: "5:00 PM",
    type: "championship",
    location: match.location,
    description: match.time,
    href: match.href,
  };
}

export function toCalendarEventsFromRobotEvents(
  matches: UpcomingMatch[],
): CalendarEvent[] {
  return matches.map(toCalendarEventFromRobotEvent);
}

/** Merge team calendar + RobotEvents rows for the dashboard widget. */
export function mergeUpcomingMatches(
  teamEvents: CalendarEvent[],
  robotEvents: UpcomingMatch[],
  limit = WIDGET_LIMIT,
): UpcomingMatch[] {
  const today = getTodayDateStr();
  const fromTeam = toUpcomingMatches(teamEvents);
  const fromRobot = robotEvents.filter((event) => event.date >= today);

  return [...fromTeam, ...fromRobot]
    .sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return a.title.localeCompare(b.title);
    })
    .slice(0, limit);
}
