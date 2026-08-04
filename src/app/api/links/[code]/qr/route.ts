import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';
import { db } from '@/lib/db';
import type { ApiError } from '@/lib/types';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';

interface RouteParams {
  params: { code: string };
}

// ─── GET /api/links/:code/qr ──────────────────────────────────────────────────
export async function GET(
  req: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const { code } = params;
  const { searchParams } = new URL(req.url);
  const theme = searchParams.get('theme') ?? 'default';
  const colorMap: Record<string, { dark: string; light: string }> = {
    warm: { dark: '#974822', light: '#ffffff' },
    bakery: { dark: '#974822', light: '#f5ebe6' },
    dark: { dark: '#1e1e1e', light: '#ffffff' },
    default: { dark: '#0f0f0f', light: '#ffffff' },
  };
  const color = colorMap[theme] || colorMap.default;

  const link = await db.link.findUnique({
    where: { shortCode: code, isActive: true },
    select: { id: true },
  });

  if (!link) {
    return NextResponse.json(
      { error: 'Link not found or inactive' } satisfies ApiError,
      { status: 404 }
    );
  }

  const shortUrl = `${BASE_URL}/${code}`;

  try {
    if (format === 'svg') {
      const svg = await QRCode.toString(shortUrl, {
        type: 'svg',
        margin: 2,
        color,
        errorCorrectionLevel: 'M',
      });
      return new NextResponse(svg, {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'public, max-age=86400, immutable',
          'Content-Disposition': `inline; filename="shawty-${code}-${theme}.svg"`,
        },
      });
    }

    const buffer = await QRCode.toBuffer(shortUrl, {
      type: 'png',
      margin: 2,
      width: 400,
      color,
      errorCorrectionLevel: 'M',
    });

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=86400, immutable',
        'Content-Disposition': `inline; filename="shawty-${code}.png"`,
      },
    });
  } catch (error) {
    console.error('[QR] Error generating QR code:', error);
    return NextResponse.json(
      { error: 'Failed to generate QR code' } satisfies ApiError,
      { status: 500 }
    );
  }
}
