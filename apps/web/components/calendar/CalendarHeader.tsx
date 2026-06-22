"use client";

import { CalendarModeTabs } from "./CalendarModeTabs";
import type { CalendarViewMode } from "./calendarTypes";

export function CalendarHeader({
  viewType,
  onViewTypeChange,
}: {
  viewType: CalendarViewMode;
  onViewTypeChange: (mode: CalendarViewMode) => void;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-black text-slate-100 tracking-tight">Team Calendar</h1>
        <p className="text-xs text-slate-400 font-semibold mt-1">
          Configure meeting schedules, build blocks, and coordinate competition timelines.
        </p>
      </div>

      <CalendarModeTabs viewType={viewType} onChange={onViewTypeChange} />
    </div>
  );
}

