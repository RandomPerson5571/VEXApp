"use client";

import type { FormEvent } from "react";
import { Calendar } from "lucide-react";
import type { EventType } from "@/lib/types/team";

const EVENT_TYPE_OPTIONS: { value: EventType; label: string }[] = [
  { value: "build", label: "Build Session" },
  { value: "practice_match", label: "Practice Match" },
  { value: "scrimmage", label: "VEX Scrimmage" },
  { value: "championship", label: "Championship" },
  { value: "meeting", label: "General Meeting" },
];

export function CalendarEventModal({
  isOpen,
  title,
  eventDate,
  startTime,
  endTime,
  type,
  location,
  description,
  onTitleChange,
  onDateChange,
  onStartTimeChange,
  onEndTimeChange,
  onTypeChange,
  onLocationChange,
  onDescriptionChange,
  onClose,
  onSubmit,
  isSubmitting = false,
  error,
}: {
  isOpen: boolean;
  title: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  type: EventType;
  location: string;
  description: string;
  onTitleChange: (value: string) => void;
  onDateChange: (value: string) => void;
  onStartTimeChange: (value: string) => void;
  onEndTimeChange: (value: string) => void;
  onTypeChange: (value: EventType) => void;
  onLocationChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  isSubmitting?: boolean;
  error?: string;
}) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-slate-950/40 dark:bg-[#000]/70 flex items-center justify-center p-4 z-50 backdrop-blur-sm select-none">
      <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 font-sans dark:border-[#1a1a1a] dark:bg-[#0a0a0a] dark:bg-gradient-to-b dark:from-white/[0.02] dark:to-transparent">
        <h3 className="text-md font-bold text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-[#1a1a1a] pb-3 mb-4 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-orange-500" />
          <span>Add Calendar Schedule</span>
        </h3>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1">
            <label
              htmlFor="event-title"
              className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest block"
            >
              Event Title
            </label>
            <input
              id="event-title"
              type="text"
              required
              placeholder="e.g. Chassis Assembly Redesign"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold bg-white dark:bg-[#121212] border border-slate-200 dark:border-[#1a1a1a] rounded-lg text-slate-900 dark:text-slate-200 focus:outline-none focus:border-orange-500 dark:focus:border-[#1a1a1a] focus:ring-1 focus:ring-orange-500 dark:focus:ring-slate-800"
            />
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <label
                htmlFor="event-date"
                className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest block"
              >
                Date
              </label>
              <input
                id="event-date"
                type="date"
                required
                value={eventDate}
                onChange={(e) => onDateChange(e.target.value)}
                className="w-full px-3 py-2 text-xs font-sans bg-white dark:bg-[#121212] border border-slate-200 dark:border-[#1a1a1a] rounded-lg text-slate-900 dark:text-slate-200 focus:outline-none focus:border-orange-500 dark:focus:border-[#1a1a1a]"
              />
            </div>
            <div className="space-y-1">
              <label
                htmlFor="event-type"
                className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest block"
              >
                Event Category
              </label>
              <select
                id="event-type"
                value={type}
                onChange={(e) => onTypeChange(e.target.value as EventType)}
                className="w-full px-3 py-2 text-xs font-semibold bg-white dark:bg-[#121212] border border-slate-200 dark:border-[#1a1a1a] rounded-lg text-slate-900 dark:text-slate-200 focus:outline-none focus:border-orange-500 dark:focus:border-[#1a1a1a]"
              >
                {EVENT_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <label
                htmlFor="event-start"
                className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest block"
              >
                Start Time
              </label>
              <input
                id="event-start"
                type="text"
                required
                placeholder="e.g. 4:30 PM"
                value={startTime}
                onChange={(e) => onStartTimeChange(e.target.value)}
                className="w-full px-3 py-2 text-xs font-sans bg-white dark:bg-[#121212] border border-slate-200 dark:border-[#1a1a1a] rounded-lg text-slate-900 dark:text-slate-200 focus:outline-none focus:border-orange-500 dark:focus:border-[#1a1a1a]"
              />
            </div>
            <div className="space-y-1">
              <label
                htmlFor="event-end"
                className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest block"
              >
                End Time
              </label>
              <input
                id="event-end"
                type="text"
                required
                placeholder="e.g. 6:30 PM"
                value={endTime}
                onChange={(e) => onEndTimeChange(e.target.value)}
                className="w-full px-3 py-2 text-xs font-sans bg-white dark:bg-[#121212] border border-slate-200 dark:border-[#1a1a1a] rounded-lg text-slate-900 dark:text-slate-200 focus:outline-none focus:border-orange-500 dark:focus:border-[#1a1a1a]"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label
              htmlFor="event-location"
              className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest block"
            >
              Location Room
            </label>
            <input
              id="event-location"
              type="text"
              required
              placeholder="e.g. Room 404 Workshop"
              value={location}
              onChange={(e) => onLocationChange(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold bg-white dark:bg-[#121212] border border-slate-200 dark:border-[#1a1a1a] rounded-lg text-slate-900 dark:text-slate-200 focus:outline-none focus:border-orange-500 dark:focus:border-[#1a1a1a]"
            />
          </div>

          <div className="space-y-1">
            <label
              htmlFor="event-description"
              className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest block"
            >
              Task Notes
            </label>
            <textarea
              id="event-description"
              placeholder="Goals, target benchmarks, components needed..."
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 text-xs font-semibold bg-white dark:bg-[#121212] border border-slate-200 dark:border-[#1a1a1a] rounded-lg text-slate-900 dark:text-slate-200 focus:outline-none focus:border-orange-500 dark:focus:border-[#1a1a1a]"
            />
          </div>

          {error ? (
            <p className="text-xs font-semibold text-red-500">{error}</p>
          ) : null}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-[#1a1a1a]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-[#121212] hover:bg-slate-200 dark:hover:bg-[#121212] text-xs font-semibold text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-xs font-bold text-white shadow-lg cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : "Save Schedule"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

