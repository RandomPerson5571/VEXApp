"use client";

import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import type { CalendarViewMode } from "./calendarTypes";

export function CalendarMonthToolbar({
  label,
  viewType,
  onPrevious,
  onNext,
  onAddEvent,
}: {
  label: string;
  viewType: CalendarViewMode;
  onPrevious: () => void;
  onNext: () => void;
  onAddEvent: () => void;
}) {
  const previousLabel =
    viewType === "month" ? "Previous month" : viewType === "week" ? "Previous week" : "Previous day";
  const nextLabel =
    viewType === "month" ? "Next month" : viewType === "week" ? "Next week" : "Next day";

  return (
    <div className="flex items-center justify-between bg-[#090e18] border border-slate-900 p-4.5 rounded-xl mb-5 shadow-sm">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onPrevious}
          className="p-1 px-2.5 rounded bg-slate-950 hover:bg-slate-900 text-slate-400 border border-slate-900 cursor-pointer"
          aria-label={previousLabel}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onNext}
          className="p-1 px-2.5 rounded bg-slate-950 hover:bg-slate-900 text-slate-400 border border-slate-900 cursor-pointer"
          aria-label={nextLabel}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
        <span className="text-sm font-black text-slate-200 ml-2 font-sans">{label}</span>
      </div>

      <button
        type="button"
        onClick={onAddEvent}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition cursor-pointer shadow-lg shadow-blue-500/10"
      >
        <Plus className="h-4 w-4" />
        <span>Add Event</span>
      </button>
    </div>
  );
}

