import type { CalendarEvent, EventType, UpcomingMatch } from "@/lib/types/team";
import { getEventStyle, getTodayDateStr } from "@/lib/utils/calendar";

const MATCH_EVENT_TYPES = new Set<EventType>([
  "practice_match",
  "scrimmage",
  "championship",
]);

function formatMatchTime(event: CalendarEvent): string {
  if (event.matchesCount) {
    return `${event.startTime} • ${event.matchesCount} matches`;
  }
  return event.startTime;
}

function toUpcomingMatch(event: CalendarEvent): UpcomingMatch {
  const date = new Date(`${event.date}T12:00:00`);

  return {
    id: event.id,
    monthLabel: date.toLocaleString("en-US", { month: "short" }),
    day: date.getDate(),
    title: event.title,
    location: event.location ?? "Location TBD",
    time: formatMatchTime(event),
    accentClass: getEventStyle(event.type).bg,
  };
}

export function toUpcomingMatches(events: CalendarEvent[]): UpcomingMatch[] {
  const today = getTodayDateStr();

  return events
    .filter((event) => MATCH_EVENT_TYPES.has(event.type))
    .filter((event) => event.date >= today)
    .sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) {
        return dateCompare;
      }
      return a.startTime.localeCompare(b.startTime);
    })
    .map(toUpcomingMatch);
}
