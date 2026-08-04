// ─── URL Validation & Normalization ──────────────────────────────────────────

/** Schemes that are explicitly disallowed regardless of other checks. */
const BLOCKED_SCHEMES = new Set([
  'javascript',
  'data',
  'vbscript',
  'file',
  'ftp',
  'blob',
]);

/** Slug format: alphanumeric, hyphens, underscores, 1–50 chars */
const SLUG_REGEX = /^[a-zA-Z0-9_-]{1,50}$/;

export interface NormalizeResult {
  ok: true;
  url: string;
}

export interface NormalizeError {
  ok: false;
  reason: string;
}

/**
 * Validate and normalize a user-supplied URL string.
 *
 * - Rejects blocked schemes (javascript:, data:, etc.)
 * - Only allows http and https
 * - Normalizes the URL using the WHATWG URL parser
 * - Rejects obviously invalid URLs
 */
export function normalizeUrl(raw: string): NormalizeResult | NormalizeError {
  const trimmed = raw.trim();

  if (!trimmed) {
    return { ok: false, reason: 'URL cannot be empty' };
  }

  // Reject blocked schemes before even trying to parse.
  // Note: we match just "scheme:" (not "scheme://") because schemes like
  // data: and javascript: don't use //, so the old /:\/\// regex missed them.
  const schemeMatch = trimmed.match(/^([a-zA-Z][a-zA-Z0-9+\-.]*):/);
  if (schemeMatch) {
    const scheme = schemeMatch[1].toLowerCase();
    if (BLOCKED_SCHEMES.has(scheme)) {
      return { ok: false, reason: `URLs with scheme "${scheme}:" are not allowed` };
    }
  }

  // Auto-prepend https:// if no scheme supplied
  const withScheme =
    trimmed.startsWith('http://') || trimmed.startsWith('https://')
      ? trimmed
      : `https://${trimmed}`;

  let parsed: URL;
  try {
    parsed = new URL(withScheme);
  } catch {
    return { ok: false, reason: 'Invalid URL format' };
  }

  // Only http and https are allowed after normalization
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { ok: false, reason: 'Only http and https URLs are supported' };
  }

  // Reject localhost and private IP ranges in production
  if (process.env.NODE_ENV === 'production') {
    const hostname = parsed.hostname.toLowerCase();
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      hostname.startsWith('172.16.') ||
      hostname.endsWith('.local')
    ) {
      return { ok: false, reason: 'Cannot shorten URLs pointing to private/local addresses' };
    }
  }

  // URL must have a valid hostname with at least one dot (no bare hostnames)
  if (!parsed.hostname.includes('.') && parsed.hostname !== 'localhost') {
    return { ok: false, reason: 'URL must have a valid hostname (e.g. example.com)' };
  }

  return { ok: true, url: parsed.toString() };
}

/**
 * Validate a custom slug.
 * Returns null if valid, or an error message string.
 */
export function validateSlug(slug: string): string | null {
  if (!slug) return 'Slug cannot be empty';
  if (slug.length > 50) return 'Slug must be 50 characters or fewer';
  if (!SLUG_REGEX.test(slug)) {
    return 'Slug may only contain letters, numbers, hyphens, and underscores';
  }
  // Leading/trailing hyphens look weird
  if (slug.startsWith('-') || slug.endsWith('-')) {
    return 'Slug cannot start or end with a hyphen';
  }
  return null; // valid
}

/**
 * Extract a best-effort display domain from a URL string.
 * Returns the hostname without 'www.' prefix.
 */
export function displayDomain(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}
