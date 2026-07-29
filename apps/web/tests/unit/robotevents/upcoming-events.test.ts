import { describe, expect, it } from "vitest";

import type { UpcomingMatch } from "@/lib/types/team";

// ponytail: pure shaping check — API client mocked at the boundary later if needed
function shapeEvent(input: {
  id: number;
  name: string;
  start?: string;
  sku: string;
  location: { venue?: string; city?: string; region?: string };
  url: string;
}): UpcomingMatch | null {
  if (!input.start) return null;
  const parsed = new Date(input.start);
  if (Number.isNaN(parsed.getTime())) return null;

  const year = parsed.getUTCFullYear();
  const month = String(parsed.getUTCMonth() + 1).padStart(2, "0");
  const day = parsed.getUTCDate();

  return {
    id: `re-${input.id}`,
    date: `${year}-${month}-${String(day).padStart(2, "0")}`,
    monthLabel: parsed.toLocaleString("en-US", {
      month: "short",
      timeZone: "UTC",
    }),
    day,
    title: input.name,
    location: [input.location.venue, input.location.city, input.location.region]
      .filter(Boolean)
      .join(", "),
    time: input.sku,
    accentClass: "bg-orange-500/15 text-orange-700 dark:text-orange-300",
    href: input.url,
  };
}

describe("RobotEvents upcoming event shaping", () => {
  it("maps a VEX event into UpcomingMatch", () => {
    const match = shapeEvent({
      id: 42,
      name: "Signature Event",
      start: "2026-10-15T00:00:00.000Z",
      sku: "RE-VRC-26-0001",
      location: { venue: "Arena", city: "St. Louis", region: "MO" },
      url: "https://events.vex.com/RE-VRC-26-0001.html",
    });

    expect(match).toEqual({
      id: "re-42",
      date: "2026-10-15",
      monthLabel: "Oct",
      day: 15,
      title: "Signature Event",
      location: "Arena, St. Louis, MO",
      time: "RE-VRC-26-0001",
      accentClass: "bg-orange-500/15 text-orange-700 dark:text-orange-300",
      href: "https://events.vex.com/RE-VRC-26-0001.html",
    });
  });

  it("drops events without a start date", () => {
    expect(
      shapeEvent({
        id: 1,
        name: "TBD",
        sku: "RE-VRC-26-0002",
        location: {},
        url: "https://events.vex.com/x.html",
      }),
    ).toBeNull();
  });
});
