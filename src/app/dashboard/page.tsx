'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import QrCodeModal from '@/components/QrCodeModal';

interface UserProfile {
  id: string;
  email: string;
  plan: string;
  created_at: string;
}

interface UserLink {
  id: string;
  short_code: string;
  original_url: string;
  click_count: number;
  max_clicks: number | null;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
}

export default function UserDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [links, setLinks] = useState<UserLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [activeQrLink, setActiveQrLink] = useState<UserLink | null>(null);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const meRes = await fetch('/api/auth/me');
        const meData = await meRes.json();

        if (!meData.user) {
          router.replace('/auth');
          return;
        }
        setUser(meData.user);

        const linksRes = await fetch('/api/user/links');
        if (linksRes.ok) {
          const linksData = await linksRes.json();
          setLinks(linksData.links || []);
        }
      } catch {
        // network err
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, [router]);

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/');
      router.refresh();
    } catch {
      // ignore
    }
  }

  async function handleDelete(id: string, short_code: string) {
    if (!confirm(`Are you sure you want to delete /${short_code}? This action cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/user/links/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setLinks((prev) => prev.filter((item) => item.id !== id));
      } else {
        alert('Failed to delete link');
      }
    } catch {
      alert('Network error while deleting link');
    }
  }

  function handleCopy(code: string) {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    navigator.clipboard.writeText(`${origin}/${code}`);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  }

  const totalClicks = links.reduce((acc, curr) => acc + curr.click_count, 0);

  if (loading) {
    return (
      <div className="dashboard-loading">
        <span className="material-symbols-outlined spin-icon" style={{ fontSize: '2.5rem', color: 'var(--primary)' }}>
          progress_activity
        </span>
        <p style={{ marginTop: '1rem', color: 'var(--on-surface-variant)' }}>Loading your dashboard...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="dashboard-page">
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
            <a href="/analytics">Analytics</a>
            <a href="/dashboard" className="active">
              My Dashboard
            </a>
          </nav>

          <button type="button" onClick={handleLogout} className="btn-logout">
            Log Out
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="main-content" style={{ maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
        {/* Account Header Section */}
        <section className="account-hero glass-card soft-glow">
          <div className="account-info-left">
            <div className="account-email-row">
              <span className="material-symbols-outlined" style={{ fontSize: '1.8rem', color: 'var(--primary)' }}>
                account_circle
              </span>
              <h1 className="account-email">{user.email}</h1>
              <span className="plan-badge">{user.plan.toUpperCase()}</span>
            </div>
            <p className="account-meta">
              Member since {new Date(user.created_at).toLocaleDateString()}
            </p>
          </div>

          <div className="account-stats-right">
            <div className="stat-pill">
              <span className="stat-num">{links.length}</span>
              <span className="stat-label">Total Links</span>
            </div>
            <div className="stat-pill">
              <span className="stat-num">{totalClicks}</span>
              <span className="stat-label">Total Clicks</span>
            </div>
          </div>
        </section>

        {/* Links Section Header */}
        <div className="links-section-header">
          <h2>Your Shortened Links</h2>
          <a href="/" className="btn-shorten" style={{ display: 'inline-flex', textDecoration: 'none', padding: '0.65rem 1.25rem' }}>
            + Create New Link
          </a>
        </div>

        {links.length === 0 ? (
          <div className="empty-card glass-card">
            <span className="material-symbols-outlined" style={{ fontSize: '3rem', color: 'var(--tertiary)' }}>
              link_off
            </span>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', marginTop: '0.75rem', color: 'var(--on-bg)' }}>
              No links saved to your account yet
            </h3>
            <p style={{ color: 'var(--on-surface-variant)', marginTop: '0.35rem' }}>
              Whenever you shorten a URL while signed in, it will be automatically saved here.
            </p>
            <a href="/" className="btn-shorten" style={{ display: 'inline-flex', marginTop: '1.5rem', textDecoration: 'none' }}>
              Shorten your first link
            </a>
          </div>
        ) : (
          <div className="links-list">
            {links.map((item) => (
              <div key={item.id} className="link-item-card glass-card">
                <div className="link-item-main">
                  <div className="link-item-top">
                    <a
                      href={`/${item.short_code}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="short-code-text"
                    >
                      /{item.short_code}
                    </a>
                    <span className="clicks-badge">
                      <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>
                        ads_click
                      </span>
                      <span>{item.click_count} clicks</span>
                    </span>
                    {!item.is_active && (
                      <span className="inactive-badge">INACTIVE</span>
                    )}
                  </div>

                  <a
                    href={item.original_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="original-url-text"
                  >
                    {item.original_url}
                  </a>

                  <div className="link-item-date">
                    Created {new Date(item.created_at).toLocaleDateString()}
                    {item.expires_at && ` • Expires ${new Date(item.expires_at).toLocaleDateString()}`}
                  </div>
                </div>

                <div className="link-item-actions">
                  <button
                    type="button"
                    onClick={() => setActiveQrLink(item)}
                    className="btn-action-qr"
                    title="Generate QR Code"
                  >
                    <span className="material-symbols-outlined">qr_code_2</span>
                    <span>QR</span>
                  </button>

                  <a href={`/stats/${item.short_code}`} className="btn-action-dash" title="View Analytics">
                    <span className="material-symbols-outlined">bar_chart</span>
                    <span>Analytics</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => handleCopy(item.short_code)}
                    className="btn-action-copy"
                    title="Copy Short Link"
                  >
                    <span className="material-symbols-outlined">
                      {copiedCode === item.short_code ? 'check' : 'content_copy'}
                    </span>
                    <span>{copiedCode === item.short_code ? 'Copied' : 'Copy'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(item.id, item.short_code)}
                    className="btn-action-del"
                    title="Delete Link"
                  >
                    <span className="material-symbols-outlined">delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Custom QR Code Modal */}
        {activeQrLink && (
          <QrCodeModal
            isOpen={!!activeQrLink}
            onClose={() => setActiveQrLink(null)}
            shortCode={activeQrLink.short_code}
            shortUrl={`${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/${activeQrLink.short_code}`}
          />
        )}
      </main>

      <style>{`
        .dashboard-page {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background-color: var(--bg);
          position: relative;
          overflow-x: hidden;
        }
        .dashboard-loading {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background-color: var(--bg);
        }
        .btn-logout {
          background: transparent;
          border: 1px solid var(--outline-variant);
          color: var(--on-surface-variant);
          padding: 0.5rem 1rem;
          border-radius: 0.5rem;
          font-family: var(--font-body);
          font-weight: 600;
          font-size: 0.88rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .btn-logout:hover {
          border-color: var(--primary);
          color: var(--primary);
        }
        .account-hero {
          padding: 2rem;
          margin: 2rem 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1.5rem;
        }
        .account-info-left {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }
        .account-email-row {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          flex-wrap: wrap;
        }
        .account-email {
          font-family: var(--font-display);
          font-size: 1.45rem;
          font-weight: 700;
          color: var(--on-bg);
          margin: 0;
        }
        .plan-badge {
          background-color: rgba(151, 72, 34, 0.12);
          color: var(--primary);
          font-family: var(--font-mono);
          font-weight: 700;
          font-size: 0.72rem;
          padding: 0.2rem 0.6rem;
          border-radius: 0.4rem;
        }
        .account-meta {
          font-size: 0.88rem;
          color: var(--secondary);
          margin-left: 2.45rem;
        }
        .account-stats-right {
          display: flex;
          gap: 1.5rem;
        }
        .stat-pill {
          display: flex;
          flex-direction: column;
          align-items: center;
          background-color: var(--bakery-cream);
          padding: 0.75rem 1.5rem;
          border-radius: 0.75rem;
          border: 1px solid var(--surface-variant);
        }
        .stat-num {
          font-family: var(--font-mono);
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--primary);
        }
        .stat-label {
          font-size: 0.78rem;
          color: var(--on-surface-variant);
          font-weight: 600;
        }
        .links-section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
          gap: 1rem;
        }
        .links-section-header h2 {
          font-family: var(--font-display);
          font-size: 1.45rem;
          color: var(--on-bg);
          margin: 0;
        }
        .empty-card {
          padding: 4rem 2rem;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 3rem;
        }
        .links-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-bottom: 4rem;
        }
        .link-item-card {
          padding: 1.5rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1.25rem;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .link-item-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(151, 72, 34, 0.08);
        }
        .link-item-main {
          flex: 1;
          min-width: 280px;
          display: flex;
          flex-direction: column;
          gap: 0.45rem;
        }
        .link-item-top {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex-wrap: wrap;
        }
        .short-code-text {
          font-family: var(--font-mono);
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--primary);
          text-decoration: none;
        }
        .short-code-text:hover {
          text-decoration: underline;
        }
        .clicks-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          background-color: rgba(217, 123, 81, 0.15);
          color: var(--secondary);
          font-family: var(--font-mono);
          font-size: 0.78rem;
          font-weight: 600;
          padding: 0.2rem 0.6rem;
          border-radius: 0.4rem;
        }
        .inactive-badge {
          background-color: #fee2e2;
          color: #dc2626;
          font-family: var(--font-mono);
          font-size: 0.72rem;
          font-weight: 700;
          padding: 0.2rem 0.5rem;
          border-radius: 0.4rem;
        }
        .original-url-text {
          font-size: 0.92rem;
          color: var(--on-surface-variant);
          text-decoration: none;
          word-break: break-all;
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .original-url-text:hover {
          color: var(--primary);
          text-decoration: underline;
        }
        .link-item-date {
          font-size: 0.78rem;
          color: var(--secondary);
          font-family: var(--font-mono);
        }
        .link-item-actions {
          display: flex;
          align-items: center;
          gap: 0.6rem;
        }
        .btn-action-dash {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          background-color: var(--bakery-cream);
          border: 1px solid var(--surface-variant);
          color: var(--primary);
          padding: 0.5rem 0.85rem;
          border-radius: 0.5rem;
          font-size: 0.85rem;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.2s ease;
        }
        .btn-action-dash:hover {
          border-color: var(--primary);
          background-color: #ffffff;
        }
        .btn-action-qr {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          background: transparent;
          border: 1px solid var(--outline-variant);
          color: var(--primary);
          padding: 0.5rem 0.85rem;
          border-radius: 0.5rem;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .btn-action-qr:hover {
          border-color: var(--primary);
          background-color: rgba(151, 72, 34, 0.08);
        }
        .btn-action-copy {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          background: transparent;
          border: 1px solid var(--outline-variant);
          color: var(--on-surface-variant);
          padding: 0.5rem 0.85rem;
          border-radius: 0.5rem;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .btn-action-copy:hover {
          border-color: var(--primary);
          color: var(--primary);
        }
        .btn-action-del {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: 1px solid var(--outline-variant);
          color: #dc2626;
          padding: 0.5rem;
          border-radius: 0.5rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .btn-action-del:hover {
          background-color: #fef2f2;
          border-color: #dc2626;
        }
        .spin-icon {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
