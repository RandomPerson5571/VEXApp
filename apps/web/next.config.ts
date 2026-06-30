import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@stlvex/database", "@stlvex/ui"],
  serverExternalPackages: ["@prisma/client", "@prisma/adapter-pg", "pg"],
};

export default nextConfig;
