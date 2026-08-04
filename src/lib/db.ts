import { PrismaClient } from '@prisma/client';

// ─── Prisma Client Singleton ──────────────────────────────────────────────────
// In development, Next.js hot-reloads modules which would create many Prisma
// Client instances. The global variable trick prevents that.

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

function createPrismaClient(): PrismaClient {
  if (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL) {
    throw new Error('[SECURITY FATAL] DATABASE_URL environment variable must be set in production.');
  }
  return new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['error', 'warn']
        : ['error'],
  });
}

export const db: PrismaClient =
  process.env.NODE_ENV === 'development'
    ? (globalThis.__prisma ??= createPrismaClient())
    : createPrismaClient();
