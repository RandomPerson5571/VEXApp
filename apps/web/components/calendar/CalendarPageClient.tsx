"use client";

import { useSearchParams } from "next/navigation";

import { CalendarView } from "@/components/calendar/CalendarView";
import { getTodayDateStr } from "@/lib/utils/calendar";

export function CalendarPageClient() {
  const searchParams = useSearchParams();

  return (
    <CalendarView initialSelectedDate={searchParams.get("date") ?? getTodayDateStr()} />
  );
}
