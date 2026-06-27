import path from "node:path";
import { Client, GatewayIntentBits } from "discord.js";
import { config } from "./config.js";
import { loadCommands, loadEvents } from "./loaders.js";
import type { BotClient } from "./types.js";
import { srcDirectory } from "./utils/paths.js";

// Instantiated outside the function so process event listeners can access it
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

  await client.login(config.token);
}

// --- Graceful Shutdown Handler ---
function handleShutdown(signal: string): void {
  console.log(`\nReceived ${signal}. Commencing graceful shutdown...`);
  
  // Closes the gateway connection and destroys the client
  client.destroy();
  console.log("Discord client destroyed safely. Exiting process.");
  
  process.exit(0);
}

// Listen for termination signals (Ctrl+C, PM2/Docker stops, etc.)
process.on("SIGINT", () => handleShutdown("SIGINT"));
process.on("SIGTERM", () => handleShutdown("SIGTERM"));

// Execute bootstrap
bootstrap().catch((error) => {
  console.error("Failed to start bot:", error);
  process.exitCode = 1;
});