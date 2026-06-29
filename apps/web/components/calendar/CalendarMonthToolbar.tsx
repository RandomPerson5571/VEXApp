"use client";

import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { formatMonthYear } from "@/lib/utils/calendar";

export function CalendarMonthToolbar({
  currentMonth,
  onPreviousMonth,
  onNextMonth,
  onAddEvent,
}: {
  currentMonth: Date;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onAddEvent: () => void;
}) {
  return (
    <div className="flex items-center justify-between bg-white dark:bg-[#090e18] border border-slate-200 dark:border-slate-900 p-4.5 rounded-xl mb-5 shadow-sm">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onPreviousMonth}
          className="p-1 px-2.5 rounded bg-white dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-900 cursor-pointer"
          aria-label="Previous month"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onNextMonth}
          className="p-1 px-2.5 rounded bg-white dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-900 cursor-pointer"
          aria-label="Next month"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
        <span className="text-sm font-black text-slate-900 dark:text-slate-200 ml-2 font-sans">
          {formatMonthYear(currentMonth)}
        </span>
      </div>

      <button
        type="button"
        onClick={onAddEvent}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-xs font-bold text-white transition cursor-pointer shadow-lg shadow-orange-500/10"
      >
        <Plus className="h-4 w-4" />
        <span>Add Event</span>
      </button>
    </div>
  );
}

