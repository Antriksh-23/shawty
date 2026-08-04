import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { redis, codeKey } from '@/lib/redis';
import { getCurrentUser } from '@/lib/auth';
import type { ApiError } from '@/lib/types';

interface RouteParams {
  params: { id: string };
}

export async function DELETE(
  req: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const { id } = params;

  try {
    const payload = await getCurrentUser(req);
    if (!payload) {
      return NextResponse.json(
        { error: 'Please sign in to delete links' } satisfies ApiError,
        { status: 401 }
      );
    }

    const link = await db.link.findUnique({
      where: { id },
      select: { id: true, userId: true, shortCode: true },
    });

    if (!link || link.userId !== payload.userId) {
      return NextResponse.json(
        { error: 'Link not found or permission denied' } satisfies ApiError,
        { status: 404 }
      );
    }

    // Delete from Postgres and evict from Redis cache in parallel
    await Promise.all([
      db.link.delete({ where: { id: link.id } }),
      redis.del(codeKey(link.shortCode)).catch(() => {}),
    ]);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error('[Delete Link API] Error:', err);
    return NextResponse.json(
      { error: 'Failed to delete link' } satisfies ApiError,
      { status: 500 }
    );
  }
}
