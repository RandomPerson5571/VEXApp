import path from "node:path";
import { fileURLToPath } from "node:url";

import { config as loadEnv } from "dotenv";

const botRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const databaseEnvPath = path.resolve(
  botRoot,
  "../../packages/database/.env",
);

loadEnv({ path: path.join(botRoot, ".env") });
loadEnv({ path: databaseEnvPath, override: true });

process.env.DISCORD_TOKEN ??= "vitest-discord-token";
process.env.DISCORD_CLIENT_ID ??= "vitest-discord-client-id";
process.env.GENERAL_MEMBER_ROLE_ID ??= "vitest-general-member-role";
process.env.WEBHOOK_SECRET ??= "vitest-webhook-secret";
