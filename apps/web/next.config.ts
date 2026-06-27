import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@stlvex/database", "@stlvex/ui"],
  serverExternalPackages: [
    "@prisma/client",
    "@prisma/adapter-pg",
    "@stlvex/database",
    "pg",
  ],
};

export default nextConfig;
