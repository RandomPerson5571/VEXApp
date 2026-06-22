import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { Collection } from "discord.js";
import type { BotEvent, SlashCommand } from "./types.js";

const VALID_FILE_REGEX = /\.(ts|js)$/;

async function getModuleFilePaths(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const resolved = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        return getModuleFilePaths(resolved);
      }

      if (VALID_FILE_REGEX.test(entry.name) && !entry.name.endsWith(".d.ts")) {
        return resolved;
      }

      return [];
    }),
  );

  return files.flat();
}

export async function loadCommands(commandsDir: string): Promise<Collection<string, SlashCommand>> {
  const collection = new Collection<string, SlashCommand>();
  const commandFiles = await getModuleFilePaths(commandsDir);

  for (const commandFile of commandFiles) {
    const imported = await import(pathToFileURL(commandFile).href);
    const command = imported.default as SlashCommand | undefined;

    if (!command?.data?.name || !command.execute) {
      continue;
    }

    collection.set(command.data.name, command);
  }

  return collection;
}

export async function loadEvents(eventsDir: string): Promise<BotEvent[]> {
  const eventFiles = await getModuleFilePaths(eventsDir);
  const events: BotEvent[] = [];

  for (const eventFile of eventFiles) {
    const imported = await import(pathToFileURL(eventFile).href);
    const event = imported.default as BotEvent | undefined;

    if (!event?.name || !event.execute) {
      continue;
    }

    events.push(event);
  }

  return events;
}
