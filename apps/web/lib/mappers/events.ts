import type { Event, EventType as PrismaEventType } from "@stlvex/database/types";

import type { CalendarEvent, EventType as UiEventType } from "@/lib/types/team";

function formatDate(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatTime(value: Date): string {
  return value.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function mapEventType(
  type: PrismaEventType,
  name: string,
): UiEventType {
  switch (type) {
    case "WORK_SESSION":
      return "build";
    case "CHECK_IN":
    case "LESSON":
      return "meeting";
    case "TOURNAMENT":
      return /championship|regional|state|worlds/i.test(name)
        ? "championship"
        : "scrimmage";
    default:
      return "meeting";
  }
}

export function fromUiEventType(type: UiEventType): PrismaEventType {
  switch (type) {
    case "build":
      return "WORK_SESSION";
    case "meeting":
      return "CHECK_IN";
    case "practice_match":
    case "scrimmage":
    case "championship":
      return "TOURNAMENT";
    default:
      return "WORK_SESSION";
  }
}

export function toCalendarEvent(event: Event): CalendarEvent {
  return {
    id: event.id,
    title: event.name,
    date: formatDate(event.startDate),
    startTime: formatTime(event.startDate),
    endTime: formatTime(event.endDate),
    type: mapEventType(event.type, event.name),
    location: event.location,
    description: event.description ?? undefined,
  };
}

export function toCalendarEvents(events: Event[]): CalendarEvent[] {
  return events.map(toCalendarEvent);
}
