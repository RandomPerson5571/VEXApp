"use client";

import {
  AlertCircle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Plus,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { CalendarEvent, EventType } from "@/lib/types/team";
import {
  formatMonthYear,
  formatSelectedDayLabel,
  getDaysInMonth,
  getEventStyle,
  getTodayDateStr,
} from "@/lib/utils/calendar";

type CalendarViewMode = "month" | "week" | "day";

const VIEW_MODES: CalendarViewMode[] = ["month", "week", "day"];
const WEEKDAY_LABELS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

const DEFAULT_LOCATION = "Iron Reign Workshop";

export interface CalendarViewProps {
  initialEvents: CalendarEvent[];
  initialSelectedDate?: string;
  onActivityLog?: (text: string, subtext: string, type: "schedule") => void;
}

export function CalendarView({
  initialEvents,
  initialSelectedDate = "2025-05-14",
  onActivityLog,
}: CalendarViewProps) {
  const [events, setEvents] = useState(initialEvents);
  const [viewType, setViewType] = useState<CalendarViewMode>("month");
  const [currentMonth, setCurrentMonth] = useState(() => {
    const [year, month] = initialSelectedDate.split("-").map(Number);
    return new Date(year, month - 1, 1);
  });
  const [selectedDate, setSelectedDate] = useState(initialSelectedDate);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [title, setTitle] = useState("");
  const [eventDate, setEventDate] = useState(initialSelectedDate);
  const [startTime, setStartTime] = useState("4:30 PM");
  const [endTime, setEndTime] = useState("6:30 PM");
  const [type, setType] = useState<EventType>("build");
  const [location, setLocation] = useState(DEFAULT_LOCATION);
  const [description, setDescription] = useState("");

  const todayStr = getTodayDateStr();

  const calendarDays = useMemo(
    () => getDaysInMonth(currentMonth.getFullYear(), currentMonth.getMonth()),
    [currentMonth],
  );

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const event of events) {
      const existing = map.get(event.date) ?? [];
      map.set(event.date, [...existing, event]);
    }
    return map;
  }, [events]);

  const selectedDayEvents = eventsByDate.get(selectedDate) ?? [];

  const shiftMonth = (delta: number) => {
    setCurrentMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1),
    );
  };

  const openAddEventModal = () => {
    setEventDate(selectedDate);
    setIsModalOpen(true);
  };

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newEvent: CalendarEvent = {
      id: `ev-${Date.now()}`,
      title: title.trim(),
      date: eventDate,
      startTime,
      endTime,
      type,
      location,
      description: description.trim() || undefined,
    };

    setEvents((prev) => [...prev, newEvent]);
    onActivityLog?.(`Event scheduled`, `${title.trim()} set on ${eventDate}`, "schedule");
    setIsModalOpen(false);
    setTitle("");
    setDescription("");
  };

  return (
    <div className="flex-1 flex overflow-hidden bg-[#03070e] font-sans">
      <div className="flex-1 overflow-y-auto px-8 py-6 flex flex-col h-full dashboard-scroll border-r border-slate-900/60">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-black text-slate-100 tracking-tight">Team Calendar</h1>
            <p className="text-xs text-slate-400 font-semibold mt-1">
              Configure meeting schedules, build blocks, and coordinate competition timelines.
            </p>
          </div>

          <div className="flex items-center gap-1 bg-slate-950 p-1 border border-slate-900 rounded-lg self-start sm:self-center">
            {VIEW_MODES.map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setViewType(mode)}
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
        </div>

        <div className="flex items-center justify-between bg-[#090e18] border border-slate-900 p-4.5 rounded-xl mb-5 shadow-sm">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => shiftMonth(-1)}
              className="p-1 px-2.5 rounded bg-slate-950 hover:bg-slate-900 text-slate-400 border border-slate-900 cursor-pointer"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => shiftMonth(1)}
              className="p-1 px-2.5 rounded bg-slate-950 hover:bg-slate-900 text-slate-400 border border-slate-900 cursor-pointer"
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <span className="text-sm font-black text-slate-200 ml-2 font-sans">
              {formatMonthYear(currentMonth)}
            </span>
          </div>

          <button
            type="button"
            onClick={openAddEventModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition cursor-pointer shadow-lg shadow-blue-500/10"
          >
            <Plus className="h-4 w-4" />
            <span>Add Event</span>
          </button>
        </div>

        {viewType === "month" ? (
          <div className="flex-1 bg-[#090e18]/80 border border-slate-900 rounded-2xl overflow-hidden flex flex-col min-h-[450px]">
            <div className="grid grid-cols-7 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest py-3 border-b border-slate-900 bg-slate-950">
              {WEEKDAY_LABELS.map((day) => (
                <div key={day}>{day}</div>
              ))}
            </div>

            <div className="flex-1 grid grid-cols-7 divide-x divide-y divide-slate-900/60 bg-[#090e18]/40">
              {calendarDays.map((cell) => {
                const dayEvents = eventsByDate.get(cell.dateStr) ?? [];
                const isSelected = selectedDate === cell.dateStr;
                const isToday = cell.dateStr === todayStr;

                return (
                  <button
                    key={cell.dateStr}
                    type="button"
                    onClick={() => setSelectedDate(cell.dateStr)}
                    className={`min-h-[85px] p-2 flex flex-col justify-between transition relative text-xs cursor-pointer select-none group border-slate-900/60 text-left ${
                      cell.isCurrentMonth ? "bg-slate-950/20" : "bg-slate-950/60 opacity-40"
                    } ${
                      isSelected
                        ? "bg-blue-600/10 border-2 border-blue-500/40 z-10"
                        : "hover:bg-slate-900/40"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`h-6 w-6 font-bold font-sans flex items-center justify-center rounded-full ${
                          isToday
                            ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                            : "text-slate-350"
                        }`}
                      >
                        {cell.day}
                      </span>
                    </div>

                    <div className="flex-1 overflow-y-auto mt-2 space-y-1 dashboard-scroll max-h-[50px]">
                      {dayEvents.map((ev) => {
                        const style = getEventStyle(ev.type);
                        return (
                          <div
                            key={ev.id}
                            className={`px-1.5 py-0.5 rounded text-[8.5px] font-bold border truncate flex items-center gap-1 uppercase ${style.bg}`}
                          >
                            <span className={`h-1 w-1 rounded-full ${style.dot} flex-shrink-0`} />
                            <span className="truncate">{ev.title}</span>
                          </div>
                        );
                      })}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="flex-grow flex items-center justify-center border border-slate-900 bg-[#090e18]/40 rounded-xl p-12 text-center">
            <div>
              <Calendar className="h-10 w-10 text-slate-500 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-350 capitalize">{viewType} scheduling grid view.</p>
              <p className="text-xs text-slate-500 mt-1">
                Please refer directly to Month View grid format logs.
              </p>
              <button
                type="button"
                onClick={() => setViewType("month")}
                className="mt-4 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition cursor-pointer"
              >
                Return to Month View
              </button>
            </div>
          </div>
        )}
      </div>

      <aside className="w-[320px] bg-[#070b13] flex flex-col h-full border-l border-slate-900 p-6 select-none font-sans justify-between">
        <div className="space-y-6 flex-1 overflow-y-auto dashboard-scroll">
          <div className="border-b border-slate-900 pb-3">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
              Selected Day Schedule
            </h3>
            <p className="text-xs font-bold text-slate-150 leading-tight mt-2.5 font-sans pr-1 break-words">
              {formatSelectedDayLabel(selectedDate)}
            </p>
          </div>

          <div className="space-y-4">
            {selectedDayEvents.length === 0 ? (
              <div className="p-8 text-center rounded-xl border border-slate-900 bg-slate-950/40 text-xs">
                <AlertCircle className="h-5 w-5 text-slate-600 mx-auto mb-2" />
                <p className="font-semibold text-slate-400">Empty checklist schedule.</p>
                <p className="text-[10px] text-slate-600 mt-1">
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
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold font-mono">
                        <Clock className="h-3 w-3 text-slate-500" />
                        <span>{ev.startTime}</span>
                      </div>
                    </div>

                    <h4 className="text-sm font-extrabold text-slate-100 pr-1">{ev.title}</h4>

                    {ev.location && (
                      <div className="flex items-center gap-1.5 text-[10.5px] text-slate-400 font-semibold mt-1">
                        <MapPin className="h-3 w-3 text-slate-600" />
                        <span className="truncate">{ev.location}</span>
                      </div>
                    )}

                    {ev.description && (
                      <p className="text-[10px] text-slate-500 leading-normal border-t border-slate-900/50 pt-2">
                        {ev.description}
                      </p>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="pt-6 border-t border-slate-900">
          <button
            type="button"
            onClick={openAddEventModal}
            className="w-full py-2.5 rounded-lg border border-slate-900 text-slate-300 font-black text-xs hover:border-slate-800 hover:text-white transition flex items-center justify-center gap-1.5 bg-slate-950"
          >
            <Plus className="h-4.5 w-4.5 text-blue-500" />
            <span>Schedule Event Entry</span>
          </button>
        </div>
      </aside>

      {isModalOpen && (
        <div className="fixed inset-0 bg-[#000]/70 flex items-center justify-center p-4 z-50 backdrop-blur-sm select-none">
          <div className="w-full max-w-md rounded-2xl bg-[#090e18] border border-slate-900 p-6 shadow-2xl relative font-sans">
            <h3 className="text-md font-bold text-slate-100 border-b border-slate-900 pb-3 mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-500" />
              <span>Add Calendar Schedule</span>
            </h3>

            <form onSubmit={handleAddEvent} className="space-y-4">
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
                  onChange={(e) => setTitle(e.target.value)}
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
                    onChange={(e) => setEventDate(e.target.value)}
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
                    onChange={(e) => setType(e.target.value as EventType)}
                    className="w-full px-3 py-2 text-xs font-semibold bg-slate-950 border border-slate-900 rounded-lg text-slate-200 focus:outline-none focus:border-slate-800"
                  >
                    <option value="build">Build Session</option>
                    <option value="practice_match">Practice Match</option>
                    <option value="scrimmage">VEX Scrimmage</option>
                    <option value="championship">Championship</option>
                    <option value="meeting">General Meeting</option>
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
                    onChange={(e) => setStartTime(e.target.value)}
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
                    onChange={(e) => setEndTime(e.target.value)}
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
                  onChange={(e) => setLocation(e.target.value)}
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
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 text-xs font-semibold bg-slate-950 border border-slate-900 rounded-lg text-slate-200 focus:outline-none focus:border-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-900">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
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
      )}
    </div>
  );
}
