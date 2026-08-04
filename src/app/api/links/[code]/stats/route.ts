import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import type { ApiError } from '@/lib/types';

interface RouteParams {
  params: { code: string };
}

export async function GET(
  _req: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const { code } = params;

  try {
    let link = await db.link.findUnique({
      where: { shortCode: code },
      select: {
        id: true,
        shortCode: true,
        originalUrl: true,
        clickCount: true,
        maxClicks: true,
        expiresAt: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (!link) {
      link = await db.link.findFirst({
        where: { shortCode: { equals: code, mode: 'insensitive' } },
        select: {
          id: true,
          shortCode: true,
          originalUrl: true,
          clickCount: true,
          maxClicks: true,
          expiresAt: true,
          isActive: true,
          createdAt: true,
        },
      });
    }

    if (!link) {
      return NextResponse.json(
        { error: 'Link not found' } satisfies ApiError,
        { status: 404 }
      );
    }

    // Run aggregations in parallel for maximum speed
    const [uniqueVisitorsResult, deviceCounts, browserCounts, referrerCounts, recentClicks] =
      await Promise.all([
        db.click.groupBy({
          by: ['ipHash'],
          where: { linkId: link.id, ipHash: { not: null } },
        }),
        db.click.groupBy({
          by: ['deviceType'],
          where: { linkId: link.id },
          _count: { _all: true },
        }),
        db.click.groupBy({
          by: ['browser'],
          where: { linkId: link.id },
          _count: { _all: true },
        }),
        db.click.groupBy({
          by: ['referrer'],
          where: { linkId: link.id },
          _count: { _all: true },
          orderBy: { _count: { referrer: 'desc' } },
          take: 8,
        }),
        db.click.findMany({
          where: { linkId: link.id },
          orderBy: { clickedAt: 'desc' },
          take: 15,
          select: {
            id: true,
            clickedAt: true,
            deviceType: true,
            browser: true,
            referrer: true,
            country: true,
          },
        }),
      ]);

    const totalClicks = link.clickCount;
    const uniqueVisitors = uniqueVisitorsResult.length;

    // Calculate percentages for device types
    const clicksByDevice = deviceCounts.map((d) => {
      const count = d._count._all;
      const device = d.deviceType ?? 'unknown';
      const pct = totalClicks > 0 ? Math.round((count / totalClicks) * 100) : 0;
      return { device, count, percentage: pct };
    });

    // Calculate percentages for browsers
    const clicksByBrowser = browserCounts.map((b) => {
      const count = b._count._all;
      const browser = b.browser ?? 'Other';
      const pct = totalClicks > 0 ? Math.round((count / totalClicks) * 100) : 0;
      return { browser, count, percentage: pct };
    });

    // Calculate percentages for referrers
    const clicksByReferrer = referrerCounts.map((r) => {
      const count = r._count._all;
      const referrer = r.referrer ? r.referrer : 'Direct / Bookmark';
      const pct = totalClicks > 0 ? Math.round((count / totalClicks) * 100) : 0;
      return { referrer, count, percentage: pct };
    });

    // Generate 14-day daily click history
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 13);
    fourteenDaysAgo.setHours(0, 0, 0, 0);

    const clicksInWindow = await db.click.findMany({
      where: {
        linkId: link.id,
        clickedAt: { gte: fourteenDaysAgo },
      },
      select: { clickedAt: true },
    });

    const dateMap = new Map<string, number>();
    for (let i = 0; i < 14; i++) {
      const d = new Date(fourteenDaysAgo);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().split('T')[0];
      dateMap.set(key, 0);
    }

    for (const c of clicksInWindow) {
      const key = c.clickedAt.toISOString().split('T')[0];
      if (dateMap.has(key)) {
        dateMap.set(key, (dateMap.get(key) ?? 0) + 1);
      }
    }

    const clicksOverTime = Array.from(dateMap.entries()).map(([date, count]) => ({
      date,
      count,
    }));

    return NextResponse.json(
      {
        link: {
          short_code: link.shortCode,
          original_url: link.originalUrl,
          click_count: link.clickCount,
          max_clicks: link.maxClicks,
          expires_at: link.expiresAt ? link.expiresAt.toISOString() : null,
          is_active: link.isActive,
          created_at: link.createdAt.toISOString(),
        },
        metrics: {
          total_clicks: totalClicks,
          unique_visitors: uniqueVisitors,
        },
        clicks_by_device: clicksByDevice,
        clicks_by_browser: clicksByBrowser,
        clicks_by_referrer: clicksByReferrer,
        clicks_over_time: clicksOverTime,
        recent_clicks: recentClicks.map((rc) => ({
          id: rc.id,
          clicked_at: rc.clickedAt.toISOString(),
          device_type: rc.deviceType ?? 'desktop',
          browser: rc.browser ?? 'Other',
          referrer: rc.referrer ?? 'Direct',
        })),
      },
      { status: 200 }
    );
  } catch (err) {
    console.error('[Stats API] Error retrieving stats:', err);
    return NextResponse.json(
      { error: 'Failed to retrieve analytics' } satisfies ApiError,
      { status: 500 }
    );
  }
}
