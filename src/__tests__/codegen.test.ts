import { describe, it, expect, vi } from 'vitest';
import {
  generateShortCode,
  ensureUniqueCode,
  isReservedSlug,
  RESERVED_SLUGS,
  hashIp,
} from '@/lib/codegen';

// ─── generateShortCode ────────────────────────────────────────────────────────

describe('generateShortCode', () => {
  it('generates a string of the specified length', () => {
    const code = generateShortCode(7);
    expect(code).toHaveLength(7);
  });

  it('generates a string of default length 7', () => {
    const code = generateShortCode();
    expect(code).toHaveLength(7);
  });

  it('only contains base62 characters', () => {
    for (let i = 0; i < 100; i++) {
      const code = generateShortCode(7);
      expect(code).toMatch(/^[a-zA-Z0-9]+$/);
    }
  });

  it('generates different codes on successive calls (not deterministic)', () => {
    const codes = new Set(Array.from({ length: 50 }, () => generateShortCode(7)));
    // With 7 base62 chars there are 62^7 ≈ 3.5 trillion possibilities
    // Probability of collision in 50 draws is negligible
    expect(codes.size).toBe(50);
  });

  it('generates codes of different lengths correctly', () => {
    for (const len of [4, 6, 8, 10]) {
      expect(generateShortCode(len)).toHaveLength(len);
    }
  });
});

// ─── isReservedSlug ───────────────────────────────────────────────────────────

describe('isReservedSlug', () => {
  it('returns true for all reserved words', () => {
    for (const slug of RESERVED_SLUGS) {
      expect(isReservedSlug(slug)).toBe(true);
    }
  });

  it('is case-insensitive', () => {
    expect(isReservedSlug('API')).toBe(true);
    expect(isReservedSlug('Admin')).toBe(true);
    expect(isReservedSlug('LOGIN')).toBe(true);
  });

  it('returns false for non-reserved slugs', () => {
    expect(isReservedSlug('my-link')).toBe(false);
    expect(isReservedSlug('product-launch')).toBe(false);
    expect(isReservedSlug('sale2025')).toBe(false);
  });
});

// ─── ensureUniqueCode ─────────────────────────────────────────────────────────

describe('ensureUniqueCode', () => {
  it('returns a code when the first attempt is unique', async () => {
    // Mock: always says code is available (returns false = not taken)
    const codeExists = vi.fn().mockResolvedValue(false);

    const code = await ensureUniqueCode(codeExists, 7, 5);
    expect(code).toHaveLength(7);
    expect(code).toMatch(/^[a-zA-Z0-9]+$/);
  });

  it('retries when a collision occurs and returns a unique code', async () => {
    let callCount = 0;
    // First 2 calls say "taken", 3rd says "available"
    const codeExists = vi.fn().mockImplementation(() => {
      callCount++;
      return Promise.resolve(callCount <= 2); // true = taken, false = available
    });

    const code = await ensureUniqueCode(codeExists, 7, 5);
    expect(code).toBeDefined();
    expect(callCount).toBe(3);
  });

  it('throws after max retries are exhausted', async () => {
    // Always says code is taken
    const codeExists = vi.fn().mockResolvedValue(true);

    // Use length 10 to prevent the recursive length-increment fallback
    await expect(ensureUniqueCode(codeExists, 10, 3)).rejects.toThrow(
      'Failed to generate a unique short code'
    );
  });
});

// ─── hashIp ───────────────────────────────────────────────────────────────────

describe('hashIp', () => {
  it('returns a 32-character hex string', () => {
    const hash = hashIp('192.168.1.1');
    expect(hash).toHaveLength(32);
    expect(hash).toMatch(/^[0-9a-f]+$/);
  });

  it('is deterministic (same IP → same hash)', () => {
    const h1 = hashIp('10.0.0.1');
    const h2 = hashIp('10.0.0.1');
    expect(h1).toBe(h2);
  });

  it('produces different hashes for different IPs', () => {
    const h1 = hashIp('1.2.3.4');
    const h2 = hashIp('5.6.7.8');
    expect(h1).not.toBe(h2);
  });
});
