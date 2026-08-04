import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { signToken, setAuthCookie } from '@/lib/auth';
import { checkAuthRateLimit, getClientIp } from '@/lib/ratelimit';
import type { ApiError } from '@/lib/types';

export async function POST(req: NextRequest): Promise<NextResponse> {
  const ip = getClientIp(req.headers);
  const rateLimit = await checkAuthRateLimit(ip);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many login attempts. Please try again later.' } satisfies ApiError,
      { status: 429 }
    );
  }

  try {
    const body = (await req.json()) as { email?: string; password?: string };
    const email = body.email?.trim().toLowerCase();
    const password = body.password;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Please enter your email and password' } satisfies ApiError,
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        plan: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' } satisfies ApiError,
        { status: 401 }
      );
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      return NextResponse.json(
        { error: 'Invalid email or password' } satisfies ApiError,
        { status: 401 }
      );
    }

    const token = await signToken({ userId: user.id, email: user.email });

    const res = NextResponse.json(
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

    setAuthCookie(res, token);
    return res;
  } catch (err: unknown) {
    console.error('[Login API] Error:', err);
    const errMsg = err instanceof Error ? err.message : String(err);
    if (errMsg.includes('Table') || errMsg.includes('does not exist') || errMsg.includes('DATABASE_URL') || errMsg.includes('P2021') || errMsg.includes('PrismaClient')) {
      return NextResponse.json(
        { error: 'Database issue detected. Please check DATABASE_URL or run database migration.' } satisfies ApiError,
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to sign in. Please try again later.' } satisfies ApiError,
      { status: 500 }
    );
  }
}
