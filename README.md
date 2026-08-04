<div align="center">

# ⚡ Shawty
### An Enterprise-Grade, Edge-Optimized URL Shortener & Real-Time Analytics Platform

[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.22-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Upstash Redis](https://img.shields.io/badge/Upstash_Redis-Edge_Cache-00E9A3?style=for-the-badge&logo=redis&logoColor=white)](https://upstash.com/)
[![Supabase PostgreSQL](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Vitest](https://img.shields.io/badge/Tested_with-Vitest-6E9F18?style=for-the-badge&logo=vitest&logoColor=white)](https://vitest.dev/)

<p align="center">
  <strong>Shawty</strong> is a high-performance URL shortener and click analytics platform engineered with modern <em>Warm Tech & Bakery Cream</em> aesthetics. It combines edge-cached redirects, Google Safe Browsing malware verification, interactive Chart.js analytics, Web Crypto JWT authentication, and customizable QR code generation into a single sleek web application.
</p>

</div>

---

## ✨ Why Shawty?

| Feature | Description |
| :--- | :--- |
| **⚡ Sub-10ms Edge Redirects** | Employs an **Upstash Redis** caching layer over **Supabase PostgreSQL** to resolve custom short links and slugs in under 10 milliseconds. |
| **🛡️ Google Safe Browsing Shield** | Automatically scans destination URLs against **Google Safe Browsing API** before shortening to block phishing, malware, and unwanted software. |
| **📊 Live Click Analytics & History** | Comprehensive interactive **Chart.js** graphs showing click trends over 7/30 days, device breakdowns (Desktop/Mobile/Tablet), top referrers, and country tracking. |
| **🔐 Edge Web Crypto JWT Auth** | Zero-dependency, native `crypto.subtle` HMAC-SHA256 token signing with secure HTTP-only cookies and **bcryptjs** password hashing. |
| **📲 Themed QR Code Generator** | Instantly generate scannable QR codes in custom brand color palettes (*Warm Brown*, *Bakery Cream*, *Deep Dark*) with one-click **SVG** and **PNG** exports. |
| **⏱️ Advanced Link Controls** | Configure **expiration timestamps** (`expires_at`), **maximum click caps** (`max_clicks`), and **password-protected** links. |
| **🚫 DDoS & Rate Limiting** | Automated IP request throttling via Upstash Redis to prevent spam and abuse. |
| **🎨 "Warm Tech" UI Design** | Curated palette (`#974822` primary, `#F5EBE6` bakery cream), glassmorphism cards, micro-animations, and responsive layout. |

---

## 📐 System Architecture & Data Flow

```mermaid
graph TD
    User["👤 Visitor / Client"] -->|1. GET /shortCode| Edge["⚡ Next.js App Router (Edge Runtime)"]
    Edge -->|2. Check Redis Cache| Redis[("⚡ Upstash Redis Cache")]
    
    Redis -- "Hit (<10ms)" --> Redirect["🚀 Immediate 307 / 301 Redirect"]
    Redis -- "Miss / Expired" --> DB[("🐘 Supabase PostgreSQL")]
    
    DB -->|3. Cache Mapping| Redis
    DB -->|4. Return Link Record| Edge
    Edge -->|5. Asynchronous Click Log| ClickDB[("📊 Clicks Analytics Table")]
    Edge --> Redirect
    
    subgraph Security & Creation Flow
        Creator["🛠️ Link Creator"] -->|POST /api/links| SafeBrowsing["🛡️ Google Safe Browsing API"]
        SafeBrowsing -- "Clean URL" --> RateLimit["🚫 Upstash IP Rate Limiter"]
        RateLimit -- "Allowed" --> DB
    end
```

---

## 🛠️ Technology Stack

```table
| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Framework** | [Next.js 14 App Router](https://nextjs.org/) | React Server Components, API routes, edge-ready middleware |
| **Language** | [TypeScript 5](https://www.typescriptlang.org/) | End-to-end type safety across frontend and backend |
| **Database** | [Supabase PostgreSQL](https://supabase.com/) | Relational storage for users, short links, and click logs |
| **ORM** | [Prisma 5](https://www.prisma.io/) | Type-safe database schema modeling and migrations |
| **Edge Cache** | [Upstash Redis](https://upstash.com/) | Sub-10ms redirect caching, IP rate limiting, and real-time counters |
| **Authentication** | Web Crypto API + [bcryptjs](https://github.com/dcodeIO/bcrypt.js) | Native `crypto.subtle` HMAC-SHA256 JWT cookies & password hashing |
| **Analytics Charting** | [Chart.js](https://www.chartjs.org/) + `react-chartjs-2` | Responsive click trend visualization |
| **QR Code Engine** | [qrcode](https://github.com/soldair/node-qrcode) | SVG & PNG barcode generation with custom color themes |
| **Automated Testing** | [Vitest](https://vitest.dev/) | 60+ unit tests for algorithms, security shields, and API routes |
```

---

## 🚀 Quickstart & Local Development

### 1. Prerequisites
- **Node.js**: `v20.x` or higher
- **PostgreSQL Database**: Free instance via [Supabase](https://supabase.com)
- **Redis Cache**: Free serverless instance via [Upstash](https://upstash.com)

### 2. Clone & Install Dependencies
```bash
git clone https://github.com/Antriksh-23/shawty.git
cd shawty
npm install
```

### 3. Environment Configuration
> [!CAUTION]
> **Important Security & Git History Notice**: Never commit `.env` or `.env.local` files to Git. If you have previously committed any hardcoded secrets, API keys, or JWT signing keys (`AUTH_SECRET`), **rotate and revoke those secrets immediately**, as older values remain accessible in your Git commit history.

Create a `.env` file in the project root by copying the template:
```bash
cp .env.example .env
```

| Variable | Description | Example |
| :--- | :--- | :--- |
| `DATABASE_URL` | Supabase PostgreSQL pooled connection string | `postgresql://postgres:...@aws-0-...pooler.supabase.com:6543/postgres` |
| `DIRECT_URL` | Supabase PostgreSQL direct connection string (for migrations) | `postgresql://postgres:...@aws-0-...supabase.com:5432/postgres` |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis HTTPS REST endpoint | `https://...upstash.io` |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis authentication token | `AY...` |
| `AUTH_SECRET` | 32+ character secret key for HMAC-SHA256 JWT signing | `your-32-character-random-secret-key-change-in-prod` |
| `IP_HASH_SALT` | Server-side secret pepper for GDPR-compliant IP hashing | `your-secret-pepper-for-gdpr-ip-hashing` |
| `NEXT_PUBLIC_BASE_URL` | Public base URL of the application | `http://localhost:3000` |
| `GOOGLE_SAFE_BROWSING_KEY` | *(Optional)* Google Safe Browsing v4 API Key | `AIzaSy...` |

### 4. Database Setup
Push the Prisma schema to your PostgreSQL database and generate the Prisma client:
```bash
npx prisma db push
npx prisma generate
```

### 5. Launch Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to start shortening URLs!

---

## 🧪 Automated Testing

Shawty includes an extensive unit and integration test suite built with **Vitest**.

```bash
# Run all automated tests synchronously
npm test -- --run

# Run tests in interactive watch mode
npm test
```

### Test Coverage Summary:
- **`src/__tests__/auth.test.ts`**: Verifies Web Crypto HMAC-SHA256 JWT signing, token expiration rejection, signature tampering detection, and Signup/Login HTTP response codes.
- **`src/__tests__/codegen.test.ts`**: Tests collision-free Base62 shortcode generation and reserved slug blocking.
- **`src/__tests__/url-utils.test.ts`**: Validates URL normalization, custom slug format checking, and domain display formatting.
- **`src/__tests__/safebrowsing.test.ts`**: Verifies Google Safe Browsing API malware detection and graceful fallback handling.
- **`src/__tests__/ratelimit.test.ts`**: Validates Upstash Redis rate limiter and client IP extraction headers.
- **`src/__tests__/analytics.test.ts`**: Tests date range formatting, chart aggregations, and click metric calculations.

---

## 📂 Project Structure

```
shawty/
├── prisma/
│   └── schema.prisma        # PostgreSQL database models (User, Link, Click, Domain)
├── src/
│   ├── app/
│   │   ├── api/             # REST API Endpoints (/links, /auth, /user/links, /docs)
│   │   ├── analytics/       # Global Analytics Search Hub page (/analytics)
│   │   ├── auth/            # Sign In & Create Account page (/auth)
│   │   ├── dashboard/       # Personal User Links Dashboard page (/dashboard)
│   │   ├── stats/[code]/    # Interactive Link Click Analytics Dashboard (/stats/[code])
│   │   ├── [code]/          # Dynamic short link redirect handler (/[code])
│   │   └── page.tsx         # Warm Tech Landing Page & URL Shortener Form
│   ├── components/          # Reusable UI components (QrCodeModal, UserNav, ResultCard, ShortenerForm)
│   └── lib/                 # Core domain logic (auth, redis, db, safebrowsing, ratelimit, url-utils)
└── src/__tests__/           # Vitest automated test suite
```

---

## 🤝 Contributing & License
Contributions, issues, and feature requests are welcome!
This project is open-source and licensed under the **MIT License**.
