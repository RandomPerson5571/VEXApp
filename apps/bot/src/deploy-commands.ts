import path from "node:path";
import { REST, Routes } from "discord.js";
import { config } from "./config.js";
import { loadCommands } from "./loaders.js";
import { srcDirectory } from "./utils/paths.js";

async function deployCommands(): Promise<void> {
  const commandsDir = path.join(srcDirectory, "commands");
  const commands = await loadCommands(commandsDir);
  const payload = [...commands.values()].map((command) => command.data.toJSON());

  const rest = new REST({ version: "10" }).setToken(config.token);

  if (config.guildId) {
    await rest.put(Routes.applicationGuildCommands(config.clientId, config.guildId), { body: payload });
    console.log(`Registered ${payload.length} command(s) to guild ${config.guildId}.`);
    return;
  }

  await rest.put(Routes.applicationCommands(config.clientId), { body: payload });
  console.log(`Registered ${payload.length} global command(s).`);
}

deployCommands().catch((error) => {
  console.error("Failed to register slash commands:", error);
  process.exitCode = 1;
});
