import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Rate limit tests ─────────────────────────────────────────────────────────
// We mock the Redis module to avoid needing a real Upstash connection in tests.

vi.mock('@/lib/redis', () => {
  const counters = new Map<string, number>();
  const ttls = new Map<string, number>();

  const pipeline = () => {
    const ops: Array<() => unknown> = [];
    const pipe = {
      incr: (key: string) => {
        ops.push(() => {
          const count = (counters.get(key) ?? 0) + 1;
          counters.set(key, count);
          return count;
        });
        return pipe;
      },
      ttl: (key: string) => {
        ops.push(() => {
          return ttls.has(key) ? ttls.get(key) : -1;
        });
        return pipe;
      },
      exec: async () => ops.map((op) => op()),
    };
    return pipe;
  };

  const redisMock = {
    pipeline,
    incr: (key: string) => {
      const count = (counters.get(key) ?? 0) + 1;
      counters.set(key, count);
      return Promise.resolve(count);
    },
    expire: (key: string, ttl: number) => {
      ttls.set(key, ttl);
      return Promise.resolve(1);
    },
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue('OK'),
    del: vi.fn().mockResolvedValue(1),
    // Expose internals for test assertions
    _counters: counters,
    _ttls: ttls,
    _reset: () => { counters.clear(); ttls.clear(); },
  };

  return {
    redis: redisMock,
    codeKey: (code: string) => `shawty:code:${code}`,
    rateLimitKey: (ipHash: string) => `shawty:rl:${ipHash}`,
    CODE_TTL: 86400,
  };
});

import { checkRateLimit, getClientIp } from '@/lib/ratelimit';
import { redis } from '@/lib/redis';

// ─── checkRateLimit ───────────────────────────────────────────────────────────

describe('checkRateLimit', () => {
  beforeEach(() => {
    // Reset the mock counters between tests
    (redis as unknown as { _reset: () => void })._reset();
    process.env.RATE_LIMIT_ANON_MAX = '5';
    process.env.RATE_LIMIT_WINDOW_SECONDS = '3600';
  });

  it('allows requests under the limit', async () => {
    const results = await Promise.all(
      Array.from({ length: 5 }, () => checkRateLimit('1.2.3.4'))
    );
    for (const r of results) {
      expect(r.allowed).toBe(true);
    }
  });

  it('blocks the request that exceeds the limit', async () => {
    // Make MAX requests (all allowed)
    for (let i = 0; i < 5; i++) {
      await checkRateLimit('2.3.4.5');
    }
    // 6th request should be blocked
    const result = await checkRateLimit('2.3.4.5');
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('returns the correct remaining count', async () => {
    const r1 = await checkRateLimit('3.4.5.6');
    expect(r1.remaining).toBe(4); // limit 5, used 1

    const r2 = await checkRateLimit('3.4.5.6');
    expect(r2.remaining).toBe(3); // used 2
  });

  it('rate limits different IPs independently', async () => {
    // Exhaust limit for IP A
    for (let i = 0; i < 5; i++) {
      await checkRateLimit('192.168.0.1');
    }
    const blockedA = await checkRateLimit('192.168.0.1');
    expect(blockedA.allowed).toBe(false);

    // IP B should still be allowed
    const allowedB = await checkRateLimit('192.168.0.2');
    expect(allowedB.allowed).toBe(true);
  });

  it('returns a resetAt timestamp in the future', async () => {
    const result = await checkRateLimit('5.6.7.8');
    expect(result.resetAt).toBeGreaterThan(Math.floor(Date.now() / 1000));
  });
});

// ─── getClientIp ──────────────────────────────────────────────────────────────

describe('getClientIp', () => {
  it('extracts IP from x-forwarded-for header', () => {
    const headers = new Headers({ 'x-forwarded-for': '1.2.3.4, 10.0.0.1' });
    expect(getClientIp(headers)).toBe('1.2.3.4');
  });

  it('falls back to x-real-ip', () => {
    const headers = new Headers({ 'x-real-ip': '5.6.7.8' });
    expect(getClientIp(headers)).toBe('5.6.7.8');
  });

  it('falls back to 127.0.0.1 when no IP headers are present', () => {
    const headers = new Headers();
    expect(getClientIp(headers)).toBe('127.0.0.1');
  });
});
