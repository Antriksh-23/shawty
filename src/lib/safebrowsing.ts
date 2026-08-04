// ─── Google Safe Browsing API v4 ─────────────────────────────────────────────
// Docs: https://developers.google.com/safe-browsing/v4/lookup-api

const SAFE_BROWSING_API_URL =
  'https://safebrowsing.googleapis.com/v4/threatMatches:find';

const THREAT_TYPES = [
  'MALWARE',
  'SOCIAL_ENGINEERING',
  'UNWANTED_SOFTWARE',
  'POTENTIALLY_HARMFUL_APPLICATION',
];

const PLATFORM_TYPES = ['ANY_PLATFORM'];
const THREAT_ENTRY_TYPES = ['URL'];

export interface SafeBrowsingResult {
  safe: boolean;
  threats: string[];
}

/**
 * Check a URL against the Google Safe Browsing API.
 *
 * - Returns `{ safe: true, threats: [] }` if the URL is clean.
 * - Returns `{ safe: false, threats: [...] }` if threats are detected.
 * - If `GOOGLE_SAFE_BROWSING_KEY` is not set, logs a warning and returns safe
 *   (graceful degradation — the app works without the key configured).
 */
export async function checkUrl(url: string): Promise<SafeBrowsingResult> {
  const apiKey = process.env.GOOGLE_SAFE_BROWSING_KEY;

  if (!apiKey) {
    console.warn(
      '[SafeBrowsing] GOOGLE_SAFE_BROWSING_KEY is not set — skipping malware check. ' +
        'Set this env var to enable protection.'
    );
    return { safe: true, threats: [] };
  }

  const body = {
    client: {
      clientId: 'shawty-url-shortener',
      clientVersion: '1.0.0',
    },
    threatInfo: {
      threatTypes: THREAT_TYPES,
      platformTypes: PLATFORM_TYPES,
      threatEntryTypes: THREAT_ENTRY_TYPES,
      threatEntries: [{ url }],
    },
  };

  try {
    const response = await fetch(`${SAFE_BROWSING_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      // Abort if Safe Browsing API takes > 5s — don't block the user indefinitely
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(`[SafeBrowsing] API error ${response.status}: ${text}`);
      // On API error, default to allowing the URL (availability > safety for MVP)
      // Swap this to `return { safe: false, ... }` if you prefer fail-closed.
      return { safe: true, threats: [] };
    }

    const data = (await response.json()) as {
      matches?: Array<{ threatType: string }>;
    };

    if (data.matches && data.matches.length > 0) {
      const threats = data.matches.map((m) => m.threatType);
      return { safe: false, threats };
    }

    return { safe: true, threats: [] };
  } catch (error) {
    if (error instanceof Error && error.name === 'TimeoutError') {
      console.warn('[SafeBrowsing] API request timed out — skipping check');
    } else {
      console.error('[SafeBrowsing] Unexpected error:', error);
    }
    // Fail open (availability favored) — change to `safe: false` to fail closed
    return { safe: true, threats: [] };
  }
}
