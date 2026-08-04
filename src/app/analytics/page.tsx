'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import UserNav from '@/components/UserNav';

interface RecentLinkItem {
  short_code: string;
  short_url: string;
  original_url: string;
  created_at: string;
}

export default function AnalyticsHubPage() {
  const router = useRouter();
  const [searchCode, setSearchCode] = useState('');
  const [recentLinks, setRecentLinks] = useState<RecentLinkItem[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('shawty_recent_links');
      if (saved) {
        const parsed = JSON.parse(saved) as RecentLinkItem[];
        setRecentLinks(parsed);
      }
    } catch {
      // ignore local storage errors
    }
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const cleanCode = searchCode.trim().replace(/^\//, '').replace(/^.*shawty\.link\//, '').replace(/^.*localhost:3000\//, '');
    if (!cleanCode) return;
    router.push(`/stats/${cleanCode}`);
  }

  function clearHistory() {
    try {
      localStorage.removeItem('shawty_recent_links');
      setRecentLinks([]);
    } catch {
      // ignore
    }
  }

  return (
    <div className="analytics-hub-page">
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
        {/* Hero Section */}
        <section className="hero-section" style={{ marginBottom: '3rem' }}>
          <h1 className="hero-title">Track Your Link Performance</h1>
          <p className="hero-subtitle">
            Enter a Shawty short code below to view real-time click counts, device
            breakdowns, geographic data, and referrer analytics.
          </p>

          {/* Search Card */}
          <div className="form-card glass-card soft-glow" style={{ maxWidth: '640px', padding: '2rem' }}>
            <form onSubmit={handleSearch} className="search-form">
              <div className="search-input-wrap">
                <span className="search-prefix">shawty.link/</span>
                <input
                  id="search-code-input"
                  className="search-input"
                  type="text"
                  placeholder="e.g. my-campaign or abcd12"
                  value={searchCode}
                  onChange={(e) => setSearchCode(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn-copy-main" style={{ whiteSpace: 'nowrap' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>
                  monitoring
                </span>
                <span>View Stats</span>
              </button>
            </form>
          </div>
        </section>

        {/* Recent Links Section */}
        <section className="recent-section">
          <div className="recent-header-row">
            <div>
              <h2 className="section-title" style={{ marginBottom: '0.25rem' }}>
                Your Recent Links
              </h2>
              <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.95rem' }}>
                Links created on this browser appear here for quick access.
              </p>
            </div>
            {recentLinks.length > 0 && (
              <button
                type="button"
                onClick={clearHistory}
                className="btn-clear"
                title="Clear local history"
              >
                Clear History
              </button>
            )}
          </div>

          {recentLinks.length === 0 ? (
            <div className="empty-card glass-card">
              <span className="material-symbols-outlined" style={{ fontSize: '3rem', color: 'var(--tertiary)' }}>
                link_off
              </span>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', color: 'var(--on-bg)', marginTop: '0.75rem' }}>
                No recent links yet
              </h3>
              <p style={{ color: 'var(--on-surface-variant)', marginTop: '0.35rem' }}>
                When you shorten links on Shawty, they will be saved here automatically.
              </p>
              <a href="/" className="btn-shorten" style={{ display: 'inline-flex', marginTop: '1.5rem', textDecoration: 'none' }}>
                Shorten your first link
              </a>
            </div>
          ) : (
            <div className="recent-grid">
              {recentLinks.map((item) => (
                <div key={item.short_code} className="recent-card glass-card">
                  <div className="recent-card-top">
                    <span className="short-code-badge">/{item.short_code}</span>
                    <span className="created-date">
                      {new Date(item.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <a
                    href={item.original_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="original-url-text"
                  >
                    {item.original_url}
                  </a>

                  <div className="recent-card-actions">
                    <a href={`/stats/${item.short_code}`} className="btn-stats-link">
                      <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>
                        bar_chart
                      </span>
                      <span>Analytics Dashboard</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <style>{`
        .analytics-hub-page {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background-color: var(--bg);
          position: relative;
          overflow-x: hidden;
        }
        .search-form {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
        }
        .search-input-wrap {
          flex: 1;
          min-width: 240px;
          display: flex;
          align-items: center;
          background-color: var(--bakery-cream);
          border: 2px solid var(--surface-variant);
          border-radius: 0.75rem;
          padding: 0.6rem 1rem;
          transition: all 0.2s ease;
        }
        .search-input-wrap:focus-within {
          border-color: var(--primary);
          background-color: #ffffff;
          box-shadow: 0 0 0 4px rgba(151, 72, 34, 0.12);
        }
        .search-prefix {
          font-family: var(--font-mono);
          color: var(--tertiary);
          font-weight: 500;
          user-select: none;
        }
        .search-input {
          width: 100%;
          border: none;
          background: transparent;
          font-family: var(--font-body);
          font-size: 1rem;
          color: var(--on-bg);
          outline: none;
        }
        .recent-section {
          max-width: 900px;
          margin: 0 auto;
        }
        .recent-header-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
          gap: 1rem;
        }
        .btn-clear {
          background: transparent;
          border: 1px solid var(--outline-variant);
          color: var(--secondary);
          padding: 0.5rem 1rem;
          border-radius: 0.5rem;
          font-family: var(--font-body);
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .btn-clear:hover {
          border-color: var(--error-red);
          color: var(--error-red);
        }
        .empty-card {
          padding: 3.5rem 2rem;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .recent-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.5rem;
        }
        @media (max-width: 768px) {
          .recent-grid {
            grid-template-columns: 1fr;
          }
        }
        .recent-card {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
          transition: transform 0.25s ease, box-shadow 0.25s ease;
        }
        .recent-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 25px rgba(151, 72, 34, 0.08);
        }
        .recent-card-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .short-code-badge {
          font-family: var(--font-mono);
          font-size: 1.05rem;
          font-weight: 600;
          color: var(--primary);
        }
        .created-date {
          font-size: 0.78rem;
          color: var(--secondary);
          font-family: var(--font-mono);
        }
        .original-url-text {
          font-size: 0.88rem;
          color: var(--on-surface-variant);
          text-decoration: none;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          word-break: break-all;
        }
        .original-url-text:hover {
          color: var(--primary);
          text-decoration: underline;
        }
        .recent-card-actions {
          margin-top: auto;
          padding-top: 0.75rem;
          border-top: 1px solid var(--surface-variant);
        }
        .btn-stats-link {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.88rem;
          font-weight: 600;
          color: var(--primary);
          text-decoration: none;
          transition: color 0.2s ease;
        }
        .btn-stats-link:hover {
          color: var(--on-primary-container);
        }
      `}</style>
    </div>
  );
}
