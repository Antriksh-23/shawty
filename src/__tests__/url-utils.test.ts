import { describe, it, expect } from 'vitest';
import { normalizeUrl, validateSlug, displayDomain } from '@/lib/url-utils';

// ─── normalizeUrl ─────────────────────────────────────────────────────────────

describe('normalizeUrl', () => {
  it('accepts a valid https URL', () => {
    const result = normalizeUrl('https://example.com/path?q=1');
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.url).toContain('https://example.com');
  });

  it('accepts a valid http URL', () => {
    const result = normalizeUrl('http://example.com');
    expect(result.ok).toBe(true);
  });

  it('auto-prepends https:// if no scheme given', () => {
    const result = normalizeUrl('example.com/path');
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.url.startsWith('https://')).toBe(true);
  });

  it('rejects javascript: scheme', () => {
    const result = normalizeUrl('javascript:alert(1)');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain('javascript');
  });

  it('rejects data: scheme', () => {
    const result = normalizeUrl('data:text/html,<h1>hi</h1>');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain('data');
  });

  it('rejects file: scheme', () => {
    const result = normalizeUrl('file:///etc/passwd');
    expect(result.ok).toBe(false);
  });

  it('rejects vbscript: scheme', () => {
    const result = normalizeUrl('vbscript:msgbox("xss")');
    expect(result.ok).toBe(false);
  });

  it('rejects empty string', () => {
    const result = normalizeUrl('');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain('empty');
  });

  it('rejects an invalid URL', () => {
    const result = normalizeUrl('not a url at all !!!');
    expect(result.ok).toBe(false);
  });

  it('rejects a URL with no dot in hostname (bare hostname)', () => {
    const result = normalizeUrl('https://notadomain');
    expect(result.ok).toBe(false);
  });

  it('normalizes a URL with extra whitespace', () => {
    const result = normalizeUrl('   https://example.com   ');
    expect(result.ok).toBe(true);
  });
});

// ─── validateSlug ─────────────────────────────────────────────────────────────

describe('validateSlug', () => {
  it('accepts a valid alphanumeric slug', () => {
    expect(validateSlug('my-link')).toBeNull();
    expect(validateSlug('product123')).toBeNull();
    expect(validateSlug('sale_2025')).toBeNull();
  });

  it('rejects slugs with special characters', () => {
    expect(validateSlug('my link')).not.toBeNull(); // space
    expect(validateSlug('my@link')).not.toBeNull(); // @
    expect(validateSlug('my/link')).not.toBeNull(); // slash
    expect(validateSlug('../etc/passwd')).not.toBeNull(); // path traversal
  });

  it('rejects empty slug', () => {
    expect(validateSlug('')).not.toBeNull();
  });

  it('rejects slug longer than 50 chars', () => {
    expect(validateSlug('a'.repeat(51))).not.toBeNull();
  });

  it('accepts slug exactly 50 chars', () => {
    expect(validateSlug('a'.repeat(50))).toBeNull();
  });

  it('rejects slug starting with hyphen', () => {
    expect(validateSlug('-bad-slug')).not.toBeNull();
  });

  it('rejects slug ending with hyphen', () => {
    expect(validateSlug('bad-slug-')).not.toBeNull();
  });
});

// ─── displayDomain ────────────────────────────────────────────────────────────

describe('displayDomain', () => {
  it('strips www. prefix', () => {
    expect(displayDomain('https://www.example.com/path')).toBe('example.com');
  });

  it('returns hostname without www.', () => {
    expect(displayDomain('https://example.com')).toBe('example.com');
  });

  it('handles subdomain correctly', () => {
    expect(displayDomain('https://app.example.com')).toBe('app.example.com');
  });

  it('returns the raw string on invalid URL', () => {
    const raw = 'not-a-url';
    expect(displayDomain(raw)).toBe(raw);
  });
});
