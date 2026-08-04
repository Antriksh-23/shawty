# ⚡ Shawty — URL Shortener

A full-stack URL shortening service built with Next.js 14, Supabase Postgres, and Upstash Redis.

![Shawty](https://img.shields.io/badge/phase-1--MVP-6366f1?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?style=for-the-badge&logo=typescript)

## Features (Phase 1 — MVP)

- ⚡ **Lightning-fast redirects** — Redis-cached, sub-5ms on cache hit
- 🛡️ **Malware protection** — Google Safe Browsing API integration
- 🎯 **Custom slugs** — `/my-launch`, `/sale`, whatever you want
- 📱 **QR codes** — PNG + SVG, generated on-demand, cached
- 🔒 **Password protection** — bcrypt-hashed, interstitial page
- ⏰ **Link expiration** — by date and/or click count
- 🚦 **Rate limiting** — IP-based, 20 links/hour for anonymous users
- 🔗 **Preview page** — safety interstitial before redirecting

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Database | Supabase / Postgres (`postgres.js`) |
| Cache + Rate Limit | Upstash Redis (`@upstash/redis`) |
| QR Codes | `qrcode` npm package |
| Malware Check | Google Safe Browsing API v4 |
| Password Hashing | `bcryptjs` |
| Tests | Vitest |
| Deployment | Docker → Render |

## Quick Start

### 1. Clone and install

```bash
git clone <your-repo>
cd shawty
npm install
```

### 2. Set up environment

```bash
cp .env.example .env.local
# Edit .env.local with your credentials
```

### 3. Start local services (Docker)

```bash
docker-compose up -d
```

This starts:
- Postgres on port `5432`
- Redis on port `6379`
- Upstash-compatible Redis REST proxy on port `8079`

### 4. Run database migrations

Connect to Supabase SQL editor (or your local Postgres) and run:

```bash
# Against local Docker Postgres:
psql postgresql://postgres:shawty_dev@localhost:5432/shawty -f supabase/migrations/001_initial_schema.sql
```

### 5. Start dev server

```bash
npm run dev
```

Visit `http://localhost:3000`

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | Postgres connection string |
| `UPSTASH_REDIS_REST_URL` | ✅ | Upstash Redis REST endpoint |
| `UPSTASH_REDIS_REST_TOKEN` | ✅ | Upstash Redis REST token |
| `GOOGLE_SAFE_BROWSING_KEY` | ⚠️ | Safe Browsing API key (optional — skips check if unset) |
| `NEXT_PUBLIC_BASE_URL` | ✅ | Your short domain, e.g. `https://shwt.ly` |
| `BCRYPT_ROUNDS` | — | bcrypt cost factor (default: 12) |
| `RATE_LIMIT_ANON_MAX` | — | Anonymous rate limit (default: 20/hour) |
| `CAPTCHA_ENABLED` | — | Set `true` to enable hCaptcha |

## API

Full OpenAPI 3.1 spec: [`docs/openapi.yaml`](docs/openapi.yaml)

### Key endpoints

```
POST   /api/links           Create a short link
GET    /:code               Redirect to original URL  ← hottest path
GET    /api/links/:code     Get link metadata
PUT    /api/links/:code     Update destination URL
DELETE /api/links/:code     Deactivate a link
GET    /api/links/:code/qr  Get QR code (PNG or SVG)
POST   /api/links/:code/unlock  Unlock password-protected link
GET    /api/health          Health check
```

### Example: Create a link

```bash
curl -X POST http://localhost:3000/api/links \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com/very/long/url",
    "custom_slug": "my-link",
    "expires_at": "2025-12-31T23:59:59Z"
  }'
```

Response:
```json
{
  "short_url": "http://localhost:3000/my-link",
  "short_code": "my-link",
  "original_url": "https://example.com/very/long/url",
  "expires_at": "2025-12-31T23:59:59.000Z",
  "max_clicks": null,
  "created_at": "2025-08-04T10:00:00.000Z"
}
```

## Running Tests

```bash
npm test                   # Run all tests once
npm run test:watch         # Watch mode
npm run test:coverage      # Coverage report
```

### Test coverage

- `codegen.test.ts` — Code generation, collision handling, reserved slugs, IP hashing
- `url-utils.test.ts` — URL normalization, scheme blocking, slug validation
- `safebrowsing.test.ts` — API integration, graceful degradation, error handling
- `ratelimit.test.ts` — Rate limiting logic, per-IP isolation, IP extraction
- `redirect.test.ts` — Expiry, click limits, password gate, priority ordering

## Deployment (Render)

1. Push to GitHub
2. Create a new Render Web Service → select Docker
3. Add environment variables from `.env.example`
4. Deploy — `render.yaml` is pre-configured

The app exposes `/api/health` for Render's health check.

## Phase Roadmap

| Phase | Status | Features |
|---|---|---|
| 1 — MVP | ✅ Done | Shorten, redirect, custom slugs, rate limiting, malware check, QR codes, password protection, expiration |
| 2 — Accounts | 🔜 Planned | User auth, dashboard, click analytics, link editing |
| 3 — Enterprise | 🔜 Planned | Bulk shortening, API keys, teams, custom domains |

The DB schema already includes tables for Phase 2 (`clicks`, `users`) and Phase 3 (`domains`, `api_keys`). Adding Phase 2 requires new routes + UI, not schema migrations.

## Project Structure

```
src/
├── app/
│   ├── [code]/
│   │   ├── route.ts         # ← Redirect handler (hottest path)
│   │   └── preview/
│   │       ├── page.tsx     # Safety interstitial
│   │       └── PasswordForm.tsx
│   ├── api/
│   │   ├── links/route.ts   # POST /api/links
│   │   ├── links/[code]/
│   │   │   ├── route.ts     # GET/PUT/DELETE
│   │   │   ├── qr/route.ts  # QR code generation
│   │   │   └── unlock/route.ts  # Password unlock
│   │   └── health/route.ts
│   ├── page.tsx             # Landing page
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ShortenerForm.tsx
│   └── ResultCard.tsx
├── lib/
│   ├── db.ts                # Postgres client
│   ├── redis.ts             # Upstash Redis client
│   ├── codegen.ts           # Base62 + collision check
│   ├── url-utils.ts         # URL validation + slug check
│   ├── safebrowsing.ts      # Google Safe Browsing
│   ├── ratelimit.ts         # IP rate limiting
│   ├── redirect-logic.ts    # Pure redirect resolution (testable)
│   └── types.ts
└── __tests__/
    ├── setup.ts
    ├── codegen.test.ts
    ├── url-utils.test.ts
    ├── safebrowsing.test.ts
    ├── ratelimit.test.ts
    └── redirect.test.ts
```

## License

MIT
