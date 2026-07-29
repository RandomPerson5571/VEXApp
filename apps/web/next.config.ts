import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  transpilePackages: ["@stlvex/database", "@stlvex/ui"],
  serverExternalPackages: [
    "@prisma/client",
    "@prisma/adapter-pg",
    "pg",
    "events.vex",
  ],
  turbopack: {
    root: path.join(__dirname, "../.."),
  },
};

export default nextConfig;
