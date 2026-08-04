import { Redis } from '@upstash/redis';

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

if (!url || !token) {
  throw new Error(
    'UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be set'
  );
}

// Singleton pattern for dev HMR
declare global {
  // eslint-disable-next-line no-var
  var __redis: Redis | undefined;
}

function createRedisClient(): Redis {
  return new Redis({ url: url!, token: token! });
}

export const redis: Redis =
  process.env.NODE_ENV === 'development'
    ? (globalThis.__redis ??= createRedisClient())
    : createRedisClient();

// ─── Key helpers ────────────────────────────────────────────────────────────

/** Cache key for short-code → original URL mapping */
export const codeKey = (code: string) => `shawty:code:${code}`;

/** Rate limit key for an IP (hashed) */
export const rateLimitKey = (ipHash: string) => `shawty:rl:${ipHash}`;

/** Cache TTL in seconds */
export const CODE_TTL = parseInt(process.env.REDIS_CODE_TTL ?? '86400', 10);
