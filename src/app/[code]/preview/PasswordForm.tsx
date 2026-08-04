'use client';

import { useState } from 'react';

interface PasswordFormProps {
  code: string;
}

export default function PasswordForm({ code }: PasswordFormProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`/api/links/${code}/unlock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        const data = (await res.json()) as { redirect_url: string };
        window.location.href = data.redirect_url;
      } else {
        const data = (await res.json()) as { error: string };
        setError(data.error ?? 'Incorrect password');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="password-form">
      <div className="pw-field-group">
        <label htmlFor="link-password" className="pw-label">
          <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>
            lock
          </span>
          <span>This link is password protected</span>
        </label>
        <input
          id="link-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter password…"
          className={`pw-input ${error ? 'pw-input-error' : ''}`}
          autoFocus
          autoComplete="current-password"
          required
        />
        {error && <p className="pw-error">{error}</p>}
      </div>
      <button
        type="submit"
        id="btn-unlock"
        disabled={loading || !password}
        className="btn-unlock"
      >
        {loading ? 'Checking…' : 'Unlock & Continue →'}
      </button>
      <a href="/" className="btn-back-pw">
        Go back home
      </a>

      <style>{`
        .password-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }
        .pw-label {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--on-surface-variant);
          margin-bottom: 0.5rem;
        }
        .pw-field-group {
          display: flex;
          flex-direction: column;
        }
        .pw-input {
          background: #ffffff;
          border: 1px solid var(--surface-variant);
          border-radius: 0.75rem;
          padding: 0.875rem 1rem;
          color: var(--on-bg);
          font-size: 1rem;
          outline: none;
          transition: all 0.2s;
        }
        .pw-input::placeholder {
          color: var(--secondary);
        }
        .pw-input:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(151, 72, 34, 0.12);
        }
        .pw-input-error {
          border-color: var(--error-red);
        }
        .pw-error {
          margin-top: 0.5rem;
          font-size: 0.85rem;
          color: var(--error-red);
        }
        .btn-unlock {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.9rem;
          background: var(--primary);
          color: white;
          border: none;
          border-radius: 0.75rem;
          font-weight: 600;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 15px rgba(151, 72, 34, 0.25);
        }
        .btn-unlock:hover:not(:disabled) {
          background: var(--primary-container);
          transform: translateY(-1px);
        }
        .btn-unlock:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }
        .btn-back-pw {
          display: block;
          text-align: center;
          padding: 0.85rem;
          background: var(--surface-container-low);
          border: 1px solid var(--outline-variant);
          color: var(--on-surface-variant);
          text-decoration: none;
          border-radius: 0.75rem;
          font-weight: 500;
          transition: all 0.2s ease;
        }
        .btn-back-pw:hover {
          background: var(--surface-container);
          color: var(--on-surface);
        }
      `}</style>
    </form>
  );
}
