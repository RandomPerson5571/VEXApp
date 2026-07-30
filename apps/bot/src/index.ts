import type { Server } from "node:http";
import path from "node:path";
import { Client, GatewayIntentBits } from "discord.js";
import { closeWebhookServer, createWebhookServer } from "./api/server.js";
import { config } from "./config.js";
import { loadCommands, loadEvents } from "./loaders.js";
import type { BotClient } from "./types.js";
import { srcDirectory } from "./utils/paths.js";

// Instantiated outside the function so process event listeners can access it
let webhookServer: Server | undefined;
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
}) as BotClient;

async function bootstrap(): Promise<void> {
  const commandsDir = path.join(srcDirectory, "commands");
  const eventsDir = path.join(srcDirectory, "events");

  client.commands = await loadCommands(commandsDir);
  const events = await loadEvents(eventsDir);

  for (const event of events) {
    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args));
      continue;
    }

    client.on(event.name, (...args) => event.execute(...args));
  }

  ({ server: webhookServer } = createWebhookServer(client));
  await client.login(config.token);
}

// --- Graceful Shutdown Handler ---
async function handleShutdown(signal: string): Promise<void> {
  console.log(`\nReceived ${signal}. Commencing graceful shutdown...`);

  if (webhookServer) {
    await closeWebhookServer(webhookServer);
    console.log("Webhook API stopped.");
  }

  client.destroy();
  console.log("Discord client destroyed safely. Exiting process.");

  process.exit(0);
}

// Listen for termination signals (Ctrl+C, PM2/Docker stops, etc.)
process.on("SIGINT", () => {
  void handleShutdown("SIGINT");
});
process.on("SIGTERM", () => {
  void handleShutdown("SIGTERM");
});

// Execute bootstrap
bootstrap().catch((error) => {
  console.error("Failed to start bot:", error);
  process.exitCode = 1;
});