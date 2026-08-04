import { Redis } from '@upstash/redis';

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

declare global {
  // eslint-disable-next-line no-var
  var __redis: Redis | undefined;
}

function createRedisClient(): Redis {
  if (!url || !token) {
    console.warn(
      '[REDIS WARNING] UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN is missing. Using fallback Redis client.'
    );
    return new Redis({
      url: 'https://fallback-dummy-url.upstash.io',
      token: 'fallback-dummy-token',
    });
  }
  return new Redis({ url, token });
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
