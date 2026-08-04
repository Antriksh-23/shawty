'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import UserNav from '@/components/UserNav';
import QrCodeModal from '@/components/QrCodeModal';
import type { LinkStatsResponse, ApiError } from '@/lib/types';
import { displayDomain } from '@/lib/url-utils';

export default function LinkStatsPage() {
  const params = useParams();
  const code = typeof params?.code === 'string' ? params.code : '';

  const [data, setData] = useState<LinkStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  useEffect(() => {
    if (!code) return;

    async function fetchStats() {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`/api/links/${code}/stats`);
        if (!res.ok) {
          const errData = (await res.json()) as ApiError;
          setError(errData.error ?? 'Failed to load analytics');
          return;
        }
        const stats = (await res.json()) as LinkStatsResponse;
        setData(stats);
      } catch {
        setError('Network error loading analytics. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    void fetchStats();
  }, [code]);

  useEffect(() => {
    if (copied) {
      const t = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(t);
    }
  }, [copied]);

  function handleCopy() {
    if (!data) return;
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const shortUrl = `${origin}/${data.link.short_code}`;
    void navigator.clipboard.writeText(shortUrl);
    setCopied(true);
  }

  if (loading) {
    return (
      <div className="stats-page">
        <div className="blob-bg blob-left" />
        <div className="blob-bg blob-right" />
        <header className="top-header">
          <div className="header-container">
            <a href="/" className="brand-logo">
              <span className="material-symbols-outlined" style={{ fontSize: '2rem' }}>
                bolt
              </span>
              <span>Shawty</span>
            </a>
            <UserNav />
          </div>
        </header>
        <main className="main-content" style={{ textAlign: 'center', padding: '5rem 1rem' }}>
          <div className="glass-card" style={{ maxWidth: '500px', margin: '0 auto', padding: '3rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '2.5rem', color: 'var(--primary)', animation: 'spin 1s linear infinite' }}>
              sync
            </span>
            <p style={{ marginTop: '1rem', color: 'var(--on-surface-variant)', fontWeight: 500 }}>
              Loading analytics for /{code}...
            </p>
          </div>
        </main>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="stats-page">
        <div className="blob-bg blob-left" />
        <div className="blob-bg blob-right" />
        <header className="top-header">
          <div className="header-container">
            <a href="/" className="brand-logo">
              <span className="material-symbols-outlined" style={{ fontSize: '2rem' }}>
                bolt
              </span>
              <span>Shawty</span>
            </a>
            <UserNav />
          </div>
        </header>
        <main className="main-content" style={{ textAlign: 'center', padding: '5rem 1rem' }}>
          <div className="glass-card" style={{ maxWidth: '500px', margin: '0 auto', padding: '3rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '3rem', color: 'var(--error-red)' }}>
              error
            </span>
            <h2 style={{ fontFamily: 'var(--font-display)', marginTop: '1rem', color: 'var(--on-bg)' }}>
              {error || 'Link Not Found'}
            </h2>
            <p style={{ marginTop: '0.5rem', color: 'var(--on-surface-variant)' }}>
              We couldn&apos;t find any analytics for short code <code>/{code}</code>.
            </p>
            <a href="/" className="btn-shorten" style={{ display: 'inline-flex', marginTop: '2rem', textDecoration: 'none' }}>
              Go back home
            </a>
          </div>
        </main>
      </div>
    );
  }

  const domain = displayDomain(data.link.original_url);
  const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
  const maxClickCount = Math.max(...data.clicks_over_time.map((d) => d.count), 1);

  return (
    <div className="stats-page">
      <div className="blob-bg blob-left" />
      <div className="blob-bg blob-right" />

      {/* Top Header */}
      <header className="top-header">
        <div className="header-container">
          <a href="/" className="brand-logo">
            <span className="material-symbols-outlined" style={{ fontSize: '2rem' }}>
              bolt
            </span>
            <span>Shawty</span>
          </a>

          <nav className="brand-nav">
            <a href="/">Shorten</a>
            <a href="/analytics" className="active">
              Analytics
            </a>
            <a href="/api/docs" target="_blank" rel="noopener noreferrer">
              API
            </a>
          </nav>

          <UserNav />
        </div>
      </header>

      {/* Main Container */}
      <main className="main-content">
        {/* Header Title Card */}
        <div className="stats-header-card glass-card">
          <div className="stats-header-left">
            <div className="stats-badge">
              <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>
                monitoring
              </span>
              LIVE ANALYTICS
            </div>
            <h1 className="stats-title">/{data.link.short_code}</h1>
            <div className="stats-destination">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={faviconUrl} alt={`${domain} favicon`} width={20} height={20} style={{ borderRadius: '4px' }} />
              <a href={data.link.original_url} target="_blank" rel="noopener noreferrer" className="destination-link">
                {data.link.original_url}
              </a>
            </div>
          </div>

          <div className="stats-header-right" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => setShowQrModal(true)}
              className="btn-qr-stats"
              title="QR Code"
            >
              <span className="material-symbols-outlined">qr_code_2</span>
              <span>QR Code</span>
            </button>

            <button type="button" onClick={handleCopy} className="btn-copy-main">
              <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>
                {copied ? 'check' : 'content_copy'}
              </span>
              <span>{copied ? 'Copied!' : 'Copy Link'}</span>
            </button>
          </div>
        </div>

        {/* 4 KPI Cards */}
        <div className="kpi-grid">
          <div className="kpi-card glass-card">
            <div className="kpi-icon kpi-icon-primary">
              <span className="material-symbols-outlined">ads_click</span>
            </div>
            <div className="kpi-value">{data.metrics.total_clicks}</div>
            <div className="kpi-label">Total Clicks</div>
          </div>

          <div className="kpi-card glass-card">
            <div className="kpi-icon kpi-icon-success">
              <span className="material-symbols-outlined">group</span>
            </div>
            <div className="kpi-value">{data.metrics.unique_visitors}</div>
            <div className="kpi-label">Unique Visitors</div>
          </div>

          <div className="kpi-card glass-card">
            <div className="kpi-icon kpi-icon-tertiary">
              <span className="material-symbols-outlined">touch_app</span>
            </div>
            <div className="kpi-value">
              {data.link.max_clicks ? `${data.link.click_count}/${data.link.max_clicks}` : '∞'}
            </div>
            <div className="kpi-label">Click Limit</div>
          </div>

          <div className="kpi-card glass-card">
            <div className="kpi-icon kpi-icon-neutral">
              <span className="material-symbols-outlined">verified</span>
            </div>
            <div className="kpi-value" style={{ fontSize: '1.5rem', textTransform: 'capitalize' }}>
              {data.link.is_active ? 'Active' : 'Inactive'}
            </div>
            <div className="kpi-label">
              Created {new Date(data.link.created_at).toLocaleDateString()}
            </div>
          </div>
        </div>

        {/* Clicks Over Time Section */}
        <div className="chart-card glass-card">
          <h2 className="section-title">Clicks (Last 14 Days)</h2>
          <div className="chart-container">
            {data.clicks_over_time.map((item) => {
              const heightPct = Math.round((item.count / maxClickCount) * 100);
              const displayHeight = item.count > 0 ? Math.max(heightPct, 8) : 4;
              const shortDate = item.date.slice(5); // mm-dd
              return (
                <div key={item.date} className="chart-bar-wrap" title={`${item.date}: ${item.count} clicks`}>
                  <div className="chart-bar-count">{item.count > 0 ? item.count : ''}</div>
                  <div
                    className={`chart-bar ${item.count > 0 ? 'active' : ''}`}
                    style={{ height: `${displayHeight}%` }}
                  />
                  <div className="chart-bar-label">{shortDate}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2-Column Breakdowns Grid */}
        <div className="breakdown-grid">
          {/* Left Column: Device & Browser */}
          <div className="breakdown-col">
            {/* Devices Card */}
            <div className="breakdown-card glass-card">
              <h2 className="section-title">Devices</h2>
              {data.clicks_by_device.length === 0 ? (
                <p className="empty-text">No clicks recorded yet.</p>
              ) : (
                <div className="progress-list">
                  {data.clicks_by_device.map((d) => (
                    <div key={d.device} className="progress-item">
                      <div className="progress-info">
                        <span className="progress-name" style={{ textTransform: 'capitalize' }}>
                          {d.device}
                        </span>
                        <span className="progress-stats">
                          {d.count} ({d.percentage}%)
                        </span>
                      </div>
                      <div className="progress-track">
                        <div
                          className="progress-fill progress-fill-primary"
                          style={{ width: `${d.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Browsers Card */}
            <div className="breakdown-card glass-card">
              <h2 className="section-title">Browsers</h2>
              {data.clicks_by_browser.length === 0 ? (
                <p className="empty-text">No clicks recorded yet.</p>
              ) : (
                <div className="progress-list">
                  {data.clicks_by_browser.map((b) => (
                    <div key={b.browser} className="progress-item">
                      <div className="progress-info">
                        <span className="progress-name">{b.browser}</span>
                        <span className="progress-stats">
                          {b.count} ({b.percentage}%)
                        </span>
                      </div>
                      <div className="progress-track">
                        <div
                          className="progress-fill progress-fill-tertiary"
                          style={{ width: `${b.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Referrers & Recent Feed */}
          <div className="breakdown-col">
            {/* Referrers Card */}
            <div className="breakdown-card glass-card">
              <h2 className="section-title">Top Referrers</h2>
              {data.clicks_by_referrer.length === 0 ? (
                <p className="empty-text">No clicks recorded yet.</p>
              ) : (
                <div className="progress-list">
                  {data.clicks_by_referrer.map((r) => (
                    <div key={r.referrer} className="progress-item">
                      <div className="progress-info">
                        <span className="progress-name" style={{ wordBreak: 'break-all' }}>
                          {r.referrer}
                        </span>
                        <span className="progress-stats">
                          {r.count} ({r.percentage}%)
                        </span>
                      </div>
                      <div className="progress-track">
                        <div
                          className="progress-fill progress-fill-success"
                          style={{ width: `${r.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Clicks Card */}
            <div className="breakdown-card glass-card">
              <h2 className="section-title">Recent Clicks</h2>
              {data.recent_clicks.length === 0 ? (
                <p className="empty-text">No clicks recorded yet.</p>
              ) : (
                <div className="recent-list">
                  {data.recent_clicks.map((rc) => (
                    <div key={rc.id} className="recent-item">
                      <div className="recent-left">
                        <span className="material-symbols-outlined" style={{ color: 'var(--tertiary)' }}>
                          {rc.device_type === 'mobile'
                            ? 'smartphone'
                            : rc.device_type === 'tablet'
                              ? 'tablet_mac'
                              : 'desktop_windows'}
                        </span>
                        <div>
                          <div className="recent-browser">
                            {rc.browser} •{' '}
                            <span style={{ textTransform: 'capitalize' }}>{rc.device_type}</span>
                          </div>
                          <div className="recent-ref">{rc.referrer || 'Direct / Bookmark'}</div>
                        </div>
                      </div>
                      <div className="recent-time">
                        {new Date(rc.clicked_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Custom QR Code Modal */}
        <QrCodeModal
          isOpen={showQrModal}
          onClose={() => setShowQrModal(false)}
          shortCode={data.link.short_code}
          shortUrl={shortUrl}
        />
      </main>

      <style>{`
        .btn-qr-stats {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          background: transparent;
          border: 1px solid var(--outline-variant);
          color: var(--primary);
          padding: 0.6rem 1rem;
          border-radius: 0.75rem;
          font-family: var(--font-body);
          font-size: 0.92rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .btn-qr-stats:hover {
          border-color: var(--primary);
          background-color: rgba(151, 72, 34, 0.08);
        }
        .stats-page {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background-color: var(--bg);
          position: relative;
          overflow-x: hidden;
        }
        .stats-header-card {
          padding: 2rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          flex-wrap: wrap;
          gap: 1.5rem;
        }
        .stats-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          background-color: rgba(217, 123, 81, 0.15);
          color: var(--primary);
          font-family: var(--font-mono);
          font-size: 0.82rem;
          font-weight: 600;
          padding: 0.35rem 0.85rem;
          border-radius: 999px;
          margin-bottom: 0.75rem;
        }
        .stats-title {
          font-family: var(--font-display);
          font-size: 2.25rem;
          font-weight: 700;
          color: var(--on-bg);
          margin-bottom: 0.5rem;
        }
        .stats-destination {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .destination-link {
          font-family: var(--font-body);
          font-size: 0.95rem;
          color: var(--on-surface-variant);
          text-decoration: none;
          word-break: break-all;
        }
        .destination-link:hover {
          color: var(--primary);
          text-decoration: underline;
        }
        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.5rem;
          margin-bottom: 2rem;
        }
        @media (max-width: 900px) {
          .kpi-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 500px) {
          .kpi-grid {
            grid-template-columns: 1fr;
          }
        }
        .kpi-card {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          position: relative;
        }
        .kpi-icon {
          width: 2.75rem;
          height: 2.75rem;
          border-radius: 999px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1rem;
        }
        .kpi-icon-primary {
          background-color: rgba(217, 123, 81, 0.18);
          color: var(--primary);
        }
        .kpi-icon-success {
          background-color: rgba(125, 148, 101, 0.18);
          color: var(--success-green);
        }
        .kpi-icon-tertiary {
          background-color: rgba(176, 140, 124, 0.18);
          color: var(--tertiary);
        }
        .kpi-icon-neutral {
          background-color: rgba(100, 93, 86, 0.15);
          color: var(--secondary);
        }
        .kpi-value {
          font-family: var(--font-display);
          font-size: 2rem;
          font-weight: 700;
          color: var(--on-bg);
          margin-bottom: 0.25rem;
        }
        .kpi-label {
          font-family: var(--font-body);
          font-size: 0.88rem;
          color: var(--on-surface-variant);
        }
        .chart-card {
          padding: 2rem;
          margin-bottom: 2rem;
        }
        .section-title {
          font-family: var(--font-display);
          font-size: 1.35rem;
          font-weight: 600;
          color: var(--on-bg);
          margin-bottom: 1.5rem;
        }
        .chart-container {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          height: 180px;
          padding-top: 1.5rem;
          gap: 0.5rem;
        }
        .chart-bar-wrap {
          flex: 1;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-end;
          gap: 0.35rem;
        }
        .chart-bar-count {
          font-family: var(--font-mono);
          font-size: 0.72rem;
          color: var(--primary);
          font-weight: 600;
          min-height: 16px;
        }
        .chart-bar {
          width: 100%;
          max-width: 36px;
          background-color: rgba(217, 123, 81, 0.25);
          border-radius: 4px 4px 0 0;
          transition: height 0.4s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.2s ease;
        }
        .chart-bar.active {
          background-color: var(--primary);
        }
        .chart-bar-wrap:hover .chart-bar {
          background-color: var(--primary-container);
        }
        .chart-bar-label {
          font-family: var(--font-mono);
          font-size: 0.75rem;
          color: var(--tertiary);
        }
        .breakdown-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
        }
        @media (max-width: 900px) {
          .breakdown-grid {
            grid-template-columns: 1fr;
          }
        }
        .breakdown-col {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .breakdown-card {
          padding: 1.75rem;
        }
        .empty-text {
          color: var(--secondary);
          font-size: 0.95rem;
          font-style: italic;
        }
        .progress-list {
          display: flex;
          flex-direction: column;
          gap: 1.1rem;
        }
        .progress-item {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }
        .progress-info {
          display: flex;
          justify-content: space-between;
          font-size: 0.92rem;
        }
        .progress-name {
          font-weight: 500;
          color: var(--on-bg);
        }
        .progress-stats {
          font-family: var(--font-mono);
          color: var(--on-surface-variant);
          font-size: 0.85rem;
        }
        .progress-track {
          width: 100%;
          height: 8px;
          background-color: var(--surface-container);
          border-radius: 999px;
          overflow: hidden;
        }
        .progress-fill {
          height: 100%;
          border-radius: 999px;
          transition: width 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .progress-fill-primary {
          background-color: var(--primary);
        }
        .progress-fill-tertiary {
          background-color: var(--tertiary);
        }
        .progress-fill-success {
          background-color: var(--success-green);
        }
        .recent-list {
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
        }
        .recent-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem;
          background-color: rgba(255, 255, 255, 0.5);
          border: 1px solid var(--surface-variant);
          border-radius: 0.75rem;
        }
        .recent-left {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .recent-browser {
          font-weight: 600;
          font-size: 0.9rem;
          color: var(--on-bg);
        }
        .recent-ref {
          font-size: 0.78rem;
          color: var(--on-surface-variant);
          word-break: break-all;
        }
        .recent-time {
          font-family: var(--font-mono);
          font-size: 0.78rem;
          color: var(--secondary);
          white-space: nowrap;
        }
      `}</style>
    </div>
  );
}
