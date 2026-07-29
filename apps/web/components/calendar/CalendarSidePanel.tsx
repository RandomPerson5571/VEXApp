"use client";

import { AlertCircle, Clock, MapPin, Plus, UserRound, X } from "lucide-react";
import { DayPlanIcon } from "@/components/calendar/DayPlanIcon";
import type { CalendarEvent, DayPlanType, TeamDayPlan } from "@/lib/types/team";
import {
  formatSelectedDayLabel,
  getDayPlanStyle,
  getEventStyle,
} from "@/lib/utils/calendar";

const DAY_PLAN_TYPES: DayPlanType[] = ["build", "coding", "testing"];

export function CalendarSidePanel({
  selectedDate,
  selectedDayPlan,
  selectedDayEvents,
  isDayPlanPending,
  onSetDayPlan,
  onClearDayPlan,
  onAddEvent,
  onEventClick,
  onClose,
  className = "",
}: {
  selectedDate: string;
  selectedDayPlan?: TeamDayPlan;
  selectedDayEvents: CalendarEvent[];
  isDayPlanPending: boolean;
  onSetDayPlan: (type: DayPlanType) => void;
  onClearDayPlan: () => void;
  onAddEvent: () => void;
  onEventClick: (event: CalendarEvent) => void;
  onClose?: () => void;
  className?: string;
}) {
  const handleDayPlanClick = (type: DayPlanType) => {
    if (selectedDayPlan?.type === type) {
      onClearDayPlan();
      return;
    }

    onSetDayPlan(type);
  };

  return (
    <aside
      className={`flex h-full w-full flex-col justify-between border-l border-slate-200 bg-white p-6 font-sans select-none dark:border-[#1a1a1a] dark:bg-[#0a0a0a] lg:w-[320px] ${className}`}
    >
      <div className="space-y-6 flex-1 overflow-y-auto dashboard-scroll">
        <div className="border-b border-slate-200 pb-3 dark:border-[#1a1a1a]">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">
                Selected Day Schedule
              </h3>
              <p className="mt-2.5 break-words pr-1 font-sans text-xs font-bold leading-tight text-slate-900 dark:text-slate-100">
                {formatSelectedDayLabel(selectedDate)}
              </p>
            </div>
            {onClose ? (
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-slate-900 lg:hidden dark:border-[#1a1a1a] dark:hover:text-slate-200"
                aria-label="Close day schedule"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">
              Day Focus
            </h4>
            {selectedDayPlan && (
              <button
                type="button"
                onClick={onClearDayPlan}
                className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 transition"
              >
                <X className="h-3 w-3" />
                Clear
              </button>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2">
            {DAY_PLAN_TYPES.map((type) => {
              const style = getDayPlanStyle(type);
              const isActive = selectedDayPlan?.type === type;

              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleDayPlanClick(type)}
                  className={`flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl border-2 text-[11px] font-black uppercase tracking-wide transition-all duration-200 cursor-pointer ${
                    isActive ? style.buttonActive : style.button
                  } ${isDayPlanPending ? "opacity-80" : ""}`}
                >
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full ${isActive ? "bg-white/15 ring-2 ring-white/30" : "bg-black/5 dark:bg-white/5"}`}
                  >
                    <DayPlanIcon
                      type={type}
                      className="h-3.5 w-3.5"
                      decorative
                    />
                  </span>
                  {style.label}
                </button>
              );
            })}
          </div>

          {selectedDayPlan && (
            <div
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${getDayPlanStyle(selectedDayPlan.type).badge}`}
            >
              <DayPlanIcon
                type={selectedDayPlan.type}
                className="h-3.5 w-3.5"
                decorative
              />
              <p className="text-[10px] font-semibold leading-snug">
                Team focus:{" "}
                <span className="font-black">
                  {getDayPlanStyle(selectedDayPlan.type).label}
                </span>{" "}
                — tap again to clear
              </p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {selectedDayEvents.length === 0 ? (
            <div className="p-8 text-center rounded-xl border border-slate-200 dark:border-[#1a1a1a] bg-slate-50 dark:bg-[#121212]/40 text-xs">
              <AlertCircle className="h-5 w-5 text-slate-500 dark:text-slate-600 mx-auto mb-2" />
              <p className="font-semibold text-slate-700 dark:text-slate-400">
                Empty checklist schedule.
              </p>
              <p className="text-[10px] text-slate-600 dark:text-slate-600 mt-1">
                No activities listed. Try adding an event to organize your day.
              </p>
            </div>
          ) : (
            selectedDayEvents.map((ev) => {
              const style = getEventStyle(ev.type);
              return (
                <button
                  key={ev.id}
                  type="button"
                  onClick={() => onEventClick(ev)}
                  className={`p-4 rounded-xl border flex flex-col gap-2.5 shadow-md text-left cursor-pointer transition hover:brightness-[0.97] dark:hover:brightness-110 ${style.bg}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] uppercase tracking-widest font-black leading-none">
                      {ev.type.replace("_", " ")}
                    </span>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-600 dark:text-slate-400 font-bold font-mono">
                      <Clock className="h-3 w-3 text-slate-500" />
                      <span>{ev.startTime}</span>
                    </div>
                  </div>

                  <h4 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 pr-1">
                    {ev.title}
                  </h4>

                  {ev.location && (
                    <div className="flex items-center gap-1.5 text-[10.5px] text-slate-600 dark:text-slate-400 font-semibold mt-1">
                      <MapPin className="h-3 w-3 text-slate-500 dark:text-slate-600" />
                      <span className="truncate">{ev.location}</span>
                    </div>
                  )}

                  {ev.createdBy && (
                    <div className="flex items-center gap-1.5 text-[10.5px] text-slate-600 dark:text-slate-400 font-semibold">
                      <UserRound className="h-3 w-3 text-slate-500 dark:text-slate-600" />
                      <span className="truncate">{ev.createdBy}</span>
                    </div>
                  )}

                  {ev.description && (
                    <p className="text-[10px] text-slate-600 dark:text-slate-500 leading-normal border-t border-slate-200 dark:border-[#1a1a1a]/50 pt-2">
                      {ev.description}
                    </p>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      <div className="pt-6 border-t border-slate-200 dark:border-[#1a1a1a]">
        <button
          type="button"
          onClick={onAddEvent}
          className="w-full py-2.5 rounded-lg border border-slate-200 dark:border-[#1a1a1a] text-slate-700 dark:text-slate-300 font-black text-xs hover:border-slate-300 dark:hover:border-slate-800 hover:text-slate-900 dark:hover:text-white transition flex items-center justify-center gap-1.5 bg-white dark:bg-[#121212]"
        >
          <Plus className="h-4.5 w-4.5 text-orange-500" />
          <span>Schedule Event Entry</span>
        </button>
      </div>
    </aside>
  );
}
