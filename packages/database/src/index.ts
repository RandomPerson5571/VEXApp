import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { PrismaClient } from '../generated/prisma/client.js';
import { normalizeDatabaseUrl } from './normalize-database-url.js';

export * from '../generated/prisma/client.js';
export { normalizeDatabaseUrl } from './normalize-database-url.js';

const globalForPrisma = globalThis as typeof globalThis & { prisma?: PrismaClient };

const rawDatabaseUrl = process.env.DATABASE_URL;

if (!rawDatabaseUrl) {
  throw new Error('DATABASE_URL is not set');
}

const connectionString = normalizeDatabaseUrl(rawDatabaseUrl);

const pool = new pg.Pool({
  connectionString,
  ssl: connectionString.includes('supabase')
    ? { rejectUnauthorized: false }
    : undefined,
});
const adapter = new PrismaPg(pool);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: ['query'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
