import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser, clearAuthCookie } from '@/lib/auth';
import type { ApiError } from '@/lib/types';

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const payload = await getCurrentUser(req);
    if (!payload) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const user = await db.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        plan: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    return NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          plan: user.plan,
          created_at: user.createdAt.toISOString(),
        },
      },
      { status: 200 }
    );
  } catch (err) {
    console.error('[Me API] Error:', err);
    return NextResponse.json({ user: null }, { status: 200 });
  }
}

// ─── DELETE /api/auth/me (Account & Data Deletion Flow) ──────────────────────
export async function DELETE(req: NextRequest): Promise<NextResponse> {
  try {
    const payload = await getCurrentUser(req);
    if (!payload) {
      return NextResponse.json(
        { error: 'Not authenticated' } satisfies ApiError,
        { status: 401 }
      );
    }

    // Delete all links created by this user and delete the user account
    await db.$transaction([
      db.link.deleteMany({ where: { userId: payload.userId } }),
      db.user.delete({ where: { id: payload.userId } }),
    ]);

    const res = NextResponse.json(
      { success: true, message: 'Account and all personal data deleted successfully.' },
      { status: 200 }
    );
    clearAuthCookie(res);
    return res;
  } catch (err) {
    console.error('[Me API Delete] Error:', err);
    return NextResponse.json(
      { error: 'Failed to delete account' } satisfies ApiError,
      { status: 500 }
    );
  }
}

