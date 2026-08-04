import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/db', () => ({
  db: {
    link: {
      findUnique: vi.fn(),
    },
    click: {
      groupBy: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

import { db } from '@/lib/db';
import { GET } from '@/app/api/links/[code]/stats/route';

describe('GET /api/links/[code]/stats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 404 when link does not exist', async () => {
    vi.mocked(db.link.findUnique).mockResolvedValue(null);

    const req = new NextRequest('http://localhost:3000/api/links/nonexistent/stats');
    const res = await GET(req, { params: { code: 'nonexistent' } });
    const json = await res.json();

    expect(res.status).toBe(404);
    expect(json.error).toBe('Link not found');
  });

  it('returns comprehensive analytics when link exists', async () => {
    const mockLink = {
      id: 'uuid-1234',
      shortCode: 'my-video',
      originalUrl: 'https://youtube.com',
      clickCount: 10,
      maxClicks: 100,
      expiresAt: null,
      isActive: true,
      createdAt: new Date('2026-08-01T00:00:00Z'),
    };

    vi.mocked(db.link.findUnique).mockResolvedValue(mockLink as any);

    // Mock Promise.all aggregations:
    // 1. uniqueVisitorsResult -> 2 unique IPs
    // 2. deviceCounts -> desktop (7), mobile (3)
    // 3. browserCounts -> Chrome (8), Safari (2)
    // 4. referrerCounts -> Twitter (6), Direct (4)
    // 5. recentClicks -> array of 1 click
    vi.mocked(db.click.groupBy)
      .mockResolvedValueOnce([{ ipHash: 'ip1' }, { ipHash: 'ip2' }] as any)
      .mockResolvedValueOnce([
        { deviceType: 'desktop', _count: { _all: 7 } },
        { deviceType: 'mobile', _count: { _all: 3 } },
      ] as any)
      .mockResolvedValueOnce([
        { browser: 'Chrome', _count: { _all: 8 } },
        { browser: 'Safari', _count: { _all: 2 } },
      ] as any)
      .mockResolvedValueOnce([
        { referrer: 'https://twitter.com', _count: { _all: 6 } },
        { referrer: null, _count: { _all: 4 } },
      ] as any);

    vi.mocked(db.click.findMany)
      .mockResolvedValueOnce([
        {
          id: 'click-1',
          clickedAt: new Date('2026-08-04T12:00:00Z'),
          deviceType: 'desktop',
          browser: 'Chrome',
          referrer: 'https://twitter.com',
          country: 'US',
        },
      ] as any)
      .mockResolvedValueOnce([] as any); // for fourteenDaysAgo window query

    const req = new NextRequest('http://localhost:3000/api/links/my-video/stats');
    const res = await GET(req, { params: { code: 'my-video' } });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.link.short_code).toBe('my-video');
    expect(json.metrics.total_clicks).toBe(10);
    expect(json.metrics.unique_visitors).toBe(2);
    expect(json.clicks_by_device).toHaveLength(2);
    expect(json.clicks_by_device[0]).toEqual({
      device: 'desktop',
      count: 7,
      percentage: 70,
    });
    expect(json.clicks_by_browser[0]).toEqual({
      browser: 'Chrome',
      count: 8,
      percentage: 80,
    });
    expect(json.clicks_by_referrer[0]).toEqual({
      referrer: 'https://twitter.com',
      count: 6,
      percentage: 60,
    });
    expect(json.recent_clicks).toHaveLength(1);
    expect(json.recent_clicks[0].browser).toBe('Chrome');
  });
});
