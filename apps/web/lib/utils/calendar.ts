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
