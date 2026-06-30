import path from "node:path";
import { fileURLToPath } from "node:url";

import dotenv from "dotenv";

const botRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

dotenv.config({ path: path.join(botRoot, ".env"), override: true });

function readEnv(name: string, required = true): string {
  const value = process.env[name]?.trim();
  if (required && !value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value ?? "";
}

export const config = {
  token: readEnv("DISCORD_TOKEN"),
  clientId: readEnv("DISCORD_CLIENT_ID"),
  guildId: readEnv("DISCORD_GUILD_ID", false),
  generalMemberRoleId: readEnv("GENERAL_MEMBER_ROLE_ID"),
};
