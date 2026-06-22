import { CalendarView } from "@/components/calendar/CalendarView";
import { mockEvents } from "@/lib/mock/dashboard";

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date } = await searchParams;

  return (
    <CalendarView
      initialEvents={mockEvents}
      initialSelectedDate={date ?? "2025-05-14"}
    />
  );
}
