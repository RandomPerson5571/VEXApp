"use client";

import type { CalendarEvent, TeamDayPlan } from "@/lib/types/team";
import { getDayPlanStyle, getEventStyle } from "@/lib/utils/calendar";
import type { CalendarDayCell } from "@/lib/utils/calendar";

const WEEKDAY_LABELS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

export function CalendarMonthGrid({
  calendarDays,
  eventsByDate,
  dayPlansByDate,
  selectedDate,
  todayStr,
  onSelectDate,
}: {
  calendarDays: CalendarDayCell[];
  eventsByDate: Map<string, CalendarEvent[]>;
  dayPlansByDate: Map<string, TeamDayPlan>;
  selectedDate: string;
  todayStr: string;
  onSelectDate: (date: string) => void;
}) {
  return (
    <div className="flex-1 bg-white dark:bg-[#090e18]/80 border border-slate-200 dark:border-slate-900 rounded-2xl overflow-hidden flex flex-col min-h-[450px]">
      <div className="grid grid-cols-7 text-center text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest py-3 border-b border-slate-200 dark:border-slate-900 bg-slate-100 dark:bg-slate-950">
        {WEEKDAY_LABELS.map((day) => (
          <div key={day}>{day}</div>
        ))}
      </div>

      <div className="flex-1 grid grid-cols-7 divide-x divide-y divide-slate-200 dark:divide-slate-900/60 bg-white dark:bg-[#090e18]/40">
        {calendarDays.map((cell) => {
          const dayEvents = eventsByDate.get(cell.dateStr) ?? [];
          const dayPlan = dayPlansByDate.get(cell.dateStr);
          const dayPlanStyle = dayPlan ? getDayPlanStyle(dayPlan.type) : null;
          const isSelected = selectedDate === cell.dateStr;
          const isToday = cell.dateStr === todayStr;

          return (
            <button
              key={cell.dateStr}
              type="button"
              onClick={() => onSelectDate(cell.dateStr)}
              className={`min-h-[85px] p-2 flex flex-col transition relative text-xs cursor-pointer select-none group border-slate-200 dark:border-slate-900/60 text-left ${
                dayPlanStyle ? `border-l-2 ${dayPlanStyle.accent}` : ""
              } ${
                cell.isCurrentMonth ? "bg-white dark:bg-slate-950/20" : "bg-slate-100 dark:bg-slate-950/60 opacity-50"
              } ${
                isSelected ? "bg-orange-50 dark:bg-orange-600/10 border-2 border-orange-500/40 z-10" : "hover:bg-slate-100 dark:hover:bg-slate-900/40"
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`h-6 w-6 font-bold font-sans flex items-center justify-center rounded-full ${
                    isToday
                      ? "bg-orange-100 dark:bg-orange-600/20 text-orange-700 dark:text-orange-400 border border-orange-500/30"
                      : "text-slate-700 dark:text-slate-300"
                  }`}
                >
                  {cell.day}
                </span>
              </div>

              {dayPlanStyle && (
                <div
                  className={`mt-1.5 px-1.5 py-0.5 rounded text-[7.5px] font-black uppercase tracking-wide border truncate ${dayPlanStyle.badge}`}
                >
                  {dayPlanStyle.label}
                </div>
              )}

              <div className="flex-1 overflow-y-auto mt-1 space-y-1 dashboard-scroll max-h-[50px]">
                {dayEvents.map((ev) => {
                  const style = getEventStyle(ev.type);
                  return (
                    <div
                      key={ev.id}
                      className={`px-1.5 py-0.5 rounded text-[8.5px] font-bold border truncate flex items-center gap-1 uppercase ${style.bg}`}
                    >
                      <span className={`h-1 w-1 rounded-full ${style.dot} flex-shrink-0`} />
                      <span className="truncate">{ev.title}</span>
                    </div>
                  );
                })}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
