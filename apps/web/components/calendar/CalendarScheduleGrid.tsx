"use client";

import type { CalendarEvent, TeamDayPlan } from "@/lib/types/team";
import {
  getDayPlanStyle,
  getEventStyle,
  getEventTimePosition,
  getScheduleHours,
  parseDateStr,
  SCHEDULE_HOUR_HEIGHT,
  SCHEDULE_HOUR_START,
} from "@/lib/utils/calendar";
import type { CalendarDayCell } from "@/lib/utils/calendar";

const WEEKDAY_LABELS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

export function CalendarScheduleGrid({
  mode,
  days,
  eventsByDate,
  dayPlansByDate,
  selectedDate,
  todayStr,
  onSelectDate,
}: {
  mode: "week" | "day";
  days: CalendarDayCell[];
  eventsByDate: Map<string, CalendarEvent[]>;
  dayPlansByDate: Map<string, TeamDayPlan>;
  selectedDate: string;
  todayStr: string;
  onSelectDate: (date: string) => void;
}) {
  const hours = getScheduleHours();
  const gridHeight = hours.length * SCHEDULE_HOUR_HEIGHT;
  const cols =
    mode === "week" ? "grid-cols-[56px_repeat(7,1fr)]" : "grid-cols-[56px_1fr]";

  return (
    <div className="flex-1 min-h-0 bg-[#090e18]/80 border border-slate-900 rounded-2xl overflow-hidden flex flex-col">
      {/* ponytail: sticky header inside scroll so scrollbar doesn't desync week cols */}
      <div className="flex-1 min-h-0 overflow-y-auto dashboard-scroll">
        <div
          className={`sticky top-0 z-20 grid border-b border-slate-900 bg-slate-950 ${cols}`}
        >
          <div className="border-r border-slate-900" />
          {days.map((cell) => {
            const date = parseDateStr(cell.dateStr);
            const weekday = WEEKDAY_LABELS[date.getDay()];
            const isSelected = selectedDate === cell.dateStr;
            const isToday = cell.dateStr === todayStr;
            const dayPlan = dayPlansByDate.get(cell.dateStr);
            const dayPlanStyle = dayPlan ? getDayPlanStyle(dayPlan.type) : null;

            return (
              <button
                key={cell.dateStr}
                type="button"
                onClick={() => onSelectDate(cell.dateStr)}
                className={`py-2 px-1 text-center border-r border-slate-900/60 transition cursor-pointer ${
                  dayPlanStyle
                    ? `${dayPlanStyle.cellBg} border-l-[3px] ${dayPlanStyle.accent}`
                    : isSelected
                      ? "bg-blue-600/10"
                      : "hover:bg-slate-900/40"
                } ${isSelected ? "ring-2 ring-inset ring-orange-500/50" : ""}`}
              >
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  {weekday}
                </div>
                <div className="mt-1 flex items-center justify-center gap-1.5">
                  <div
                    className={`h-7 w-7 flex items-center justify-center rounded-full text-sm font-black ${
                      isToday
                        ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                        : "text-slate-200"
                    }`}
                  >
                    {cell.day}
                  </div>
                  {dayPlanStyle && (
                    <span
                      className={`h-2 w-2 rounded-full ${dayPlanStyle.dot} shadow-sm flex-shrink-0`}
                    />
                  )}
                </div>
                {dayPlanStyle && (
                  <div
                    className={`mt-1 mx-auto max-w-full px-1.5 py-0.5 rounded text-[7.5px] font-black uppercase tracking-wide border truncate ${dayPlanStyle.badge}`}
                  >
                    {dayPlanStyle.label}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <div className={`grid ${cols}`} style={{ minHeight: gridHeight }}>
          <div className="border-r border-slate-900 bg-slate-950/80">
            {hours.map((hour) => (
              <div
                key={hour}
                className="pr-2 text-right text-[10px] font-bold text-slate-500 border-b border-slate-900/40"
                style={{ height: SCHEDULE_HOUR_HEIGHT }}
              >
                <span className="relative -top-2">
                  {hour === SCHEDULE_HOUR_START || hour % 2 === 0
                    ? `${hour > 12 ? hour - 12 : hour === 0 ? 12 : hour} ${hour >= 12 ? "PM" : "AM"}`
                    : ""}
                </span>
              </div>
            ))}
          </div>

          {days.map((cell) => {
            const dayEvents = eventsByDate.get(cell.dateStr) ?? [];
            const isSelected = selectedDate === cell.dateStr;
            const dayPlan = dayPlansByDate.get(cell.dateStr);
            const dayPlanStyle = dayPlan ? getDayPlanStyle(dayPlan.type) : null;
            const columnBg = dayPlanStyle
              ? dayPlanStyle.cellBg
              : isSelected
                ? "bg-blue-600/5"
                : "bg-[#090e18]/40";

            return (
              <div
                key={cell.dateStr}
                className={`relative border-r border-slate-900/60 ${columnBg} ${
                  dayPlanStyle ? `border-l-[3px] ${dayPlanStyle.accent}` : ""
                } ${isSelected && !dayPlanStyle ? "ring-1 ring-inset ring-orange-500/40" : ""}`}
                style={{ height: gridHeight }}
              >
                {hours.map((hour) => (
                  <div
                    key={hour}
                    className="border-b border-slate-900/40"
                    style={{ height: SCHEDULE_HOUR_HEIGHT }}
                  />
                ))}

                {dayEvents.map((event) => {
                  const style = getEventStyle(event.type);
                  const position = getEventTimePosition(event.startTime, event.endTime);

                  return (
                    <div
                      key={event.id}
                      className={`absolute left-1 right-1 rounded-md border px-2 py-1 overflow-hidden shadow-sm ${style.bg}`}
                      style={{
                        top: `${position.top}%`,
                        height: `${position.height}%`,
                        zIndex: 10,
                      }}
                    >
                      <p className="text-[10px] font-black truncate uppercase leading-tight">
                        {event.title}
                      </p>
                      <p className="text-[9px] font-mono text-slate-400 truncate">
                        {event.startTime} – {event.endTime}
                      </p>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
