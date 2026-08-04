import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { displayDomain } from '@/lib/url-utils';
import PasswordForm from './PasswordForm';

interface PageProps {
  params: { code: string };
  searchParams: { pw?: string };
}

export default async function PreviewPage({ params, searchParams }: PageProps) {
  const { code } = params;
  const requiresPassword = searchParams.pw === '1';

  const link = await db.link.findUnique({
    where: { shortCode: code },
    select: {
      shortCode: true,
      originalUrl: true,
      passwordHash: true,
      expiresAt: true,
      maxClicks: true,
      clickCount: true,
      isActive: true,
    },
  });

  if (!link || !link.isActive) notFound();

  const domain = displayDomain(link.originalUrl);
  const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;

  return (
    <div className="preview-page">
      <div className="blob-bg blob-left" />
      <div className="blob-bg blob-right" />

      <div className="preview-card glass-card">
        {/* Header */}
        <div className="preview-header">
          <a href="/" className="shawty-logo">
            <span className="material-symbols-outlined" style={{ fontSize: '2rem' }}>
              bolt
            </span>
            <span>Shawty</span>
          </a>
          <p className="preview-label">You&apos;re about to visit an external link</p>
        </div>

        {/* Destination info */}
        <div className="destination-card">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={faviconUrl}
            alt={`${domain} favicon`}
            width={44}
            height={44}
            className="favicon"
          />
          <div className="destination-info">
            <span className="destination-domain">{domain}</span>
            <span className="destination-url">
              {link.originalUrl.slice(0, 80)}
              {link.originalUrl.length > 80 ? '…' : ''}
            </span>
          </div>
        </div>

        {/* Safety notice */}
        <div className="safety-notice">
          <span className="material-symbols-outlined safety-icon">verified_user</span>
          <p>
            This link was created via Shawty and passed our Google Safe Browsing
            v4 malware check. Always exercise caution when visiting unfamiliar links.
          </p>
        </div>

        {requiresPassword ? (
          <PasswordForm code={code} />
        ) : (
          <div className="action-buttons">
            <a href={link.originalUrl} className="btn-continue" id="btn-continue">
              <span>Continue to {domain}</span>
              <span className="material-symbols-outlined">arrow_forward</span>
            </a>
            <a href="/" className="btn-back" id="btn-back">
              Go back home
            </a>
          </div>
        )}

        <p className="short-code-label">
          Short link: <code>/{code}</code>
        </p>
      </div>

      <style>{`
        .preview-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg);
          font-family: var(--font-body);
          padding: 2rem 1rem;
          position: relative;
          overflow: hidden;
        }
        .preview-card {
          padding: 2.5rem;
          max-width: 500px;
          width: 100%;
          position: relative;
          z-index: 10;
        }
        .preview-header {
          text-align: center;
          margin-bottom: 2rem;
        }
        .shawty-logo {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          font-family: var(--font-display);
          font-size: 1.75rem;
          font-weight: 700;
          color: var(--primary);
          text-decoration: none;
          margin-bottom: 0.75rem;
        }
        .preview-label {
          color: var(--on-surface-variant);
          font-size: 0.95rem;
        }
        .destination-card {
          display: flex;
          align-items: center;
          gap: 1.25rem;
          background: #ffffff;
          border: 1px solid var(--surface-variant);
          border-radius: 1rem;
          padding: 1.25rem;
          margin-bottom: 1.5rem;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.03);
        }
        .favicon {
          border-radius: 8px;
          flex-shrink: 0;
        }
        .destination-info {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          min-width: 0;
        }
        .destination-domain {
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 1.15rem;
          color: var(--on-bg);
        }
        .destination-url {
          font-size: 0.82rem;
          color: var(--on-surface-variant);
          word-break: break-all;
        }
        .safety-notice {
          display: flex;
          gap: 0.85rem;
          background: rgba(125, 148, 101, 0.12);
          border: 1px solid rgba(125, 148, 101, 0.35);
          border-radius: 0.875rem;
          padding: 1rem 1.15rem;
          margin-bottom: 2rem;
        }
        .safety-icon {
          color: var(--success-green);
          font-size: 1.5rem;
          flex-shrink: 0;
        }
        .safety-notice p {
          font-size: 0.88rem;
          color: #3d502d;
          line-height: 1.5;
        }
        .action-buttons {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-bottom: 1.5rem;
        }
        .btn-continue {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.9rem;
          background: var(--primary);
          color: white;
          text-decoration: none;
          border-radius: 0.75rem;
          font-weight: 600;
          font-size: 1rem;
          transition: all 0.2s ease;
          box-shadow: 0 4px 15px rgba(151, 72, 34, 0.25);
        }
        .btn-continue:hover {
          background: var(--primary-container);
          transform: translateY(-1px);
        }
        .btn-back {
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
        .btn-back:hover {
          background: var(--surface-container);
          color: var(--on-surface);
          border-color: var(--outline);
        }
        .short-code-label {
          text-align: center;
          font-size: 0.82rem;
          color: var(--tertiary);
        }
        .short-code-label code {
          color: var(--primary);
          background: rgba(151, 72, 34, 0.1);
          padding: 0.15em 0.5em;
          border-radius: 4px;
          font-family: var(--font-mono);
          font-weight: 600;
        }
      `}</style>
    </div>
  );
}
