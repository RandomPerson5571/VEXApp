import type { EventType } from "@/lib/types/team";

export interface CalendarDayCell {
  day: number;
  isCurrentMonth: boolean;
  dateStr: string;
}

export interface EventStyle {
  bg: string;
  dot: string;
}

function toDateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function getDaysInMonth(year: number, month: number): CalendarDayCell[] {
  const days: CalendarDayCell[] = [];
  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear = month === 0 ? year - 1 : year;
  const prevDaysCount = new Date(prevYear, prevMonth + 1, 0).getDate();

  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const day = prevDaysCount - i;
    days.push({
      day,
      isCurrentMonth: false,
      dateStr: toDateStr(prevYear, prevMonth, day),
    });
  }

  for (let day = 1; day <= daysInMonth; day++) {
    days.push({
      day,
      isCurrentMonth: true,
      dateStr: toDateStr(year, month, day),
    });
  }

  const totalCells = days.length > 35 ? 42 : 35;
  const nextMonth = month === 11 ? 0 : month + 1;
  const nextYear = month === 11 ? year + 1 : year;
  const remaining = totalCells - days.length;

  for (let day = 1; day <= remaining; day++) {
    days.push({
      day,
      isCurrentMonth: false,
      dateStr: toDateStr(nextYear, nextMonth, day),
    });
  }

  return days;
}

export function formatMonthYear(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export function formatSelectedDayLabel(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function getTodayDateStr(): string {
  const now = new Date();
  return toDateStr(now.getFullYear(), now.getMonth(), now.getDate());
}

export function parseDateStr(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function addDaysToDateStr(dateStr: string, delta: number): string {
  const date = parseDateStr(dateStr);
  date.setDate(date.getDate() + delta);
  return toDateStr(date.getFullYear(), date.getMonth(), date.getDate());
}

export function getDaysInWeek(anchorDateStr: string): CalendarDayCell[] {
  const anchor = parseDateStr(anchorDateStr);
  const startOfWeek = new Date(anchor);
  startOfWeek.setDate(anchor.getDate() - anchor.getDay());

  const days: CalendarDayCell[] = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + i);
    days.push({
      day: date.getDate(),
      isCurrentMonth: true,
      dateStr: toDateStr(date.getFullYear(), date.getMonth(), date.getDate()),
    });
  }
  return days;
}

export function formatWeekRange(anchorDateStr: string): string {
  const weekDays = getDaysInWeek(anchorDateStr);
  const start = parseDateStr(weekDays[0].dateStr);
  const end = parseDateStr(weekDays[6].dateStr);

  const startLabel = start.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  const endLabel = end.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
    return `${start.toLocaleDateString("en-US", { month: "long" })} ${start.getDate()} – ${end.getDate()}, ${end.getFullYear()}`;
  }

  return `${startLabel} – ${endLabel}`;
}

export function parseTimeToMinutes(timeStr: string): number {
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return 0;

  let hours = Number.parseInt(match[1], 10);
  const minutes = Number.parseInt(match[2], 10);
  const period = match[3].toUpperCase();

  if (period === "PM" && hours !== 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;

  return hours * 60 + minutes;
}

export const SCHEDULE_HOUR_START = 6;
export const SCHEDULE_HOUR_END = 22;
export const SCHEDULE_HOUR_HEIGHT = 52;

export function getScheduleHours(): number[] {
  const hours: number[] = [];
  for (let hour = SCHEDULE_HOUR_START; hour <= SCHEDULE_HOUR_END; hour++) {
    hours.push(hour);
  }
  return hours;
}

export function getEventTimePosition(
  startTime: string,
  endTime: string,
): { top: number; height: number } {
  const startMinutes = parseTimeToMinutes(startTime);
  const endMinutes = parseTimeToMinutes(endTime);
  const gridStart = SCHEDULE_HOUR_START * 60;
  const gridEnd = (SCHEDULE_HOUR_END + 1) * 60;
  const totalMinutes = gridEnd - gridStart;

  const clampedStart = Math.max(startMinutes, gridStart);
  const clampedEnd = Math.min(Math.max(endMinutes, clampedStart + 15), gridEnd);
  const top = ((clampedStart - gridStart) / totalMinutes) * 100;
  const height = ((clampedEnd - clampedStart) / totalMinutes) * 100;

  return { top, height: Math.max(height, 2.5) };
}

export function getEventStyle(type: EventType): EventStyle {
  switch (type) {
    case "championship":
      return {
        bg: "bg-amber-50 dark:bg-amber-600/10 border-amber-500/20 text-amber-700 dark:text-amber-400",
        dot: "bg-amber-400",
      };
    case "scrimmage":
      return {
        bg: "bg-yellow-50 dark:bg-yellow-500/10 border-yellow-500/20 text-yellow-700 dark:text-yellow-400",
        dot: "bg-yellow-400",
      };
    case "practice_match":
      return {
        bg: "bg-purple-50 dark:bg-purple-600/10 border-purple-500/20 text-purple-700 dark:text-purple-400",
        dot: "bg-purple-400",
      };
    case "meeting":
      return {
        bg: "bg-indigo-50 dark:bg-indigo-600/10 border-indigo-500/20 text-indigo-700 dark:text-indigo-400",
        dot: "bg-indigo-400",
      };
    case "build":
    default:
      return {
        bg: "bg-cyan-50 dark:bg-cyan-600/10 border-cyan-500/20 text-cyan-700 dark:text-cyan-400",
        dot: "bg-cyan-400",
      };
  }
}
