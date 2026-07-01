"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import type { CalendarEvent } from "@/lib/types/team";
import { useTeamEvents } from "@/lib/hooks/use-team-events";
import { formatMonthYear, getDaysInMonth, getTodayDateStr } from "@/lib/utils/calendar";

const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

const eventDotClass: Record<CalendarEvent["type"], string> = {
  build: "bg-cyan-400",
  practice_match: "bg-purple-400",
  scrimmage: "bg-yellow-400",
  championship: "bg-amber-400",
  meeting: "bg-purple-400",
};

export function TeamCalendarWidget() {
  const { data: events = [], isLoading } = useTeamEvents();
  const today = getTodayDateStr();
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const daysGrid = useMemo(
    () => getDaysInMonth(currentMonth.getFullYear(), currentMonth.getMonth()),
    [currentMonth],
  );

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const event of events) {
      const existing = map.get(event.date) ?? [];
      map.set(event.date, [...existing, event]);
    }
    return map;
  }, [events]);

  const shiftMonth = (delta: number) => {
    setCurrentMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1),
    );
  };

  return (
    <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-md dark:bg-[#090e18]/80 dark:border-slate-900/80">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-black text-slate-900 dark:text-slate-200 uppercase tracking-wider">Team Calendar</h3>
        <Link
          href="/calendar"
          className="text-[10px] font-extrabold text-orange-500 hover:underline flex items-center gap-0.5"
        >
          View Calendar
          <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-black text-slate-700 dark:text-slate-300">{formatMonthYear(currentMonth)}</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => shiftMonth(-1)}
            className="p-1 rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 dark:bg-slate-950 dark:hover:bg-slate-900 dark:border-slate-900 dark:text-slate-400"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-3 w-3" />
          </button>
          <button
            type="button"
            onClick={() => shiftMonth(1)}
            className="p-1 rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 dark:bg-slate-950 dark:hover:bg-slate-900 dark:border-slate-900 dark:text-slate-400"
            aria-label="Next month"
          >
            <ChevronRight className="h-3 w-3" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold pb-2 border-b border-slate-200 text-slate-500 dark:border-slate-900">
        {WEEKDAY_LABELS.map((day, i) => (
          <span key={`${day}-${i}`}>{day}</span>
        ))}
      </div>

      <div
        className={`grid grid-cols-7 gap-1 text-center pt-2 ${isLoading ? "opacity-50" : ""}`}
      >
        {daysGrid.map((cell) => {
          const dayEvents = eventsByDate.get(cell.dateStr) ?? [];
          const isSelectedDay = cell.dateStr === today;

          return (
            <Link
              key={cell.dateStr}
              href={`/calendar?date=${cell.dateStr}`}
              className={`h-7 rounded flex flex-col items-center justify-center p-0.5 relative text-[10px] font-bold hover:bg-slate-100 dark:hover:bg-slate-900/60 transition ${
                cell.isCurrentMonth ? "text-slate-700 dark:text-slate-300" : "text-slate-400 dark:text-slate-600"
              } ${isSelectedDay ? "bg-orange-600/20 text-orange-400 border border-orange-500/30" : ""}`}
            >
              <span>{cell.day}</span>
              {dayEvents.length > 0 && (
                <div className="flex gap-0.5 justify-center mt-0.5 absolute bottom-1 scale-90">
                  {dayEvents.slice(0, 3).map((ev) => (
                    <span key={ev.id} className={`h-1 w-1 rounded-full ${eventDotClass[ev.type]}`} />
                  ))}
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
