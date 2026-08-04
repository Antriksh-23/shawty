'use client';

import { useState, useEffect } from 'react';
import type { CreateLinkResponse } from '@/lib/types';

interface ResultCardProps {
  result: CreateLinkResponse;
  onReset?: () => void;
}

export default function ResultCard({ result, onReset }: ResultCardProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (copied) {
      const t = setTimeout(() => setCopied(false), 2500);
      return () => clearTimeout(t);
    }
  }, [copied]);

  const code = result.short_code;
  const shortUrl = result.short_url;
  const qrSvgUrl = `/api/links/${code}/qr?format=svg`;
  const qrPngUrl = `/api/links/${code}/qr?format=png`;
  const previewUrl = `/${code}/preview`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(shortUrl);
      setCopied(true);
    } catch {
      const input = document.createElement('input');
      input.value = shortUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
    }
  }

  function handleShare() {
    if (navigator.share) {
      navigator.share({ title: 'Shawty Short Link', url: shortUrl });
    } else {
      handleCopy();
    }
  }

  return (
    <div className="result-card-container" aria-label="Shortened link result">
      {/* Top Banner Box */}
      <div className="result-banner">
        <div className="result-banner-top">
          <span className="result-badge">
            <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>
              check_circle
            </span>
            LINK READY
          </span>
          {result.expires_at && (
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.78rem',
                color: 'var(--secondary)',
              }}
            >
              Expires {new Date(result.expires_at).toLocaleDateString()}
            </span>
          )}
        </div>

        <div className="result-url-box">
          <a
            href={shortUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="result-short-url"
            id="result-short-url"
          >
            {shortUrl}
          </a>
          <button
            id="btn-copy-link"
            className={`btn-copy-main ${copied ? 'copied' : ''}`}
            onClick={handleCopy}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>
              {copied ? 'check' : 'content_copy'}
            </span>
            <span>{copied ? 'Copied!' : 'Copy Link'}</span>
          </button>
        </div>
      </div>

      {/* 2-Column Bento Options */}
      <div className="result-grid">
        {/* Left Col: QR Code Card */}
        <div className="qr-panel">
          <div className="qr-panel-header">
            <span className="qr-panel-title">QR Code</span>
            <span
              className="material-symbols-outlined"
              style={{ color: 'var(--secondary)', opacity: 0.7 }}
            >
              qr_code_scanner
            </span>
          </div>

          <div className="qr-preview-box">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrSvgUrl}
              alt={`QR Code for ${shortUrl}`}
              width={160}
              height={160}
              style={{ display: 'block', margin: '0 auto', borderRadius: '4px' }}
            />
          </div>

          <div className="qr-download-btns">
            <a
              href={qrPngUrl}
              download={`shawty-${code}.png`}
              className="btn-qr-dl"
            >
              PNG{' '}
              <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>
                download
              </span>
            </a>
            <a
              href={qrSvgUrl}
              download={`shawty-${code}.svg`}
              className="btn-qr-dl"
            >
              SVG{' '}
              <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>
                download
              </span>
            </a>
          </div>
        </div>

        {/* Right Col: Actions */}
        <div className="action-buttons-col">
          {/* Live Analytics Dashboard */}
          <a
            href={`/stats/${code}`}
            className="action-card-btn"
          >
            <div className="action-card-left">
              <div
                className="action-icon-circle"
                style={{ background: 'rgba(217, 123, 81, 0.18)', color: 'var(--primary)' }}
              >
                <span className="material-symbols-outlined">bar_chart</span>
              </div>
              <div>
                <div className="action-title">Live Analytics Dashboard</div>
                <div className="action-desc">Track clicks, referrers, and device stats.</div>
              </div>
            </div>
            <span
              className="material-symbols-outlined"
              style={{ color: 'var(--secondary)' }}
            >
              arrow_forward
            </span>
          </a>

          {/* Preview Safety Page */}
          <a
            href={previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="action-card-btn"
          >
            <div className="action-card-left">
              <div className="action-icon-circle action-icon-shield">
                <span className="material-symbols-outlined">shield_lock</span>
              </div>
              <div>
                <div className="action-title">Preview Safety Page</div>
                <div className="action-desc">See what visitors see before they click.</div>
              </div>
            </div>
            <span
              className="material-symbols-outlined"
              style={{ color: 'var(--secondary)' }}
            >
              arrow_forward
            </span>
          </a>

          {/* Social Share */}
          <button type="button" onClick={handleShare} className="action-card-btn">
            <div className="action-card-left">
              <div className="action-icon-circle action-icon-share">
                <span className="material-symbols-outlined">share</span>
              </div>
              <div>
                <div className="action-title">Share to Socials</div>
                <div className="action-desc">Quickly post or share to your network.</div>
              </div>
            </div>
            <span
              className="material-symbols-outlined"
              style={{ color: 'var(--secondary)' }}
            >
              arrow_forward
            </span>
          </button>
        </div>
      </div>

      {/* Reset / Shorten Another Link */}
      {onReset && (
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <button
            type="button"
            onClick={onReset}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--primary)',
              fontFamily: 'var(--font-body)',
              fontSize: '0.95rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>
              add
            </span>
            Shorten another link
          </button>
        </div>
      )}
    </div>
  );
}
