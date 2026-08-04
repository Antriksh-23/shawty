import { createHash } from 'crypto';
import { redis, rateLimitKey } from './redis';

const MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_ANON_MAX ?? '20', 10);
const WINDOW_SECONDS = parseInt(process.env.RATE_LIMIT_WINDOW_SECONDS ?? '3600', 10);

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number; // Unix timestamp (seconds)
  limit: number;
}

/**
 * Sliding window rate limiter using Upstash Redis.
 *
 * Algorithm: fixed window with atomic INCR + EXPIRE.
 * A true sliding window would require a sorted set; fixed window is sufficient
 * for abuse prevention at MVP scale and requires fewer Redis ops.
 *
 * @param ip - Raw IP string (will be hashed before use as a key)
 */
export async function checkRateLimit(ip: string): Promise<RateLimitResult> {
  // Hash the IP so raw IPs are never stored in Redis
  const ipHash = createHash('sha256').update(ip).digest('hex').slice(0, 32);
  const key = rateLimitKey(ipHash);

  // Atomic pipeline: INCR then set expiry if it's a new key
  const pipeline = redis.pipeline();
  pipeline.incr(key);
  pipeline.ttl(key);
  const [count, ttl] = (await pipeline.exec()) as [number, number];

  // If this is the first request in the window, set the expiry
  if (ttl === -1) {
    await redis.expire(key, WINDOW_SECONDS);
  }

  const currentCount = count as number;
  const currentTtl = ttl === -1 ? WINDOW_SECONDS : (ttl as number);
  const resetAt = Math.floor(Date.now() / 1000) + currentTtl;

  return {
    allowed: currentCount <= MAX_REQUESTS,
    remaining: Math.max(0, MAX_REQUESTS - currentCount),
    resetAt,
    limit: MAX_REQUESTS,
  };
}

/**
 * Extract the real client IP from a Next.js request.
 * Respects common proxy headers.
 */
export function getClientIp(headers: Headers): string {
  return (
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    headers.get('x-real-ip') ??
    '127.0.0.1'
  );
}
