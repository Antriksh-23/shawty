'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/signup';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Authentication failed. Please check your credentials.');
        setLoading(false);
        return;
      }

      router.push('/dashboard');
      router.refresh();
    } catch {
      setError('A network error occurred. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="blob-bg blob-left" />
      <div className="blob-bg blob-right" />

      {/* Header */}
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
            <a href="/api/docs" target="_blank" rel="noopener noreferrer">
              API
            </a>
          </nav>
        </div>
      </header>

      {/* Main Form Content */}
      <main className="auth-main">
        <div className="auth-card glass-card soft-glow">
          {/* Mode Switch Tabs */}
          <div className="auth-tabs">
            <button
              type="button"
              className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
              onClick={() => {
                setMode('login');
                setError(null);
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`auth-tab ${mode === 'signup' ? 'active' : ''}`}
              onClick={() => {
                setMode('signup');
                setError(null);
              }}
            >
              Create Account
            </button>
          </div>

          <h1 className="auth-title">
            {mode === 'login' ? 'Welcome Back to Shawty' : 'Join Shawty Today'}
          </h1>
          <p className="auth-subtitle">
            {mode === 'login'
              ? 'Sign in to access your shortened links and click analytics.'
              : 'Create a free account to permanently store and manage your links.'}
          </p>

          {error && (
            <div className="error-banner">
              <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>
                error
              </span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="auth-email">Email Address</label>
              <input
                id="auth-email"
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="auth-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="auth-password">Password</label>
              <input
                id="auth-password"
                type="password"
                required
                placeholder={mode === 'signup' ? 'At least 6 characters' : 'Enter password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="auth-input"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-submit-auth"
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined spin-icon">progress_activity</span>
                  <span>{mode === 'login' ? 'Signing in...' : 'Creating account...'}</span>
                </>
              ) : (
                <>
                  <span>{mode === 'login' ? 'Sign In' : 'Create Account'}</span>
                  <span className="material-symbols-outlined">arrow_forward</span>
                </>
              )}
            </button>
          </form>

          <div className="auth-footer-note">
            {mode === 'login' ? (
              <p>
                Don&apos;t have an account?{' '}
                <button
                  type="button"
                  className="link-btn"
                  onClick={() => setMode('signup')}
                >
                  Create one free
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{' '}
                <button
                  type="button"
                  className="link-btn"
                  onClick={() => setMode('login')}
                >
                  Sign in here
                </button>
              </p>
            )}
          </div>
        </div>
      </main>

      <style>{`
        .auth-page {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background-color: var(--bg);
          position: relative;
          overflow-x: hidden;
        }
        .auth-main {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem 1.5rem 4rem;
        }
        .auth-card {
          width: 100%;
          max-width: 480px;
          padding: 2.5rem;
          display: flex;
          flex-direction: column;
        }
        .auth-tabs {
          display: grid;
          grid-template-columns: 1fr 1fr;
          background-color: var(--bakery-cream);
          border-radius: 0.75rem;
          padding: 0.35rem;
          margin-bottom: 2rem;
          border: 1px solid var(--surface-variant);
        }
        .auth-tab {
          border: none;
          background: transparent;
          padding: 0.65rem 1rem;
          font-family: var(--font-body);
          font-weight: 600;
          font-size: 0.92rem;
          color: var(--on-surface-variant);
          border-radius: 0.5rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .auth-tab.active {
          background-color: #ffffff;
          color: var(--primary);
          box-shadow: 0 2px 8px rgba(151, 72, 34, 0.1);
        }
        .auth-title {
          font-family: var(--font-display);
          font-size: 1.65rem;
          font-weight: 700;
          color: var(--on-bg);
          margin-bottom: 0.4rem;
        }
        .auth-subtitle {
          font-size: 0.95rem;
          color: var(--on-surface-variant);
          margin-bottom: 1.75rem;
          line-height: 1.45;
        }
        .error-banner {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          background-color: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
          padding: 0.85rem 1rem;
          border-radius: 0.75rem;
          font-size: 0.9rem;
          margin-bottom: 1.5rem;
        }
        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.45rem;
        }
        .form-group label {
          font-weight: 600;
          font-size: 0.88rem;
          color: var(--on-bg);
        }
        .auth-input {
          width: 100%;
          padding: 0.8rem 1rem;
          font-family: var(--font-body);
          font-size: 1rem;
          border: 2px solid var(--surface-variant);
          border-radius: 0.75rem;
          background-color: #ffffff;
          color: var(--on-bg);
          transition: all 0.2s ease;
        }
        .auth-input:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 4px rgba(151, 72, 34, 0.12);
        }
        .btn-submit-auth {
          margin-top: 0.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          background-color: var(--primary);
          color: var(--on-primary);
          border: none;
          padding: 0.9rem 1.5rem;
          border-radius: 0.75rem;
          font-family: var(--font-body);
          font-weight: 600;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 14px rgba(151, 72, 34, 0.25);
        }
        .btn-submit-auth:hover:not(:disabled) {
          background-color: #843b19;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(151, 72, 34, 0.35);
        }
        .btn-submit-auth:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        .spin-icon {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          100% {
            transform: rotate(360deg);
          }
        }
        .auth-footer-note {
          margin-top: 1.75rem;
          text-align: center;
          font-size: 0.92rem;
          color: var(--on-surface-variant);
        }
        .link-btn {
          background: transparent;
          border: none;
          color: var(--primary);
          font-weight: 600;
          font-family: var(--font-body);
          cursor: pointer;
          padding: 0;
          text-decoration: underline;
        }
        .link-btn:hover {
          color: #843b19;
        }
      `}</style>
    </div>
  );
}
