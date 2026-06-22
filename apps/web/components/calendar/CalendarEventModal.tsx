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
}) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-[#000]/70 flex items-center justify-center p-4 z-50 backdrop-blur-sm select-none">
      <div className="w-full max-w-md rounded-2xl bg-[#090e18] border border-slate-900 p-6 shadow-2xl relative font-sans">
        <h3 className="text-md font-bold text-slate-100 border-b border-slate-900 pb-3 mb-4 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-blue-500" />
          <span>Add Calendar Schedule</span>
        </h3>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1">
            <label
              htmlFor="event-title"
              className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block"
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
              className="w-full px-3 py-2 text-xs font-semibold bg-slate-950 border border-slate-900 rounded-lg text-slate-200 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800"
            />
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <label
                htmlFor="event-date"
                className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block"
              >
                Date
              </label>
              <input
                id="event-date"
                type="date"
                required
                value={eventDate}
                onChange={(e) => onDateChange(e.target.value)}
                className="w-full px-3 py-2 text-xs font-sans bg-slate-950 border border-slate-900 rounded-lg text-slate-200 focus:outline-none focus:border-slate-800"
              />
            </div>
            <div className="space-y-1">
              <label
                htmlFor="event-type"
                className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block"
              >
                Event Category
              </label>
              <select
                id="event-type"
                value={type}
                onChange={(e) => onTypeChange(e.target.value as EventType)}
                className="w-full px-3 py-2 text-xs font-semibold bg-slate-950 border border-slate-900 rounded-lg text-slate-200 focus:outline-none focus:border-slate-800"
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
                className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block"
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
                className="w-full px-3 py-2 text-xs font-sans bg-slate-950 border border-slate-900 rounded-lg text-slate-200 focus:outline-none focus:border-slate-800"
              />
            </div>
            <div className="space-y-1">
              <label
                htmlFor="event-end"
                className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block"
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
                className="w-full px-3 py-2 text-xs font-sans bg-slate-950 border border-slate-900 rounded-lg text-slate-200 focus:outline-none focus:border-slate-800"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label
              htmlFor="event-location"
              className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block"
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
              className="w-full px-3 py-2 text-xs font-semibold bg-slate-950 border border-slate-900 rounded-lg text-slate-200 focus:outline-none focus:border-slate-800"
            />
          </div>

          <div className="space-y-1">
            <label
              htmlFor="event-description"
              className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block"
            >
              Task Notes
            </label>
            <textarea
              id="event-description"
              placeholder="Goals, target benchmarks, components needed..."
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 text-xs font-semibold bg-slate-950 border border-slate-900 rounded-lg text-slate-200 focus:outline-none focus:border-slate-800"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-900">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-[#0e1724] hover:bg-slate-900 text-xs font-semibold text-slate-400 hover:text-white transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shadow-lg cursor-pointer"
            >
              Save Schedule
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

