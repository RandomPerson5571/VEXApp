import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/index";
import { normalizeDatabaseUrl } from "./normalize-database-url";
import { Pool } from "pg";

const rawDatabaseUrl = process.env.DATABASE_URL;

if (!rawDatabaseUrl) {
  throw new Error("DATABASE_URL is not set");
}

const connectionString = normalizeDatabaseUrl(rawDatabaseUrl);
const pool = new Pool({
  connectionString,
  ssl: connectionString.includes("supabase")
    ? { rejectUnauthorized: false }
    : undefined,
});

const adapter = new PrismaPg(pool);

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient;
};

export const prisma: PrismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
