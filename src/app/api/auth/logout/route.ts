import { NextResponse } from 'next/server';
import { clearAuthCookie } from '@/lib/auth';

export async function POST(): Promise<NextResponse> {
  const res = NextResponse.json({ success: true }, { status: 200 });
  clearAuthCookie(res);
  return res;
}
