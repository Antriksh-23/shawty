import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { redis, codeKey, CODE_TTL } from '@/lib/redis';
import { ensureUniqueCode, isReservedSlug } from '@/lib/codegen';
import { normalizeUrl, validateSlug } from '@/lib/url-utils';
import { checkUrl } from '@/lib/safebrowsing';
import { checkRateLimit, getClientIp } from '@/lib/ratelimit';
import { getCurrentUser } from '@/lib/auth';
import type { CreateLinkRequest, CreateLinkResponse, ApiError } from '@/lib/types';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS ?? '12', 10);

export const dynamic = 'force-dynamic';

// ─── POST /api/links ─────────────────────────────────────────────────────────
export async function POST(req: NextRequest): Promise<NextResponse<CreateLinkResponse | ApiError>> {
  // 1. Rate limiting
  const ip = getClientIp(req.headers);
  const rateLimit = await checkRateLimit(ip);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: 'Rate limit exceeded. Please wait before creating more links.',
        code: 'RATE_LIMITED',
      } satisfies ApiError,
      {
        status: 429,
        headers: {
          'Retry-After': String(rateLimit.resetAt - Math.floor(Date.now() / 1000)),
          'X-RateLimit-Limit': String(rateLimit.limit),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(rateLimit.resetAt),
        },
      }
    );
  }

  // 2. Parse request body
  let body: CreateLinkRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' } satisfies ApiError,
      { status: 400 }
    );
  }

  const { url, custom_slug, expires_at, password, max_clicks } = body;

  // 3. Validate URL
  const normalized = normalizeUrl(url ?? '');
  if (!normalized.ok) {
    return NextResponse.json(
      { error: normalized.reason } satisfies ApiError,
      { status: 422 }
    );
  }
  const originalUrl = normalized.url;

  // 4. Google Safe Browsing check
  const safety = await checkUrl(originalUrl);
  if (!safety.safe) {
    return NextResponse.json(
      {
        error: `This URL has been flagged as unsafe: ${safety.threats.join(', ')}. Link creation blocked.`,
        code: 'URL_UNSAFE',
      } satisfies ApiError,
      { status: 422 }
    );
  }

  // 5. Validate custom slug if provided
  let shortCode: string;
  if (custom_slug) {
    const slugError = validateSlug(custom_slug);
    if (slugError) {
      return NextResponse.json(
        { error: slugError } satisfies ApiError,
        { status: 422 }
      );
    }
    if (isReservedSlug(custom_slug)) {
      return NextResponse.json(
        { error: `"${custom_slug}" is a reserved word and cannot be used as a slug.` } satisfies ApiError,
        { status: 422 }
      );
    }
    // Check uniqueness in DB
    const existing = await db.link.findUnique({
      where: { shortCode: custom_slug },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json(
        {
          error: `The slug "${custom_slug}" is already taken. Please choose another.`,
          code: 'SLUG_TAKEN',
        } satisfies ApiError,
        { status: 409 }
      );
    }
    shortCode = custom_slug;
  } else {
    // Auto-generate a unique code
    try {
      shortCode = await ensureUniqueCode(async (code) => {
        const existing = await db.link.findUnique({
          where: { shortCode: code },
          select: { id: true },
        });
        return !!existing;
      });
    } catch {
      return NextResponse.json(
        { error: 'Failed to generate a unique short code. Please try again.' } satisfies ApiError,
        { status: 500 }
      );
    }
  }

  // 6. Validate expires_at
  let expiresAt: Date | null = null;
  if (expires_at) {
    const parsed = new Date(expires_at);
    if (isNaN(parsed.getTime())) {
      return NextResponse.json(
        { error: 'Invalid expires_at date format. Use ISO 8601.' } satisfies ApiError,
        { status: 422 }
      );
    }
    if (parsed <= new Date()) {
      return NextResponse.json(
        { error: 'expires_at must be in the future.' } satisfies ApiError,
        { status: 422 }
      );
    }
    expiresAt = parsed;
  }

  // 7. Validate max_clicks
  if (max_clicks !== undefined && (typeof max_clicks !== 'number' || max_clicks < 1)) {
    return NextResponse.json(
      { error: 'max_clicks must be a positive integer.' } satisfies ApiError,
      { status: 422 }
    );
  }

  // 8. Hash password
  let passwordHash: string | null = null;
  if (password) {
    if (password.length < 4) {
      return NextResponse.json(
        { error: 'Link password must be at least 4 characters.' } satisfies ApiError,
        { status: 422 }
      );
    }
    passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  }

  // 9. Check auth session and insert into DB via Prisma
  const currentUser = await getCurrentUser(req);

  const link = await db.link.create({
    data: {
      shortCode,
      originalUrl,
      userId: currentUser?.userId ?? null,
      passwordHash,
      expiresAt,
      maxClicks: max_clicks ?? null,
    },
    select: {
      shortCode: true,
      originalUrl: true,
      expiresAt: true,
      maxClicks: true,
      createdAt: true,
    },
  });

  // 10. Prime Redis cache immediately (non-blocking)
  await redis
    .set(codeKey(shortCode), originalUrl, { ex: CODE_TTL })
    .catch((err) => console.error('[Create Link] Redis cache prime error:', err));

  // Dynamically resolve origin from incoming request headers (fixes broken links when env var is missing)
  const host = req.headers.get('host');
  const protocol = req.headers.get('x-forwarded-proto') ?? (host?.includes('localhost') ? 'http' : 'https');
  const origin = host ? `${protocol}://${host}` : BASE_URL;
  const shortUrl = `${origin}/${shortCode}`;

  return NextResponse.json(
    {
      short_url: shortUrl,
      short_code: link.shortCode,
      original_url: link.originalUrl,
      expires_at: link.expiresAt?.toISOString() ?? null,
      max_clicks: link.maxClicks,
      created_at: link.createdAt.toISOString(),
    } satisfies CreateLinkResponse,
    {
      status: 201,
      headers: {
        'X-RateLimit-Remaining': String(rateLimit.remaining - 1),
        'X-RateLimit-Reset': String(rateLimit.resetAt),
      },
    }
  );
}

// ─── GET /api/links ──────────────────────────────────────────────────────────
export async function GET(): Promise<NextResponse<ApiError>> {
  return NextResponse.json(
    { error: 'User accounts and authentication are coming in Phase 2.' } satisfies ApiError,
    { status: 501 }
  );
}
