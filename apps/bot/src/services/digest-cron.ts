import { EmbedBuilder } from "discord.js";
import { prisma, Prisma } from "@stlvex/database";

import type { BotClient } from "../types.js";

type DigestCounters = Record<string, number>;

const LABELS: Record<string, string> = {
  tasksCompleted: "tasks completed",
  scoutNotesSaved: "scout notes saved",
  partsReturned: "parts returned",
};

function formatCounters(counters: DigestCounters): string {
  const parts: string[] = [];
  for (const [key, count] of Object.entries(counters)) {
    if (typeof count !== "number" || count <= 0) continue;
    parts.push(`${count} ${LABELS[key] ?? key}`);
  }
  return parts.join(", ");
}

function localHourAndDateKey(
  timeZone: string,
  now: Date,
): { hour: number; dateKey: string } {
  const hourFmt = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    hour12: false,
  });
  const dateFmt = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const hour = Number(hourFmt.format(now));
  const dateKey = dateFmt.format(now); // yyyy-mm-dd
  return { hour, dateKey };
}

/**
 * Every minute: flush Routine digests for teams at their digestHourLocal.
 */
export function startDigestCron(client: BotClient): NodeJS.Timeout {
  const tick = async () => {
    try {
      await flushDueDigests(client);
    } catch (error) {
      console.error("[digest] flush failed:", error);
    }
  };

  void tick();
  return setInterval(() => {
    void tick();
  }, 60_000);
}

export async function flushDueDigests(
  client: BotClient,
  now: Date = new Date(),
): Promise<number> {
  const teams = await prisma.team.findMany({
    where: {
      annoucementsChannelId: { not: null },
      digestBuffer: { isNot: null },
    },
    select: {
      id: true,
      number: true,
      annoucementsChannelId: true,
      digestHourLocal: true,
      digestTimezone: true,
      digestBuffer: true,
    },
  });

  let flushed = 0;

  for (const team of teams) {
    const buffer = team.digestBuffer;
    if (!buffer || !team.annoucementsChannelId) continue;

    const { hour, dateKey } = localHourAndDateKey(team.digestTimezone, now);
    if (hour !== team.digestHourLocal) continue;
    if (buffer.lastFlushedDateKey === dateKey) continue;

    const counters =
      buffer.counters && typeof buffer.counters === "object" && !Array.isArray(buffer.counters)
        ? (buffer.counters as DigestCounters)
        : {};

    const summary = formatCounters(counters);
    if (!summary) {
      await prisma.teamDigestBuffer.update({
        where: { teamId: team.id },
        data: { lastFlushedDateKey: dateKey },
      });
      continue;
    }

    const channel = await client.channels.fetch(team.annoucementsChannelId);
    if (!channel?.isSendable()) {
      console.warn(`[digest] team ${team.number} channel not sendable`);
      continue;
    }

    const embed = new EmbedBuilder()
      .setTitle("Daily digest")
      .setDescription(summary.charAt(0).toUpperCase() + summary.slice(1) + ".")
      .setColor(0x64748b)
      .setTimestamp(now)
      .setFooter({ text: `Team ${team.number}` });

    await channel.send({ embeds: [embed] });

    await prisma.teamDigestBuffer.update({
      where: { teamId: team.id },
      data: {
        counters: {} as Prisma.InputJsonValue,
        lastFlushedDateKey: dateKey,
      },
    });

    flushed += 1;
  }

  return flushed;
}
