"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import type { CalendarEvent, DayPlanType, TeamDayPlan } from "@/lib/types/team";
import { isQueryInitiallyLoading } from "@/lib/hooks/use-query-loading";
import { useTeamDayPlans } from "@/lib/hooks/use-team-day-plans";
import { useTeamEvents } from "@/lib/hooks/use-team-events";
import {
  formatMonthYear,
  getDayPlanStyle,
  getDaysInMonth,
  getTodayDateStr,
} from "@/lib/utils/calendar";

const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];
const DAY_PLAN_TYPES: DayPlanType[] = ["build", "coding", "testing"];

// ponytail: one accent for all event dots; day-plan colors stay (they encode meaning)
const EVENT_DOT_CLASS = "bg-orange-400";

export function TeamCalendarWidget() {
  const eventsQuery = useTeamEvents();
  const dayPlansQuery = useTeamDayPlans();
  const { data: events = [] } = eventsQuery;
  const { data: dayPlans = [] } = dayPlansQuery;
  const isInitialLoading =
    isQueryInitiallyLoading(eventsQuery) ||
    isQueryInitiallyLoading(dayPlansQuery);
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

  const dayPlansByDate = useMemo(() => {
    const map = new Map<string, TeamDayPlan>();
    for (const plan of dayPlans) {
      map.set(plan.date, plan);
    }
    return map;
  }, [dayPlans]);

  const shiftMonth = (delta: number) => {
    setCurrentMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1),
    );
  };

  return (
    <div className="rounded-[32px] border border-slate-200 dark:border-[#1a1a1a] bg-white dark:bg-[#0a0a0a] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
      <div className="flex items-start justify-between mb-1">
        <div>
          <h3 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider">
            Team Calendar
          </h3>
          <p className="mt-0.5 text-[10px] font-semibold text-slate-600 dark:text-slate-400">
            Colored days = day focus (Build / Coding / Testing)
          </p>
        </div>
        <Link
          href="/calendar"
          className="text-[10px] font-extrabold text-orange-600 dark:text-orange-300 hover:text-orange-700 dark:hover:text-orange-200 flex items-center gap-0.5 shrink-0"
        >
          View Calendar
          <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-3">
        {DAY_PLAN_TYPES.map((type) => {
          const style = getDayPlanStyle(type);
          return (
            <span
              key={type}
              className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[10px] font-black uppercase tracking-wide ${style.badge}`}
            >
              <span className={`h-2.5 w-2.5 rounded-full ${style.dot}`} />
              {style.label}
            </span>
          );
        })}
      </div>

      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-black text-slate-900 dark:text-slate-100">
          {formatMonthYear(currentMonth)}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => shiftMonth(-1)}
            className="p-1 rounded bg-slate-200 dark:bg-[#121212]/80 border border-slate-300 dark:border-[#1a1a1a] text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-[#121212]"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-3 w-3" />
          </button>
          <button
            type="button"
            onClick={() => shiftMonth(1)}
            className="p-1 rounded bg-slate-200 dark:bg-[#121212]/80 border border-slate-300 dark:border-[#1a1a1a] text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-[#121212]"
            aria-label="Next month"
          >
            <ChevronRight className="h-3 w-3" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold pb-2 border-b border-slate-300 dark:border-[#1a1a1a] text-slate-600 dark:text-slate-500">
        {WEEKDAY_LABELS.map((day, i) => (
          <span key={`${day}-${i}`}>{day}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1.5 pt-2 text-center">
        {isInitialLoading
          ? daysGrid.map((cell) => (
              <div
                key={cell.dateStr}
                className="h-11 animate-pulse rounded-xl bg-slate-100 dark:bg-[#121212]/60"
              />
            ))
          : daysGrid.map((cell) => {
              const dayEvents = eventsByDate.get(cell.dateStr) ?? [];
              const dayPlan = dayPlansByDate.get(cell.dateStr);
              const dayPlanStyle = dayPlan
                ? getDayPlanStyle(dayPlan.type)
                : null;
              const isSelectedDay = cell.dateStr === today;

              const planBg = dayPlanStyle
                ? cell.isCurrentMonth
                  ? dayPlanStyle.cellBg
                  : dayPlanStyle.cellBgMuted
                : "";

              return (
                <Link
                  key={cell.dateStr}
                  href={`/calendar?date=${cell.dateStr}`}
                  className={`min-h-11 rounded-xl flex flex-col items-center justify-center gap-0.5 p-1 relative text-[10px] font-bold transition border ${
                    cell.isCurrentMonth
                      ? "text-slate-900 dark:text-slate-100"
                      : "text-slate-500 dark:text-slate-500"
                  } ${planBg} ${
                    dayPlanStyle
                      ? `border-l-[3px] ${dayPlanStyle.accent}`
                      : "border-transparent"
                  } ${
                    isSelectedDay
                      ? "ring-2 ring-inset ring-orange-500/50 text-orange-600 dark:text-orange-300"
                      : "hover:bg-slate-200/50 dark:hover:bg-white/5"
                  }`}
                >
                  <span className="leading-none">{cell.day}</span>
                  {dayEvents.length > 0 && (
                    <div className="flex gap-0.5 justify-center absolute bottom-1">
                      {dayEvents.slice(0, 3).map((ev) => (
                        <span
                          key={ev.id}
                          className={`h-1.5 w-1.5 rounded-full ${EVENT_DOT_CLASS}`}
                        />
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
