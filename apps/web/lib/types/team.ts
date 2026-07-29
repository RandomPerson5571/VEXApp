export type EventType =
  | "build"
  | "practice_match"
  | "scrimmage"
  | "championship"
  | "meeting";

export type DayPlanType = "build" | "coding" | "testing";

export interface TeamDayPlan {
  id: string;
  date: string;
  type: DayPlanType;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  type: EventType;
  location?: string;
  matchesCount?: number;
  description?: string;
  createdBy?: string;
  /** External events.vex.com URL when sourced from RobotEvents. */
  href?: string;
}

export interface UpcomingMatch {
  id: string;
  date: string;
  monthLabel: string;
  day: number;
  title: string;
  location: string;
  time: string;
  accentClass: string;
  /** External events.vex.com URL when sourced from RobotEvents. */
  href?: string;
}

export interface DashboardSummaryStats {
  incompleteTasks: number;
  completedTasks: number;
  overdueTasks: number;
  nextEvent: string;
  nextEventDate: string;
  inventoryItems: number;
  inventoryWarning: boolean;
}
