import path from "node:path";
import { fileURLToPath } from "node:url";

import dotenv from "dotenv";

const botRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

dotenv.config({ path: path.join(botRoot, ".env") });

function readEnv(name: string, required = true): string {
  const value = process.env[name]?.trim();
  if (required && !value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value ?? "";
}

function readPort(name: string, fallback: number): number {
  const raw = process.env[name]?.trim();
  if (!raw) {
    return fallback;
  }

  const port = Number.parseInt(raw, 10);
  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error(`Invalid port in ${name}: ${raw}`);
  }

  return port;
}

export const config = {
  token: readEnv("DISCORD_TOKEN"),
  clientId: readEnv("DISCORD_CLIENT_ID"),
  guildId: readEnv("DISCORD_GUILD_ID", false),
  // Optional fallback; prefer /set-general-member-role (DiscordGuildSettings).
  generalMemberRoleId: readEnv("GENERAL_MEMBER_ROLE_ID", false),
  // Render (and similar hosts) inject PORT; WEBHOOK_PORT is the local/docker default.
  webhookPort: readPort("PORT", 0) || readPort("WEBHOOK_PORT", 3001),
  webhookSecret: readEnv("WEBHOOK_SECRET"),
  githubWebhookSecret: readEnv("GITHUB_WEBHOOK_SECRET", false),
  fusionWebhookSecret: readEnv("FUSION_WEBHOOK_SECRET", false),
};
