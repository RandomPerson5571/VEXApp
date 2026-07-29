"use client";

import type { CalendarEvent, TeamDayPlan } from "@/lib/types/team";
import { getDayPlanStyle, getEventStyle } from "@/lib/utils/calendar";
import type { CalendarDayCell } from "@/lib/utils/calendar";
import { DayPlanIcon } from "@/components/calendar/DayPlanIcon";

const WEEKDAY_LABELS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

export function CalendarMonthGrid({
  calendarDays,
  eventsByDate,
  dayPlansByDate,
  selectedDate,
  todayStr,
  onSelectDate,
  onEventClick,
}: {
  calendarDays: CalendarDayCell[];
  eventsByDate: Map<string, CalendarEvent[]>;
  dayPlansByDate: Map<string, TeamDayPlan>;
  selectedDate: string;
  todayStr: string;
  onSelectDate: (date: string) => void;
  onEventClick: (event: CalendarEvent) => void;
}) {
  return (
    <div className="flex-1 bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-[#1a1a1a] rounded-2xl overflow-hidden flex flex-col min-h-[450px]">
      <div className="grid grid-cols-7 text-center text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest py-3 border-b border-slate-200 dark:border-[#1a1a1a] bg-slate-100 dark:bg-[#121212]">
        {WEEKDAY_LABELS.map((day) => (
          <div key={day}>{day}</div>
        ))}
      </div>

      <div className="flex-1 grid grid-cols-7 divide-x divide-y divide-slate-200 dark:divide-[#1a1a1a] bg-white dark:bg-[#0a0a0a]/40">
        {calendarDays.map((cell) => {
          const dayEvents = eventsByDate.get(cell.dateStr) ?? [];
          const dayPlan = dayPlansByDate.get(cell.dateStr);
          const dayPlanStyle = dayPlan ? getDayPlanStyle(dayPlan.type) : null;
          const isSelected = selectedDate === cell.dateStr;
          const isToday = cell.dateStr === todayStr;

          const defaultBg = cell.isCurrentMonth
            ? "bg-white dark:bg-[#121212]/20"
            : "bg-slate-100 dark:bg-[#121212]/60 opacity-50";
          const planBg = dayPlanStyle
            ? cell.isCurrentMonth
              ? dayPlanStyle.cellBg
              : dayPlanStyle.cellBgMuted
            : defaultBg;

          return (
            <button
              key={cell.dateStr}
              type="button"
              onClick={() => onSelectDate(cell.dateStr)}
              className={`min-h-[85px] p-2 flex flex-col transition-all duration-200 relative text-xs cursor-pointer select-none group text-left ${planBg} ${
                dayPlanStyle ? `border-l-[3px] ${dayPlanStyle.accent}` : "border-slate-200 dark:border-[#1a1a1a]"
              } ${
                isSelected
                  ? "ring-2 ring-inset ring-orange-500/60 dark:ring-orange-400/50 z-10 shadow-sm"
                  : "hover:brightness-[0.97] dark:hover:brightness-110"
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`h-6 w-6 font-bold font-sans flex items-center justify-center rounded-full ${
                    isToday
                      ? "bg-orange-500 text-white shadow-sm shadow-orange-500/40"
                      : dayPlanStyle
                        ? "text-slate-800 dark:text-slate-100"
                        : "text-slate-700 dark:text-slate-300"
                  }`}
                >
                  {cell.day}
                </span>
                {dayPlan && <DayPlanIcon type={dayPlan.type} className="h-3.5 w-3.5" />}
              </div>

              <div className="flex-1 overflow-y-auto mt-1 space-y-1 dashboard-scroll max-h-[50px]">
                {dayEvents.map((ev) => {
                  const style = getEventStyle(ev.type);
                  return (
                    <span
                      key={ev.id}
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick(ev);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          e.stopPropagation();
                          onEventClick(ev);
                        }
                      }}
                      className={`px-1.5 py-0.5 rounded text-[8.5px] font-bold border truncate flex items-center gap-1 uppercase cursor-pointer hover:brightness-95 ${style.bg}`}
                    >
                      <span className={`h-1 w-1 rounded-full ${style.dot} flex-shrink-0`} />
                      <span className="truncate">{ev.title}</span>
                    </span>
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
