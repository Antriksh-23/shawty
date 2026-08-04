import type { Metadata, Viewport } from 'next';
import './globals.css';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: 'Shawty — The Delightful Link Shortener',
  description:
    'The delightfully fast, fiercely secure way to share your links. Freshly baked performance for modern web needs.',
  keywords: ['url shortener', 'link shortener', 'short links', 'qr codes', 'link analytics', 'shawty'],
  openGraph: {
    title: 'Shawty — The Delightful Link Shortener',
    description: 'The delightfully fast, fiercely secure way to share your links.',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Shawty — The Delightful Link Shortener',
    description: 'The delightfully fast, fiercely secure way to share your links.',
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="light">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
