'use client';

import { useState } from 'react';
import type { CreateLinkResponse, ApiError } from '@/lib/types';

interface ShortenerFormProps {
  onSuccess: (result: CreateLinkResponse) => void;
}

export default function ShortenerForm({ onSuccess }: ShortenerFormProps) {
  const [url, setUrl] = useState('');
  const [slug, setSlug] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [password, setPassword] = useState('');
  const [maxClicks, setMaxClicks] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rateLimited, setRateLimited] = useState(false);
  const [retryAfter, setRetryAfter] = useState(0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setRateLimited(false);

    if (!url.trim()) {
      setError('Please enter a URL to shorten.');
      return;
    }

    setLoading(true);

    try {
      const body: Record<string, unknown> = { url: url.trim() };
      if (slug.trim()) body.custom_slug = slug.trim();
      if (expiresAt) body.expires_at = new Date(expiresAt).toISOString();
      if (password) body.password = password;
      if (maxClicks) body.max_clicks = parseInt(maxClicks, 10);

      const res = await fetch('/api/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.status === 429) {
        const retry = parseInt(res.headers.get('Retry-After') ?? '3600', 10);
        setRateLimited(true);
        setRetryAfter(retry);
        return;
      }

      const data = (await res.json()) as CreateLinkResponse | ApiError;

      if (!res.ok) {
        setError((data as ApiError).error ?? 'Something went wrong.');
        return;
      }

      // Reset form on success
      setUrl('');
      setSlug('');
      setExpiresAt('');
      setPassword('');
      setMaxClicks('');
      onSuccess(data as CreateLinkResponse);
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  // Minimum datetime for the expiry picker (now + 5 min)
  const minDateTime = new Date(Date.now() + 5 * 60 * 1000)
    .toISOString()
    .slice(0, 16);

  return (
    <form onSubmit={handleSubmit} className="shortener-form" noValidate>
      {/* Rate limit warning banner */}
      {rateLimited && (
        <div
          style={{
            background: 'rgba(188, 84, 73, 0.15)',
            border: '1px solid var(--error-red)',
            color: 'var(--error-red)',
            padding: '1rem',
            borderRadius: '0.75rem',
            marginBottom: '1rem',
            fontFamily: 'var(--font-body)',
          }}
          role="alert"
        >
          <strong>Rate limit exceeded.</strong> You can create more links in{' '}
          {Math.ceil(retryAfter / 60)} minutes.
        </div>
      )}

      {/* Error Banner */}
      {error && !rateLimited && (
        <div
          style={{
            background: 'rgba(188, 84, 73, 0.15)',
            border: '1px solid var(--error-red)',
            color: 'var(--error-red)',
            padding: '0.875rem 1.25rem',
            borderRadius: '0.75rem',
            fontFamily: 'var(--font-body)',
            fontSize: '0.95rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
          role="alert"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>
            error
          </span>
          {error}
        </div>
      )}

      {/* Main Input Box */}
      <div className="input-container">
        <span className="material-symbols-outlined input-icon-left">link</span>
        <input
          id="url-input"
          className="url-input-main"
          type="url"
          placeholder="Paste your long link here..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
          aria-label="URL to shorten"
        />
        <button
          id="btn-shorten"
          className="btn-shorten"
          type="submit"
          disabled={loading || rateLimited}
        >
          {loading ? (
            <>
              Shortening...
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                sync
              </span>
            </>
          ) : (
            <>
              Shorten
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                magic_button
              </span>
            </>
          )}
        </button>
      </div>

      {/* Advanced Options Accordion */}
      <details className="advanced-details">
        <summary className="advanced-summary">
          <span className="advanced-icon-left">
            <span className="material-symbols-outlined">settings</span>
            Advanced Options
          </span>
          <span className="material-symbols-outlined">expand_more</span>
        </summary>
        <div className="advanced-grid">
          {/* Custom Slug */}
          <div className="form-field">
            <label htmlFor="custom-slug" className="form-label">
              Custom Slug
            </label>
            <div className="field-input-wrap">
              <span className="field-prefix">shawty.link/</span>
              <input
                id="custom-slug"
                className="field-input"
                type="text"
                placeholder="my-cool-link"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
              />
            </div>
          </div>

          {/* Password Protection */}
          <div className="form-field">
            <label htmlFor="link-password" className="form-label">
              Password Protection
            </label>
            <div className="field-input-wrap">
              <span className="material-symbols-outlined field-icon">lock</span>
              <input
                id="link-password"
                className="field-input with-icon"
                type="password"
                placeholder="Set password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {/* Expiration Date */}
          <div className="form-field">
            <label htmlFor="expires-at" className="form-label">
              Expiration Date
            </label>
            <div className="field-input-wrap">
              <input
                id="expires-at"
                className="field-input"
                type="datetime-local"
                min={minDateTime}
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
            </div>
          </div>

          {/* Max Clicks */}
          <div className="form-field">
            <label htmlFor="max-clicks" className="form-label">
              Max Clicks
            </label>
            <div className="field-input-wrap">
              <span className="material-symbols-outlined field-icon">touch_app</span>
              <input
                id="max-clicks"
                className="field-input with-icon"
                type="number"
                min="1"
                placeholder="e.g. 10 (optional)"
                value={maxClicks}
                onChange={(e) => setMaxClicks(e.target.value)}
              />
            </div>
          </div>
        </div>
      </details>
    </form>
  );
}
