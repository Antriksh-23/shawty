'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function UserNav() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkUser() {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        if (data.user) {
          setUserEmail(data.user.email);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    checkUser();
  }, []);

  if (loading) {
    return (
      <span className="user-nav-loading" style={{ fontSize: '0.85rem', color: 'var(--secondary)' }}>
        ...
      </span>
    );
  }

  if (userEmail) {
    return (
      <button
        type="button"
        onClick={() => router.push('/dashboard')}
        className="btn-signin"
        style={{
          background: 'var(--primary)',
          color: '#ffffff',
          border: 'none',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.35rem',
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>
          account_circle
        </span>
        <span>My Dashboard</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => router.push('/auth')}
      className="btn-signin"
    >
      Sign In
    </button>
  );
}
