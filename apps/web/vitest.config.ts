import path from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

const webRoot = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(webRoot, "."),
      "server-only": path.resolve(webRoot, "tests/setup/server-only-stub.ts"),
    },
  },
  test: {
    environment: "node",
    globals: false,
    include: [
      "tests/**/*.test.ts",
      "tests/**/*.test.tsx",
      "tests/**/*.integration.test.ts",
    ],
    setupFiles: ["tests/setup/vitest.setup.ts"],
    fileParallelism: false,
    pool: "forks",
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
});
