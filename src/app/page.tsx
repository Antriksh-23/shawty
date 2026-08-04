'use client';

import { useState } from 'react';
import ShortenerForm from '@/components/ShortenerForm';
import ResultCard from '@/components/ResultCard';
import UserNav from '@/components/UserNav';
import type { CreateLinkResponse } from '@/lib/types';

export default function HomePage() {
  const [result, setResult] = useState<CreateLinkResponse | null>(null);

  function handleSuccess(data: CreateLinkResponse) {
    setResult(data);
    try {
      const saved = localStorage.getItem('shawty_recent_links');
      const list = saved ? JSON.parse(saved) : [];
      const updated = [data, ...list.filter((l: any) => l.short_code !== data.short_code)].slice(0, 20);
      localStorage.setItem('shawty_recent_links', JSON.stringify(updated));
    } catch {
      // ignore localStorage errors
    }
  }

  return (
    <>
      {/* Decorative Background Blobs */}
      <div className="blob-bg blob-left" />
      <div className="blob-bg blob-right" />

      {/* Top Header / Nav */}
      <header className="top-header">
        <div className="header-container">
          <a href="/" className="brand-logo">
            <span className="material-symbols-outlined" style={{ fontSize: '2rem' }}>
              bolt
            </span>
            <span>Shawty</span>
          </a>

          <nav className="brand-nav">
            <a href="/" className="active">
              Shorten
            </a>
            <a href="#security">Security</a>
            <a href="/analytics">
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
        <section className="hero-section">
          <h1 className="hero-title">Make it short. Keep it sweet.</h1>
          <p className="hero-subtitle">
            The delightfully fast, fiercely secure way to share your links. Freshly
            baked performance for modern web needs.
          </p>

          {/* Form / Result Area */}
          <div className="form-card glass-card soft-glow">
            {!result ? (
              <ShortenerForm onSuccess={handleSuccess} />
            ) : (
              <ResultCard result={result} onReset={() => setResult(null)} />
            )}
          </div>
        </section>

        {/* Features Bento Grid */}
        <section id="security" className="bento-section">
          <div className="bento-header">
            <h2 className="bento-title">Baked in Security &amp; Performance</h2>
            <p className="bento-desc">
              We handle the heavy lifting so your links arrive fast and safe.
            </p>
          </div>

          <div className="bento-grid">
            {/* Card 1: Sub-5ms Caching */}
            <div className="bento-card glass-card">
              <div className="bento-icon-box bento-icon-primary">
                <span className="material-symbols-outlined" style={{ fontSize: '1.75rem' }}>
                  bolt
                </span>
              </div>
              <h3 className="bento-card-title">Sub-5ms Caching</h3>
              <p className="bento-card-text">
                Powered by Redis, our links resolve almost instantly before hitting the
                main Postgres database.
              </p>
            </div>

            {/* Card 2: Malware Shield Active */}
            <div className="bento-card glass-card bento-span-2">
              <span className="material-symbols-outlined bento-watermark">shield</span>
              <div className="bento-icon-box bento-icon-success">
                <span className="material-symbols-outlined" style={{ fontSize: '1.75rem' }}>
                  verified_user
                </span>
              </div>
              <h3 className="bento-card-title">Malware Shield Active</h3>
              <p className="bento-card-text" style={{ maxWidth: '440px' }}>
                Every destination URL is scanned against Google Safe Browsing v4 threat
                databases. We automatically block malicious redirects to keep your
                audience safe.
              </p>
            </div>

            {/* Card 3: IP Rate Limiting */}
            <div className="bento-card glass-card">
              <div className="bento-icon-box bento-icon-error">
                <span className="material-symbols-outlined" style={{ fontSize: '1.75rem' }}>
                  speed
                </span>
              </div>
              <h3 className="bento-card-title">IP Rate Limiting</h3>
              <p className="bento-card-text">
                Built-in DDoS protection and abuse prevention ensures high availability
                for everyone.
              </p>
            </div>

            {/* Card 4: Phase 2 LIVE */}
            <div className="bento-card bento-span-2 bento-phase2" id="analytics">
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  width: '100%',
                  marginBottom: '1rem',
                }}
              >
                <div className="bento-icon-box bento-icon-tertiary" style={{ marginBottom: 0 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '1.75rem' }}>
                    monitoring
                  </span>
                </div>
                <span
                  className="badge-soon"
                  style={{
                    padding: '0.35rem 0.85rem',
                    background: 'rgba(125, 148, 101, 0.2)',
                    color: 'var(--success-green)',
                  }}
                >
                  Phase 2: LIVE NOW ✨
                </span>
              </div>
              <h3 className="bento-card-title">Real-Time Click Analytics &amp; Dashboards</h3>
              <p className="bento-card-text" style={{ maxWidth: '520px', marginBottom: '1.25rem' }}>
                Track clicks, device breakdowns, browser statistics, and referrers in
                real-time with interactive 14-day charts.
              </p>
              <a
                href="/analytics"
                className="btn-shorten"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  textDecoration: 'none',
                  padding: '0.65rem 1.25rem',
                  fontSize: '0.9rem',
                  marginBottom: '1.5rem',
                }}
              >
                <span>Explore Live Analytics →</span>
              </a>

              {/* Decorative Chart Mockup */}
              <div
                style={{
                  width: '100%',
                  height: '70px',
                  background: 'rgba(255,255,255,0.6)',
                  border: '1px solid var(--surface-variant)',
                  borderRadius: '0.75rem',
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'space-between',
                  padding: '0 1rem 0.5rem',
                  opacity: 0.8,
                }}
              >
                {[20, 35, 45, 60, 90, 50, 75, 100, 80, 65, 40, 55].map((h, i) => (
                  <div
                    key={i}
                    style={{
                      width: '6%',
                      height: `${h}%`,
                      backgroundColor:
                        i === 7 ? 'var(--primary)' : 'rgba(217, 123, 81, 0.35)',
                      borderRadius: '3px 3px 0 0',
                      transition: 'height 0.3s ease',
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <div className="footer-container">
          <div className="footer-brand">Shawty</div>
          <p className="footer-text">
            © 2026 Shawty Link Shortener. Freshly baked for you.
          </p>
          <div className="footer-links">
            <a href="#">Terms</a>
            <a href="#">Privacy</a>
            <a href="#">Status</a>
            <a href="/api/docs" target="_blank" rel="noopener noreferrer">
              API
            </a>
          </div>
        </div>
      </footer>
    </>
  );
}
