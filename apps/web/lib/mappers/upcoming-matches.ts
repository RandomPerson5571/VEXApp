import type { CalendarEvent, UpcomingMatch } from "@/lib/types/team";
import {
  addDaysToDateStr,
  getEventStyle,
  getTodayDateStr,
} from "@/lib/utils/calendar";

const UPCOMING_WINDOW_DAYS = 14;

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
    monthLabel: date.toLocaleString("en-US", { month: "short" }),
    day: date.getDate(),
    title: event.title,
    location: event.location ?? "Location TBD",
    time: formatEventTime(event),
    accentClass: getEventStyle(event.type).bg,
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
