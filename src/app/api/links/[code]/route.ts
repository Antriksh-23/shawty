import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { redis, codeKey, CODE_TTL } from '@/lib/redis';
import { normalizeUrl } from '@/lib/url-utils';
import type { ApiError } from '@/lib/types';

interface RouteParams {
  params: { code: string };
}

// ─── GET /api/links/:code ─────────────────────────────────────────────────────
export async function GET(
  _req: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const { code } = params;

  const link = await db.link.findUnique({
    where: { shortCode: code },
    select: {
      shortCode: true,
      originalUrl: true,
      expiresAt: true,
      maxClicks: true,
      clickCount: true,
      isActive: true,
      createdAt: true,
    },
  });

  if (!link) {
    return NextResponse.json(
      { error: 'Link not found' } satisfies ApiError,
      { status: 404 }
    );
  }

  const now = new Date();
  const isExpiredTime = link.expiresAt ? link.expiresAt <= now : false;
  const isExpiredClicks = link.maxClicks !== null && link.clickCount >= link.maxClicks;

  const status = !link.isActive
    ? 'inactive'
    : isExpiredTime
      ? 'expired_time'
      : isExpiredClicks
        ? 'expired_clicks'
        : 'active';

  return NextResponse.json({
    short_code: link.shortCode,
    original_url: link.originalUrl,
    click_count: link.clickCount,
    expires_at: link.expiresAt?.toISOString() ?? null,
    max_clicks: link.maxClicks,
    is_active: link.isActive && !isExpiredTime && !isExpiredClicks,
    status,
    created_at: link.createdAt.toISOString(),
  });
}

// ─── PUT /api/links/:code ─────────────────────────────────────────────────────
export async function PUT(
  req: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const { code } = params;

  let body: { url?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' } satisfies ApiError,
      { status: 400 }
    );
  }

  const { url } = body;
  if (!url) {
    return NextResponse.json(
      { error: 'url is required' } satisfies ApiError,
      { status: 400 }
    );
  }

  const normalized = normalizeUrl(url);
  if (!normalized.ok) {
    return NextResponse.json(
      { error: normalized.reason } satisfies ApiError,
      { status: 422 }
    );
  }

  // Check the link exists and is active before updating
  const existing = await db.link.findUnique({
    where: { shortCode: code },
    select: { isActive: true },
  });

  if (!existing || !existing.isActive) {
    return NextResponse.json(
      { error: 'Link not found or inactive' } satisfies ApiError,
      { status: 404 }
    );
  }

  const updated = await db.link.update({
    where: { shortCode: code },
    data: { originalUrl: normalized.url },
    select: { shortCode: true, originalUrl: true },
  });

  // Bust Redis cache — redirect will pick up new URL on next request
  await redis.set(codeKey(code), normalized.url, { ex: CODE_TTL });

  return NextResponse.json({
    short_code: updated.shortCode,
    original_url: updated.originalUrl,
    updated: true,
  });
}

// ─── DELETE /api/links/:code ──────────────────────────────────────────────────
export async function DELETE(
  _req: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const { code } = params;

  const existing = await db.link.findUnique({
    where: { shortCode: code },
    select: { id: true },
  });

  if (!existing) {
    return NextResponse.json(
      { error: 'Link not found' } satisfies ApiError,
      { status: 404 }
    );
  }

  await db.link.update({
    where: { shortCode: code },
    data: { isActive: false },
  });

  // Remove from Redis cache
  await redis.del(codeKey(code));

  return NextResponse.json({ short_code: code, deleted: true });
}
