import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Redirect handler unit tests ──────────────────────────────────────────────
// These tests validate the redirect logic (expiry, password gate, click limit)
// without needing a real DB or Redis connection by mocking the dependencies.

// Mock Redis
vi.mock('@/lib/redis', () => ({
  redis: {
    get: vi.fn().mockResolvedValue(null), // Default: cache miss
    set: vi.fn().mockResolvedValue('OK'),
    del: vi.fn().mockResolvedValue(1),
    pipeline: vi.fn(),
  },
  codeKey: (code: string) => `shawty:code:${code}`,
  CODE_TTL: 86400,
}));

// Mock DB
vi.mock('@/lib/db', () => ({
  db: vi.fn(),
}));

// Mock codegen (hashIp)
vi.mock('@/lib/codegen', () => ({
  hashIp: vi.fn().mockReturnValue('hashed-ip'),
}));

import { redis } from '@/lib/redis';
import { db } from '@/lib/db';

// ─── Helper: build a mock link ────────────────────────────────────────────────

function mockLink(overrides: Record<string, unknown> = {}) {
  return {
    short_code: 'abc123',
    original_url: 'https://example.com',
    password_hash: null,
    expires_at: null,
    max_clicks: null,
    click_count: 0,
    is_active: true,
    ...overrides,
  };
}

// ─── Redirect logic unit tests ────────────────────────────────────────────────
// We test the logic directly (not the Next.js Route Handler) to keep tests fast.

import {
  resolveRedirect,
  RedirectResult,
} from '@/lib/redirect-logic';

describe('Redirect Logic', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(redis.get).mockResolvedValue(null); // cache miss by default
  });

  it('returns REDIRECT for an active link', async () => {
    const link = mockLink();
    const result = resolveRedirect(link, new Date());
    expect(result.type).toBe('redirect');
    if (result.type === 'redirect') {
      expect(result.url).toBe('https://example.com');
    }
  });

  it('returns EXPIRED when link has passed its expires_at', async () => {
    const pastDate = new Date(Date.now() - 1000).toISOString();
    const link = mockLink({ expires_at: pastDate });
    const result = resolveRedirect(link, new Date());
    expect(result.type).toBe('expired');
  });

  it('returns EXPIRED when click_count has reached max_clicks', () => {
    const link = mockLink({ max_clicks: 10, click_count: 10 });
    const result = resolveRedirect(link, new Date());
    expect(result.type).toBe('expired');
  });

  it('allows redirect when click_count is below max_clicks', () => {
    const link = mockLink({ max_clicks: 10, click_count: 9 });
    const result = resolveRedirect(link, new Date());
    expect(result.type).toBe('redirect');
  });

  it('returns NOT_FOUND for an inactive link', () => {
    const link = mockLink({ is_active: false });
    const result = resolveRedirect(link, new Date());
    expect(result.type).toBe('inactive');
  });

  it('returns PASSWORD_REQUIRED when link has a password hash', () => {
    const link = mockLink({ password_hash: '$2b$10$hashedpassword' });
    const result = resolveRedirect(link, new Date());
    expect(result.type).toBe('password_required');
  });

  it('allows redirect when expires_at is in the future', () => {
    const futureDate = new Date(Date.now() + 60_000).toISOString();
    const link = mockLink({ expires_at: futureDate });
    const result = resolveRedirect(link, new Date());
    expect(result.type).toBe('redirect');
  });

  it('expires takes priority over password (expired link is never password-prompted)', () => {
    const pastDate = new Date(Date.now() - 1000).toISOString();
    const link = mockLink({
      expires_at: pastDate,
      password_hash: '$2b$10$hashedpassword',
    });
    const result = resolveRedirect(link, new Date());
    expect(result.type).toBe('expired');
  });
});
