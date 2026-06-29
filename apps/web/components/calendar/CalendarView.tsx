"use client";

import { useMemo, useState } from "react";
import type { CalendarEvent, EventType } from "@/lib/types/team";
import { getDaysInMonth, getTodayDateStr } from "@/lib/utils/calendar";
import { CalendarEmptyView } from "./CalendarEmptyView";
import { CalendarEventModal } from "./CalendarEventModal";
import { CalendarHeader } from "./CalendarHeader";
import { CalendarMonthGrid } from "./CalendarMonthGrid";
import { CalendarMonthToolbar } from "./CalendarMonthToolbar";
import { CalendarSidePanel } from "./CalendarSidePanel";
import type { CalendarViewMode } from "./calendarTypes";

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

  const handleAddEvent = (e: React.FormEvent<HTMLFormElement>) => {
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
    onActivityLog?.(
      `Event scheduled`,
      `${title.trim()} set on ${eventDate}`,
      "schedule",
    );
    setIsModalOpen(false);
    setTitle("");
    setDescription("");
  };

  return (
    <div className="flex-1 flex overflow-hidden bg-slate-50 dark:bg-[#03070e] font-sans">
      <div className="flex-1 overflow-y-auto px-8 py-6 flex flex-col h-full dashboard-scroll border-r border-slate-200 dark:border-slate-900/60">
        <CalendarHeader viewType={viewType} onViewTypeChange={setViewType} />
        <CalendarMonthToolbar
          currentMonth={currentMonth}
          onPreviousMonth={() => shiftMonth(-1)}
          onNextMonth={() => shiftMonth(1)}
          onAddEvent={openAddEventModal}
        />

        {viewType === "month" ? (
          <CalendarMonthGrid
            calendarDays={calendarDays}
            eventsByDate={eventsByDate}
            selectedDate={selectedDate}
            todayStr={todayStr}
            onSelectDate={setSelectedDate}
          />
        ) : (
          <CalendarEmptyView
            viewType={viewType}
            onReturnToMonth={() => setViewType("month")}
          />
        )}
      </div>

      <CalendarSidePanel
        selectedDate={selectedDate}
        selectedDayEvents={selectedDayEvents}
        onAddEvent={openAddEventModal}
      />

      <CalendarEventModal
        isOpen={isModalOpen}
        title={title}
        eventDate={eventDate}
        startTime={startTime}
        endTime={endTime}
        type={type}
        location={location}
        description={description}
        onTitleChange={setTitle}
        onDateChange={setEventDate}
        onStartTimeChange={setStartTime}
        onEndTimeChange={setEndTime}
        onTypeChange={setType}
        onLocationChange={setLocation}
        onDescriptionChange={setDescription}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddEvent}
      />
    </div>
  );
}
