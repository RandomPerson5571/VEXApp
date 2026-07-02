import { type APIEmbed, EmbedBuilder } from "discord.js";

import type { BotClient } from "../types.js";

const DM_CONCURRENCY = 5;

function toEmbedJson(embed: APIEmbed | EmbedBuilder): APIEmbed {
  return embed instanceof EmbedBuilder ? embed.toJSON() : embed;
}

export async function sendDiscordDm(
  client: BotClient,
  discordId: string,
  embed: APIEmbed | EmbedBuilder,
): Promise<void> {
  try {
    const user = await client.users.fetch(discordId);
    await user.send({ embeds: [toEmbedJson(embed)] });
  } catch (error) {
    console.error(`[discord-dm] failed to DM ${discordId}:`, error);
  }
}

export async function sendDiscordDmBatch(
  client: BotClient,
  discordIds: string[],
  embed: APIEmbed | EmbedBuilder,
): Promise<void> {
  await mapWithConcurrency(discordIds, DM_CONCURRENCY, (discordId) =>
    sendDiscordDm(client, discordId, embed),
  );
}

async function mapWithConcurrency<T>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<void>,
): Promise<void> {
  if (items.length === 0) {
    return;
  }

  let nextIndex = 0;
  const workerCount = Math.min(limit, items.length);

  await Promise.all(
    Array.from({ length: workerCount }, async () => {
      while (nextIndex < items.length) {
        const index = nextIndex++;
        await fn(items[index]!);
      }
    }),
  );
}
