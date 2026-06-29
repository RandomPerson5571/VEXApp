"use client";

import { AlertCircle, Clock, MapPin, Plus } from "lucide-react";
import type { CalendarEvent } from "@/lib/types/team";
import { formatSelectedDayLabel, getEventStyle } from "@/lib/utils/calendar";

export function CalendarSidePanel({
  selectedDate,
  selectedDayEvents,
  onAddEvent,
}: {
  selectedDate: string;
  selectedDayEvents: CalendarEvent[];
  onAddEvent: () => void;
}) {
  return (
    <aside className="w-[320px] bg-white dark:bg-[#070b13] flex flex-col h-full border-l border-slate-200 dark:border-slate-900 p-6 select-none font-sans justify-between">
      <div className="space-y-6 flex-1 overflow-y-auto dashboard-scroll">
        <div className="border-b border-slate-200 dark:border-slate-900 pb-3">
          <h3 className="text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">
            Selected Day Schedule
          </h3>
          <p className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight mt-2.5 font-sans pr-1 break-words">
            {formatSelectedDayLabel(selectedDate)}
          </p>
        </div>

        <div className="space-y-4">
          {selectedDayEvents.length === 0 ? (
            <div className="p-8 text-center rounded-xl border border-slate-200 dark:border-slate-900 bg-slate-50 dark:bg-slate-950/40 text-xs">
              <AlertCircle className="h-5 w-5 text-slate-500 dark:text-slate-600 mx-auto mb-2" />
              <p className="font-semibold text-slate-700 dark:text-slate-400">Empty checklist schedule.</p>
              <p className="text-[10px] text-slate-600 dark:text-slate-600 mt-1">
                No activities listed. Try adding an event to organize your day.
              </p>
            </div>
          ) : (
            selectedDayEvents.map((ev) => {
              const style = getEventStyle(ev.type);
              return (
                <div
                  key={ev.id}
                  className={`p-4 rounded-xl border flex flex-col gap-2.5 shadow-md ${style.bg}`}
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

                  <h4 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 pr-1">{ev.title}</h4>

                  {ev.location && (
                    <div className="flex items-center gap-1.5 text-[10.5px] text-slate-600 dark:text-slate-400 font-semibold mt-1">
                      <MapPin className="h-3 w-3 text-slate-500 dark:text-slate-600" />
                      <span className="truncate">{ev.location}</span>
                    </div>
                  )}

                  {ev.description && (
                    <p className="text-[10px] text-slate-600 dark:text-slate-500 leading-normal border-t border-slate-200 dark:border-slate-900/50 pt-2">
                      {ev.description}
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="pt-6 border-t border-slate-200 dark:border-slate-900">
        <button
          type="button"
          onClick={onAddEvent}
          className="w-full py-2.5 rounded-lg border border-slate-200 dark:border-slate-900 text-slate-700 dark:text-slate-300 font-black text-xs hover:border-slate-300 dark:hover:border-slate-800 hover:text-slate-900 dark:hover:text-white transition flex items-center justify-center gap-1.5 bg-white dark:bg-slate-950"
        >
          <Plus className="h-4.5 w-4.5 text-orange-500" />
          <span>Schedule Event Entry</span>
        </button>
      </div>
    </aside>
  );
}

