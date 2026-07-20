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
}

export interface Activity {
  id: string;
  text: string;
  subtext?: string;
  time: string;
  type: "scout" | "doc" | "inventory" | "build" | "schedule";
}

export interface BuildStatusComponent {
  id: string;
  name: string;
  percentage: number;
  colorClass: string;
}

export interface UpcomingMatch {
  id: string;
  monthLabel: string;
  day: number;
  title: string;
  location: string;
  time: string;
  accentClass: string;
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

export interface DesignNotebookEntry {
  id: string;
  title: string;
  week: string;
  category: string;
  introduction: string;
  designConstraints: string[];
  conceptSketchesDescription: string;
  prototypesText: string;
  testingResults: string;
  conclusion: string;
  nextSteps: string;
}
