import type { Event } from "@stlvex/database/types";

import { CalendarView } from "@/components/calendar/CalendarView";
import { getCurrentUser } from "@/lib/auth/current-user";
import { listEventsForTeam } from "@/lib/data/events";
import { toCalendarEvents } from "@/lib/mappers/events";

function todayIsoDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date } = await searchParams;

  let events: Event[] = [];

  try {
    const currentUser = await getCurrentUser();
    if (currentUser?.profile.teamId) {
      events = await listEventsForTeam(currentUser.profile.teamId);
    }
  } catch (error) {
    console.error("Failed to load calendar events:", error);
  }

  return (
    <CalendarView
      initialEvents={toCalendarEvents(events)}
      initialSelectedDate={date ?? todayIsoDate()}
    />
  );
}
