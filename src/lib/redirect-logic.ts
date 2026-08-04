// ─── Pure redirect resolution logic ───────────────────────────────────────────
// This module is extracted from the route handler so that it can be unit-tested
// without needing a Next.js request/response context.

export interface LinkRecord {
  short_code: string;
  original_url: string;
  password_hash: string | null;
  expires_at: string | null;
  max_clicks: number | null;
  click_count: number;
  is_active: boolean;
}

export type RedirectResult =
  | { type: 'redirect'; url: string }
  | { type: 'expired'; reason: string }
  | { type: 'inactive' }
  | { type: 'not_found' }
  | { type: 'password_required' };

/**
 * Pure function that resolves how to handle a redirect given a link record.
 * All edge cases are checked in priority order:
 *   1. Inactive
 *   2. Time expiry
 *   3. Click limit
 *   4. Password protection
 *   5. Active → redirect
 *
 * This function has no side effects and can be tested without mocks.
 */
export function resolveRedirect(
  link: LinkRecord,
  now: Date = new Date()
): RedirectResult {
  // 1. Inactive
  if (!link.is_active) {
    return { type: 'inactive' };
  }

  // 2. Expired by time
  if (link.expires_at && new Date(link.expires_at) <= now) {
    return { type: 'expired', reason: 'This link has expired.' };
  }

  // 3. Expired by click limit
  if (link.max_clicks !== null && link.click_count >= link.max_clicks) {
    return {
      type: 'expired',
      reason: 'This link has reached its maximum number of uses.',
    };
  }

  // 4. Password protection — show interstitial
  if (link.password_hash) {
    return { type: 'password_required' };
  }

  // 5. All good — redirect
  return { type: 'redirect', url: link.original_url };
}
