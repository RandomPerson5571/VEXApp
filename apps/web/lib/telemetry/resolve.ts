import "server-only";

import { prisma } from "@stlvex/database";

const TTL_MS = 5 * 60 * 1000;

type CacheEntry = {
  guildId: string | null;
  expiresAt: number;
};

const guildCache = new Map<string, CacheEntry>();

export async function resolveGuildIdForTeam(teamId: string): Promise<string | null> {
  const cached = guildCache.get(teamId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.guildId;
  }

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { discordServerId: true },
  });

  const guildId = team?.discordServerId ?? null;
  guildCache.set(teamId, { guildId, expiresAt: Date.now() + TTL_MS });
  return guildId;
}

/** ponytail: call after /set-team-server if we need instant routing; v1 relies on TTL */
export function invalidateGuildCacheForTeam(teamId: string): void {
  guildCache.delete(teamId);
}
