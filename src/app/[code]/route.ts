import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { redis, codeKey, CODE_TTL } from '@/lib/redis';
import { hashIp } from '@/lib/codegen';
import { resolveRedirect } from '@/lib/redirect-logic';

interface RouteParams {
  params: { code: string };
}

// ─── GET /:code ───────────────────────────────────────────────────────────────
// This is the highest-traffic route. Every millisecond counts.
//
// Hot path (Redis cache hit):
//   1. Redis GET          ~0.5ms
//   2. 302 redirect       total < 3ms
//
// Cold path (cache miss):
//   1. Redis GET (miss)   ~0.5ms
//   2. Prisma findUnique  ~2-5ms
//   3. Redis SET (async)  non-blocking
//   4. Click log (async)  non-blocking
//   5. 302 redirect       total < 8ms
//
export async function GET(
  req: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const { code } = params;

  // ── 1. Check Redis cache ──────────────────────────────────────────────────
  let cachedUrl: string | null = null;
  try {
    cachedUrl = await redis.get<string>(codeKey(code));
  } catch (err) {
    // Redis unavailable — fall through to DB. App stays up.
    console.error('[Redirect] Redis error, falling back to DB:', err);
  }

  if (cachedUrl) {
    // Cache HIT — fastest path, fire-and-forget click log
    void logClickAsync(req, code);
    return NextResponse.redirect(cachedUrl, {
      status: 302,
      headers: { 'X-Cache': 'HIT' },
    });
  }

  // ── 2. Cache MISS — query Postgres via Prisma ─────────────────────────────
  const link = await db.link.findUnique({
    where: { shortCode: code },
    select: {
      shortCode: true,
      originalUrl: true,
      passwordHash: true,
      expiresAt: true,
      maxClicks: true,
      clickCount: true,
      isActive: true,
    },
  });

  // ── 3. Not found ──────────────────────────────────────────────────────────
  if (!link) {
    return notFoundResponse(code);
  }

  // ── 4. Resolve redirect using shared pure logic ───────────────────────────
  const resolution = resolveRedirect(
    {
      short_code: link.shortCode,
      original_url: link.originalUrl,
      password_hash: link.passwordHash,
      expires_at: link.expiresAt?.toISOString() ?? null,
      max_clicks: link.maxClicks,
      click_count: link.clickCount,
      is_active: link.isActive,
    },
    new Date()
  );

  if (resolution.type === 'inactive' || resolution.type === 'not_found') {
    return expiredResponse('This link has been deactivated.');
  }

  if (resolution.type === 'expired') {
    return expiredResponse(resolution.reason);
  }

  if (resolution.type === 'password_required') {
    const previewUrl = new URL(`/${code}/preview`, req.url);
    previewUrl.searchParams.set('pw', '1');
    return NextResponse.redirect(previewUrl.toString(), { status: 302 });
  }

  const originalUrl = resolution.url;

  // ── 5. Cache for future requests (non-blocking) ───────────────────────────
  void redis
    .set(codeKey(code), originalUrl, { ex: CODE_TTL })
    .catch((err) => console.error('[Redirect] Redis cache write error:', err));

  // ── 6. Log click asynchronously (non-blocking) ────────────────────────────
  void logClickAsync(req, code);

  // ── 7. Redirect ───────────────────────────────────────────────────────────
  return NextResponse.redirect(originalUrl, {
    status: 302,
    headers: { 'X-Cache': 'MISS' },
  });
}

// ─── Async click logging (fire-and-forget) ────────────────────────────────────
async function logClickAsync(req: NextRequest, code: string): Promise<void> {
  try {
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      req.headers.get('x-real-ip') ??
      '127.0.0.1';
    const ipHash = hashIp(ip);
    const referrer = req.headers.get('referer') ?? null;
    const userAgent = req.headers.get('user-agent') ?? '';

    const deviceType = /mobile|android|iphone|ipad/i.test(userAgent)
      ? 'mobile'
      : /tablet/i.test(userAgent)
        ? 'tablet'
        : 'desktop';

    const browser = /edg\//i.test(userAgent)
      ? 'Edge'
      : /opr\//i.test(userAgent) || /opera/i.test(userAgent)
        ? 'Opera'
        : /chrome\//i.test(userAgent) && !/chromium/i.test(userAgent)
          ? 'Chrome'
          : /firefox\//i.test(userAgent)
            ? 'Firefox'
            : /safari\//i.test(userAgent) && !/chrome/i.test(userAgent)
              ? 'Safari'
              : 'Other';

    // Find the link first to get its ID for the click log
    const link = await db.link.findUnique({
      where: { shortCode: code },
      select: { id: true },
    });

    if (!link) return;

    // Run both in parallel: increment counter + insert click record
    await Promise.all([
      db.link.update({
        where: { id: link.id },
        data: { clickCount: { increment: 1 } },
      }),
      db.click.create({
        data: {
          linkId: link.id,
          ipHash,
          referrer,
          deviceType,
          browser,
        },
      }),
    ]);
  } catch (err) {
    // Best-effort logging — never crash the redirect
    console.error('[Redirect] Click logging error:', err);
  }
}

// ─── Response helpers ─────────────────────────────────────────────────────────

function notFoundResponse(code: string): NextResponse {
  return new NextResponse(
    `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Link Not Found — Shawty</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{min-height:100vh;display:flex;align-items:center;justify-content:center;
      background:#0a0a0f;font-family:'Inter',system-ui,sans-serif;color:#fff}
    .card{text-align:center;padding:3rem 2rem;max-width:400px;
      background:#13131a;border:1px solid #2a2a3a;border-radius:1.5rem}
    .emoji{font-size:4rem;margin-bottom:1rem}
    h1{font-size:1.5rem;margin-bottom:.75rem;color:#e2e8f0}
    p{color:#94a3b8;margin-bottom:1.5rem;line-height:1.6}
    code{background:#1e1e2e;padding:.2em .5em;border-radius:4px;color:#7c86ff}
    a{display:inline-block;padding:.75rem 1.5rem;
      background:linear-gradient(135deg,#6366f1,#8b5cf6);
      color:white;text-decoration:none;border-radius:.75rem;font-weight:600}
  </style>
</head>
<body>
  <div class="card">
    <div class="emoji">🔍</div>
    <h1>Link Not Found</h1>
    <p>The short link <code>/${code}</code> doesn't exist or has been removed.</p>
    <a href="/">Create a new link</a>
  </div>
</body>
</html>`,
    { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  );
}

function expiredResponse(message: string): NextResponse {
  return new NextResponse(
    `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Link Expired — Shawty</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{min-height:100vh;display:flex;align-items:center;justify-content:center;
      background:#0a0a0f;font-family:'Inter',system-ui,sans-serif;color:#fff}
    .card{text-align:center;padding:3rem 2rem;max-width:400px;
      background:#13131a;border:1px solid #2a2a3a;border-radius:1.5rem}
    .emoji{font-size:4rem;margin-bottom:1rem}
    h1{font-size:1.5rem;margin-bottom:.75rem;color:#e2e8f0}
    p{color:#94a3b8;margin-bottom:1.5rem;line-height:1.6}
    a{display:inline-block;padding:.75rem 1.5rem;
      background:linear-gradient(135deg,#6366f1,#8b5cf6);
      color:white;text-decoration:none;border-radius:.75rem;font-weight:600}
  </style>
</head>
<body>
  <div class="card">
    <div class="emoji">⏰</div>
    <h1>Link Expired</h1>
    <p>${message}</p>
    <a href="/">Create a new link</a>
  </div>
</body>
</html>`,
    { status: 410, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  );
}
