import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import type { ApiError } from '@/lib/types';

interface RouteParams {
  params: { code: string };
}

// ─── POST /api/links/:code/unlock ─────────────────────────────────────────────
export async function POST(
  req: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const { code } = params;

  let body: { password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON' } satisfies ApiError,
      { status: 400 }
    );
  }

  const { password } = body;
  if (!password) {
    return NextResponse.json(
      { error: 'Password is required' } satisfies ApiError,
      { status: 400 }
    );
  }

  const link = await db.link.findUnique({
    where: { shortCode: code },
    select: {
      originalUrl: true,
      passwordHash: true,
      isActive: true,
      expiresAt: true,
      maxClicks: true,
      clickCount: true,
    },
  });

  if (!link || !link.isActive) {
    return NextResponse.json(
      { error: 'Link not found' } satisfies ApiError,
      { status: 404 }
    );
  }

  if (!link.passwordHash) {
    // No password needed — just return the URL
    return NextResponse.json({ redirect_url: link.originalUrl });
  }

  const isValid = await bcrypt.compare(password, link.passwordHash);

  if (!isValid) {
    // Short delay to deter brute-force
    await new Promise((r) => setTimeout(r, 200));
    return NextResponse.json(
      { error: 'Incorrect password' } satisfies ApiError,
      { status: 401 }
    );
  }

  // Increment click count asynchronously
  void db.link
    .update({
      where: { shortCode: code },
      data: { clickCount: { increment: 1 } },
    })
    .catch(console.error);

  return NextResponse.json({ redirect_url: link.originalUrl });
}
