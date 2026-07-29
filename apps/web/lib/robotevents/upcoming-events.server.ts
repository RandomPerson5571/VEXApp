import "server-only";

import { programs } from "events.vex";

import { getVexClient } from "@/lib/robotevents/client.server";
import type { UpcomingMatch } from "@/lib/types/team";

// ponytail: generous cap for calendar; widget slices to 6 after merge
const UPCOMING_LIMIT = 50;

function formatLocation(location: {
  venue?: string;
  city?: string;
  region?: string;
}): string {
  const parts = [location.venue, location.city, location.region].filter(
    (part): part is string => Boolean(part?.trim()),
  );
  return parts.length > 0 ? parts.join(", ") : "Location TBD";
}

function toDateParts(iso: string | undefined): {
  date: string;
  monthLabel: string;
  day: number;
} | null {
  if (!iso) return null;
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return null;

  const year = parsed.getUTCFullYear();
  const month = String(parsed.getUTCMonth() + 1).padStart(2, "0");
  const dayNum = parsed.getUTCDate();
  const date = `${year}-${month}-${String(dayNum).padStart(2, "0")}`;

  return {
    date,
    monthLabel: parsed.toLocaleString("en-US", {
      month: "short",
      timeZone: "UTC",
    }),
    day: dayNum,
  };
}

export type UpcomingRobotEventsResult = {
  configured: boolean;
  /** false when the RobotEvents API call failed (soft failure). */
  available: boolean;
  teamNumber: string;
  events: UpcomingMatch[];
};

function emptyResult(
  teamNumber: string,
  configured: boolean,
  available: boolean,
): UpcomingRobotEventsResult {
  return { configured, available, teamNumber, events: [] };
}

/**
 * Thin slice: upcoming VEX Events tournaments for a team number (V5RC).
 * Never throws — API/HTML parse failures return available: false.
 */
export async function getUpcomingRobotEventsForTeamNumber(
  teamNumber: string,
  start = new Date().toISOString(),
): Promise<UpcomingRobotEventsResult> {
  const trimmed = teamNumber.trim();
  const client = getVexClient();

  if (!client) {
    return emptyResult(trimmed, false, false);
  }

  if (!trimmed) {
    return emptyResult(trimmed, true, true);
  }

  try {
    const teamResult = await client.teams.getByNumber(trimmed, programs.V5RC);
    if (teamResult.error || !teamResult.data) {
      return emptyResult(trimmed, true, true);
    }

    const eventsResult = await teamResult.data.events({ start });
    if (eventsResult.error || !eventsResult.data) {
      return emptyResult(trimmed, true, true);
    }

    const events = eventsResult.data
      .map((event): UpcomingMatch | null => {
        const parts = toDateParts(event.start);
        if (!parts) return null;

        return {
          id: `re-${event.id}`,
          date: parts.date,
          monthLabel: parts.monthLabel,
          day: parts.day,
          title: event.name,
          location: formatLocation(event.location),
          time: event.sku,
          accentClass: "bg-orange-500/15 text-orange-700 dark:text-orange-300",
          href: event.getURL(),
        };
      })
      .filter((event): event is UpcomingMatch => event !== null)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, UPCOMING_LIMIT);

    return {
      configured: true,
      available: true,
      teamNumber: trimmed,
      events,
    };
  } catch {
    // ponytail: events.vex throws on HTML/error pages — soft-fail for the UI
    return emptyResult(trimmed, true, false);
  }
}
