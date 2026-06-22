import dotenv from "dotenv";

dotenv.config();

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
