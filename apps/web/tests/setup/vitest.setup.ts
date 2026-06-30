import path from "node:path";
import { fileURLToPath } from "node:url";

import { config } from "dotenv";

const webRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const databaseEnvPath = path.resolve(
  webRoot,
  "../../packages/database/.env",
);

config({ path: path.join(webRoot, ".env.local") });
config({ path: databaseEnvPath, override: true });
