import { NextResponse } from 'next/server';

// ─── GET /api/health ──────────────────────────────────────────────────────────
// Used by Render for health checks and uptime monitoring.
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version ?? '0.1.0',
  });
}
