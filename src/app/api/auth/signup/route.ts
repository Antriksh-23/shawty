import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { signToken, setAuthCookie } from '@/lib/auth';
import { checkAuthRateLimit, getClientIp } from '@/lib/ratelimit';
import type { ApiError } from '@/lib/types';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest): Promise<NextResponse> {
  const ip = getClientIp(req.headers);
  const rateLimit = await checkAuthRateLimit(ip);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many account creation attempts. Please try again later.' } satisfies ApiError,
      { status: 429 }
    );
  }

  try {
    const body = (await req.json()) as { email?: string; password?: string };
    const email = body.email?.trim().toLowerCase();
    const password = body.password;

    if (!email || !EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' } satisfies ApiError,
        { status: 400 }
      );
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' } satisfies ApiError,
        { status: 400 }
      );
    }

    const existingUser = await db.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' } satisfies ApiError,
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await db.user.create({
      data: {
        email,
        passwordHash,
      },
      select: {
        id: true,
        email: true,
        plan: true,
        createdAt: true,
      },
    });

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
      { status: 201 }
    );

    setAuthCookie(res, token);
    return res;
  } catch (err) {
    console.error('[Signup API] Error:', err);
    return NextResponse.json(
      { error: 'Failed to create account. Please try again later.' } satisfies ApiError,
      { status: 500 }
    );
  }
}
