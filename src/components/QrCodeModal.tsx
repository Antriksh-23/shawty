'use client';

import { useState } from 'react';

interface QrCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  shortCode: string;
  shortUrl: string;
}

export default function QrCodeModal({ isOpen, onClose, shortCode, shortUrl }: QrCodeModalProps) {
  const [theme, setTheme] = useState<'warm' | 'bakery' | 'dark' | 'default'>('warm');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const qrSvgUrl = `/api/links/${shortCode}/qr?format=svg&theme=${theme}`;
  const qrPngUrl = `/api/links/${shortCode}/qr?format=png&theme=${theme}`;

  function handleCopyUrl() {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    navigator.clipboard.writeText(`${origin}/api/links/${shortCode}/qr?format=png&theme=${theme}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="qr-modal-overlay" onClick={onClose}>
      <div className="qr-modal-card glass-card soft-glow" onClick={(e) => e.stopPropagation()}>
        <div className="qr-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '1.5rem', color: 'var(--primary)' }}>
              qr_code_2
            </span>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', margin: 0, color: 'var(--on-bg)' }}>
              Custom QR Code
            </h3>
          </div>
          <button type="button" onClick={onClose} className="btn-close-modal" aria-label="Close modal">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <p style={{ fontSize: '0.88rem', color: 'var(--on-surface-variant)', marginTop: '0.35rem', marginBottom: '1.25rem' }}>
          Select a brand color theme and download a scannable high-resolution QR code for <strong>/{shortCode}</strong>.
        </p>

        {/* Color Theme Tabs */}
        <div className="qr-theme-selector">
          <button
            type="button"
            className={`theme-pill ${theme === 'warm' ? 'active' : ''}`}
            onClick={() => setTheme('warm')}
          >
            ☕ Warm Tech
          </button>
          <button
            type="button"
            className={`theme-pill ${theme === 'bakery' ? 'active' : ''}`}
            onClick={() => setTheme('bakery')}
          >
            🥐 Bakery Cream
          </button>
          <button
            type="button"
            className={`theme-pill ${theme === 'dark' ? 'active' : ''}`}
            onClick={() => setTheme('dark')}
          >
            🌑 Deep Dark
          </button>
          <button
            type="button"
            className={`theme-pill ${theme === 'default' ? 'active' : ''}`}
            onClick={() => setTheme('default')}
          >
            ⚪ Classic Black
          </button>
        </div>

        {/* Live QR Preview */}
        <div className="qr-preview-container">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrSvgUrl}
            alt={`QR Code for ${shortUrl} in ${theme} theme`}
            className="qr-preview-img"
          />
        </div>

        {/* Download & Copy Buttons */}
        <div className="qr-modal-actions">
          <a
            href={qrPngUrl}
            download={`shawty-${shortCode}-${theme}.png`}
            className="btn-qr-primary"
          >
            <span className="material-symbols-outlined">download</span>
            <span>Download PNG (400px)</span>
          </a>

          <a
            href={qrSvgUrl}
            download={`shawty-${shortCode}-${theme}.svg`}
            className="btn-qr-secondary"
          >
            <span className="material-symbols-outlined">draw</span>
            <span>Vector SVG</span>
          </a>
        </div>

        <button
          type="button"
          onClick={handleCopyUrl}
          className="btn-qr-copy-url"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>
            {copied ? 'check' : 'link'}
          </span>
          <span>{copied ? 'QR Image Link Copied!' : 'Copy Direct QR Image URL'}</span>
        </button>
      </div>

      <style>{`
        .qr-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(15, 15, 15, 0.65);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1.5rem;
          animation: fadeIn 0.2s ease;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .qr-modal-card {
          width: 100%;
          max-width: 440px;
          padding: 1.75rem;
          display: flex;
          flex-direction: column;
          animation: scaleUp 0.2s ease;
        }
        @keyframes scaleUp {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .qr-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .btn-close-modal {
          background: transparent;
          border: none;
          color: var(--on-surface-variant);
          cursor: pointer;
          padding: 0.25rem;
          border-radius: 0.35rem;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }
        .btn-close-modal:hover {
          background-color: var(--surface-variant);
          color: var(--on-bg);
        }
        .qr-theme-selector {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.5rem;
          margin-bottom: 1.5rem;
        }
        .theme-pill {
          background-color: var(--bakery-cream);
          border: 1px solid var(--surface-variant);
          color: var(--on-surface-variant);
          padding: 0.55rem 0.75rem;
          border-radius: 0.6rem;
          font-family: var(--font-body);
          font-size: 0.82rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: center;
        }
        .theme-pill:hover {
          border-color: var(--primary);
          color: var(--primary);
        }
        .theme-pill.active {
          background-color: var(--primary);
          color: #ffffff;
          border-color: var(--primary);
          box-shadow: 0 2px 8px rgba(151, 72, 34, 0.2);
        }
        .qr-preview-container {
          background-color: #ffffff;
          border: 2px solid var(--surface-variant);
          border-radius: 1rem;
          padding: 1.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1.5rem;
          box-shadow: inset 0 2px 10px rgba(0, 0, 0, 0.03);
        }
        .qr-preview-img {
          width: 200px;
          height: 200px;
          display: block;
        }
        .qr-modal-actions {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
        }
        .btn-qr-primary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.45rem;
          background-color: var(--primary);
          color: #ffffff;
          text-decoration: none;
          padding: 0.75rem 1rem;
          border-radius: 0.75rem;
          font-weight: 600;
          font-size: 0.88rem;
          transition: all 0.2s ease;
          box-shadow: 0 4px 12px rgba(151, 72, 34, 0.25);
        }
        .btn-qr-primary:hover {
          background-color: #843b19;
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(151, 72, 34, 0.35);
        }
        .btn-qr-secondary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.45rem;
          background-color: var(--bakery-cream);
          border: 1px solid var(--surface-variant);
          color: var(--primary);
          text-decoration: none;
          padding: 0.75rem 1rem;
          border-radius: 0.75rem;
          font-weight: 600;
          font-size: 0.88rem;
          transition: all 0.2s ease;
        }
        .btn-qr-secondary:hover {
          background-color: #ffffff;
          border-color: var(--primary);
          transform: translateY(-2px);
        }
        .btn-qr-copy-url {
          margin-top: 0.75rem;
          background: transparent;
          border: 1px dashed var(--outline-variant);
          color: var(--secondary);
          padding: 0.65rem;
          border-radius: 0.75rem;
          font-family: var(--font-body);
          font-size: 0.82rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.45rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .btn-qr-copy-url:hover {
          border-color: var(--primary);
          color: var(--primary);
        }
      `}</style>
    </div>
  );
}
