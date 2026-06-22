"use client";

import type { CalendarViewMode } from "./calendarTypes";
import { VIEW_MODES } from "./calendarTypes";

export function CalendarModeTabs({
  viewType,
  onChange,
}: {
  viewType: CalendarViewMode;
  onChange: (mode: CalendarViewMode) => void;
}) {
  return (
    <div className="flex items-center gap-1 bg-slate-950 p-1 border border-slate-900 rounded-lg self-start sm:self-center">
      {VIEW_MODES.map((mode) => (
        <button
          key={mode}
          type="button"
          onClick={() => onChange(mode)}
          className={`px-3 py-1 rounded text-xs font-bold capitalize transition cursor-pointer ${
            viewType === mode
              ? "bg-blue-600 text-white shadow"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          {mode}
        </button>
      ))}
    </div>
  );
}

