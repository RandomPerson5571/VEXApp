import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  mergeUpcomingMatches,
  toCalendarEventFromRobotEvent,
} from "@/lib/mappers/upcoming-matches";
import type { CalendarEvent, UpcomingMatch } from "@/lib/types/team";

const teamEvent = (overrides: Partial<CalendarEvent> = {}): CalendarEvent => ({
  id: "team-1",
  title: "Build Night",
  date: "2026-10-10",
  startTime: "4:30 PM",
  endTime: "6:30 PM",
  type: "build",
  location: "Workshop",
  ...overrides,
});

const robotEvent = (overrides: Partial<UpcomingMatch> = {}): UpcomingMatch => ({
  id: "re-42",
  date: "2026-10-15",
  monthLabel: "Oct",
  day: 15,
  title: "Signature Event",
  location: "Arena, St. Louis, MO",
  time: "RE-VRC-26-0001",
  accentClass: "bg-orange-500/15 text-orange-700 dark:text-orange-300",
  href: "https://events.vex.com/RE-VRC-26-0001.html",
  ...overrides,
});

describe("toCalendarEventFromRobotEvent", () => {
  it("keeps re- id, href, and SKU as description", () => {
    const calendar = toCalendarEventFromRobotEvent(robotEvent());

    expect(calendar).toMatchObject({
      id: "re-42",
      title: "Signature Event",
      date: "2026-10-15",
      startTime: "8:00 AM",
      endTime: "5:00 PM",
      type: "championship",
      location: "Arena, St. Louis, MO",
      description: "RE-VRC-26-0001",
      href: "https://events.vex.com/RE-VRC-26-0001.html",
    });
  });
});

describe("mergeUpcomingMatches", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-08T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("merges team + RobotEvents, sorts by date, and applies limit", () => {
    const merged = mergeUpcomingMatches(
      [
        teamEvent({ id: "team-late", title: "Z Meeting", date: "2026-10-20" }),
        teamEvent({ id: "team-early", title: "A Build", date: "2026-10-12" }),
      ],
      [
        robotEvent({
          id: "re-1",
          title: "Mid Tournament",
          date: "2026-10-14",
          day: 14,
        }),
        robotEvent({
          id: "re-2",
          title: "Far Tournament",
          date: "2026-11-01",
          day: 1,
          monthLabel: "Nov",
        }),
      ],
      3,
    );

    expect(merged.map((event) => event.id)).toEqual([
      "team-early",
      "re-1",
      "team-late",
    ]);
  });

  it("drops past RobotEvents but keeps in-window team events", () => {
    const merged = mergeUpcomingMatches(
      [teamEvent({ date: "2026-10-09" })],
      [robotEvent({ date: "2026-10-01", day: 1 })],
    );

    expect(merged).toHaveLength(1);
    expect(merged[0]?.id).toBe("team-1");
  });
});
