import "server-only";

import { calculateOpr } from "@/lib/robotevents/opr";
import { getVexClient } from "@/lib/robotevents/client.server";

const CACHE_TTL_MS = 60_000;

export type TeamEventStats = {
  opr: number | null;
  dpr: number | null;
  ccwm: number | null;
  ap: number | null;
  averagePoints: number | null;
  rank: number | null;
  wins: number | null;
  losses: number | null;
  ties: number | null;
};

export type EventAnalyticsResult = {
  configured: boolean;
  available: boolean;
  eventId: number;
  teams: Record<string, TeamEventStats>;
};

type CachedAnalytics = {
  expiresAt: number;
  result: EventAnalyticsResult;
};

const cache = new Map<number, CachedAnalytics>();

function emptyResult(
  eventId: number,
  configured: boolean,
  available: boolean,
): EventAnalyticsResult {
  return { configured, available, eventId, teams: {} };
}

export async function getEventAnalytics(
  eventId: number,
): Promise<EventAnalyticsResult> {
  const client = getVexClient();
  if (!client) return emptyResult(eventId, false, false);
  if (!Number.isInteger(eventId) || eventId <= 0) {
    return emptyResult(eventId, true, true);
  }

  const cached = cache.get(eventId);
  if (cached && cached.expiresAt > Date.now()) return cached.result;

  try {
    const eventResult = await client.events.get(eventId);
    if (eventResult.error || !eventResult.data) {
      return emptyResult(eventId, true, true);
    }

    const divisions = (eventResult.data.divisions ?? []).flatMap((division) =>
      division.id === undefined ? [] : [division.id],
    );
    if (divisions.length === 0) return emptyResult(eventId, true, true);

    const divisionResults = await Promise.all(
      divisions.map(async (divisionId) => {
        const [matches, rankings] = await Promise.all([
          eventResult.data.matches(divisionId, { "round[]": [2] }),
          eventResult.data.rankings(divisionId),
        ]);
        return { matches, rankings };
      }),
    );

    if (
      divisionResults.some(
        ({ matches, rankings }) => matches.error || rankings.error,
      )
    ) {
      return emptyResult(eventId, true, false);
    }

    const matches = divisionResults.flatMap(({ matches }) => matches.data ?? []);
    const rankings = divisionResults.flatMap(
      ({ rankings }) => rankings.data ?? [],
    );
    const calculated = calculateOpr(matches);
    const teams: Record<string, TeamEventStats> = {};

    for (const ranking of rankings) {
      const teamNumber = ranking.team?.name.trim().toUpperCase();
      if (!teamNumber) continue;
      const opr = calculated.get(teamNumber);
      teams[teamNumber] = {
        opr: opr?.opr ?? null,
        dpr: opr?.dpr ?? null,
        ccwm: opr?.ccwm ?? null,
        ap: ranking.ap ?? null,
        averagePoints: ranking.average_points ?? null,
        rank: ranking.rank ?? null,
        wins: ranking.wins ?? null,
        losses: ranking.losses ?? null,
        ties: ranking.ties ?? null,
      };
    }

    for (const [teamNumber, opr] of calculated) {
      teams[teamNumber] ??= {
        ...opr,
        ap: null,
        averagePoints: null,
        rank: null,
        wins: null,
        losses: null,
        ties: null,
      };
    }

    const result: EventAnalyticsResult = {
      configured: true,
      available: true,
      eventId,
      teams,
    };
    cache.set(eventId, { expiresAt: Date.now() + CACHE_TTL_MS, result });
    return result;
  } catch {
    // ponytail: RobotEvents can return HTML/error pages during outages.
    return emptyResult(eventId, true, false);
  }
}
