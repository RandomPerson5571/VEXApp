"use client";

import { Calendar } from "lucide-react";
import type { CalendarViewMode } from "./calendarTypes";

export function CalendarEmptyView({
  viewType,
  onReturnToMonth,
}: {
  viewType: Exclude<CalendarViewMode, "month">;
  onReturnToMonth: () => void;
}) {
  return (
    <div className="flex-grow flex items-center justify-center border border-slate-200 dark:border-slate-900 bg-white dark:bg-[#090e18]/40 rounded-xl p-12 text-center">
      <div>
        <Calendar className="h-10 w-10 text-slate-500 mx-auto mb-3" />
        <p className="text-sm font-bold text-slate-800 dark:text-slate-300 capitalize">{viewType} scheduling grid view.</p>
        <p className="text-xs text-slate-600 dark:text-slate-500 mt-1">Please refer directly to Month View grid format logs.</p>
        <button
          type="button"
          onClick={onReturnToMonth}
          className="mt-4 px-3.5 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-xs font-bold text-white transition cursor-pointer"
        >
          Return to Month View
        </button>
      </div>
    </div>
  );
}

