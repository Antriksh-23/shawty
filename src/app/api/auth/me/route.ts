import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

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
