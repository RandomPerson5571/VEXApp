import { CalendarView } from "@/components/calendar/CalendarView";
import { getCurrentUser } from "@/lib/auth/current-user";
import { toCalendarEvents } from "@/lib/supabase/mappers/events";
import { createClient } from "@/lib/supabase/server";
import { listEventsForTeam, type Event } from "@/lib/supabase/wrappers";

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
  const supabase = await createClient();

  let events: Event[] = [];

  try {
    const currentUser = await getCurrentUser();
    if (currentUser?.profile.teamId) {
      events = await listEventsForTeam(supabase, currentUser.profile.teamId);
    }
  } catch {
    events = [];
  }

  return (
    <CalendarView
      initialEvents={toCalendarEvents(events)}
      initialSelectedDate={date ?? todayIsoDate()}
    />
  );
}
