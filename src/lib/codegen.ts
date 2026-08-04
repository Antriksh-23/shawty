import { createHash, randomBytes } from 'crypto';

// ─── Base62 alphabet ─────────────────────────────────────────────────────────
const BASE62 = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

/**
 * Generate a cryptographically random base62 string of `length` characters.
 * Uses `crypto.randomBytes` — NOT Math.random.
 */
export function generateShortCode(length = 7): string {
  const bytes = randomBytes(length * 2); // extra bytes to handle modulo bias
  let result = '';
  for (let i = 0; i < bytes.length && result.length < length; i++) {
    const idx = bytes[i] % 62;
    // Slight modulo bias mitigation: skip values that would cause bias
    // 256 / 62 = 4.12..., so indices 0–247 are fair (4 * 62 = 248)
    if (bytes[i] < 248) {
      result += BASE62[idx];
    }
  }
  // Fallback: if we didn't collect enough (very rare), recurse once
  if (result.length < length) {
    return generateShortCode(length);
  }
  return result;
}

// ─── Reserved slugs ──────────────────────────────────────────────────────────
// These words cannot be used as custom slugs because they conflict with
// application routes or are confusing.
export const RESERVED_SLUGS = new Set([
  'api',
  'admin',
  'login',
  'signup',
  'register',
  'logout',
  'dashboard',
  'account',
  'settings',
  'profile',
  'health',
  'qr',
  'preview',
  'docs',
  'help',
  'about',
  'terms',
  'privacy',
  'contact',
  'pricing',
  'blog',
  'status',
  'favicon.ico',
  'robots.txt',
  'sitemap.xml',
  '_next',
  '__nextjs',
]);

/**
 * Check if a slug is reserved.
 */
export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.has(slug.toLowerCase());
}

/**
 * Generate a unique short code, checking for collisions via a provided async
 * callback. Accepting a callback (rather than a DB client) keeps this function
 * decoupled from any specific ORM or DB library, and makes it easy to test.
 *
 * @param codeExists - async fn that returns true if the code is already taken
 * @param length     - desired code length (auto-increments on exhaustion)
 * @param maxRetries - max attempts before throwing or increasing length
 */
export async function ensureUniqueCode(
  codeExists: (code: string) => Promise<boolean>,
  length = 7,
  maxRetries = 5
): Promise<string> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const code = generateShortCode(length);
    const taken = await codeExists(code);
    if (!taken) {
      return code;
    }
  }
  // If we hit max retries, try with a longer code
  if (length < 10) {
    return ensureUniqueCode(codeExists, length + 1, maxRetries);
  }
  throw new Error('Failed to generate a unique short code after maximum retries');
}

/**
 * Hash an IP address for privacy-friendly storage (GDPR).
 * Uses SHA-256 with a salt derived from the base URL (acts as a pepper).
 */
export function hashIp(ip: string): string {
  const pepper = process.env.NEXT_PUBLIC_BASE_URL ?? 'shawty-salt';
  return createHash('sha256').update(`${pepper}:${ip}`).digest('hex').slice(0, 32);
}
