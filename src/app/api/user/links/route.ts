import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import type { ApiError } from '@/lib/types';

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const payload = await getCurrentUser(req);
    if (!payload) {
      return NextResponse.json(
        { error: 'Please sign in to view your links' } satisfies ApiError,
        { status: 401 }
      );
    }

    const links = await db.link.findMany({
      where: { userId: payload.userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        shortCode: true,
        originalUrl: true,
        clickCount: true,
        maxClicks: true,
        expiresAt: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      {
        links: links.map((link) => ({
          id: link.id,
          short_code: link.shortCode,
          original_url: link.originalUrl,
          click_count: link.clickCount,
          max_clicks: link.maxClicks,
          expires_at: link.expiresAt ? link.expiresAt.toISOString() : null,
          is_active: link.isActive,
          created_at: link.createdAt.toISOString(),
        })),
      },
      { status: 200 }
    );
  } catch (err) {
    console.error('[User Links API] Error:', err);
    return NextResponse.json(
      { error: 'Failed to retrieve your links' } satisfies ApiError,
      { status: 500 }
    );
  }
}
