import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { checkUrl } from '@/lib/safebrowsing';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mockFetch(status: number, body: unknown) {
  return vi.spyOn(global, 'fetch').mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  } as Response);
}

// ─── checkUrl ─────────────────────────────────────────────────────────────────

describe('checkUrl', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns safe=true when no API key is configured (graceful degradation)', async () => {
    const original = process.env.GOOGLE_SAFE_BROWSING_KEY;
    process.env.GOOGLE_SAFE_BROWSING_KEY = '';

    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const result = await checkUrl('https://example.com');

    expect(result.safe).toBe(true);
    expect(result.threats).toHaveLength(0);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('GOOGLE_SAFE_BROWSING_KEY'));

    process.env.GOOGLE_SAFE_BROWSING_KEY = original;
    consoleSpy.mockRestore();
  });

  it('returns safe=true for a clean URL with API key set', async () => {
    process.env.GOOGLE_SAFE_BROWSING_KEY = 'test-key-123';

    // Safe Browsing API returns empty object (no matches) for safe URLs
    mockFetch(200, {});

    const result = await checkUrl('https://example.com');
    expect(result.safe).toBe(true);
    expect(result.threats).toHaveLength(0);

    process.env.GOOGLE_SAFE_BROWSING_KEY = '';
  });

  it('returns safe=false and lists threats for a malicious URL', async () => {
    process.env.GOOGLE_SAFE_BROWSING_KEY = 'test-key-123';

    mockFetch(200, {
      matches: [
        { threatType: 'MALWARE', platformType: 'ANY_PLATFORM', threatEntryType: 'URL' },
        { threatType: 'SOCIAL_ENGINEERING', platformType: 'ANY_PLATFORM', threatEntryType: 'URL' },
      ],
    });

    const result = await checkUrl('https://malware-site.example.com');
    expect(result.safe).toBe(false);
    expect(result.threats).toContain('MALWARE');
    expect(result.threats).toContain('SOCIAL_ENGINEERING');

    process.env.GOOGLE_SAFE_BROWSING_KEY = '';
  });

  it('fails open (safe=true) when the API returns an error status', async () => {
    process.env.GOOGLE_SAFE_BROWSING_KEY = 'test-key-123';

    mockFetch(500, { error: { message: 'Internal error' } });
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const result = await checkUrl('https://example.com');
    expect(result.safe).toBe(true);

    process.env.GOOGLE_SAFE_BROWSING_KEY = '';
    consoleSpy.mockRestore();
  });

  it('fails open (safe=true) on network error', async () => {
    process.env.GOOGLE_SAFE_BROWSING_KEY = 'test-key-123';

    vi.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('Network error'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const result = await checkUrl('https://example.com');
    expect(result.safe).toBe(true);

    process.env.GOOGLE_SAFE_BROWSING_KEY = '';
    consoleSpy.mockRestore();
  });
});
