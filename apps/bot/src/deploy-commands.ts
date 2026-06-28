import path from "node:path";
import { pathToFileURL } from "node:url";
import { REST, Routes } from "discord.js";
import { config } from "./config.js";
import { discoverModuleFilePaths } from "./loaders.js";
import type { SlashCommand } from "./types.js";
import { srcDirectory } from "./utils/paths.js";

async function deployCommands(): Promise<void> {
  const commandsDir = path.join(srcDirectory, "commands");
  const commandFiles = await discoverModuleFilePaths(commandsDir);
  const payload = [];

  console.log(`Discovered ${commandFiles.length} command file(s) under commands/:`);

  for (const commandFile of commandFiles) {
    const relativePath = path.relative(commandsDir, commandFile);

    let imported: { default?: SlashCommand };
    try {
      imported = await import(pathToFileURL(commandFile).href);
    } catch (error) {
      console.warn(`  - skipped ${relativePath} (failed to load module)`);
      console.warn(error);
      continue;
    }

    const command = imported.default;

    if (!command?.data?.name) {
      console.warn(`  - skipped ${relativePath} (missing default export with command data)`);
      continue;
    }

    payload.push(command.data.toJSON());
    console.log(`  - /${command.data.name} <- ${relativePath}`);
  }

  if (payload.length === 0) {
    console.warn("No commands found to register.");
    return;
  }

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
