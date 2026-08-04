-- =============================================================================
-- Migration 001: Initial Schema
-- Shawty URL Shortener
-- Run this in your Supabase SQL editor or against any Postgres instance.
-- =============================================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- USERS table (Phase 2 — created now so foreign keys work)
-- =============================================================================
CREATE TABLE IF NOT EXISTS users (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email        TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  plan         TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'team')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- DOMAINS table (Phase 3 — custom domains)
-- =============================================================================
CREATE TABLE IF NOT EXISTS domains (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID REFERENCES users(id) ON DELETE CASCADE,
  hostname           TEXT UNIQUE NOT NULL,
  verified           BOOLEAN NOT NULL DEFAULT FALSE,
  verification_token TEXT NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- LINKS table (Phase 1 core)
-- =============================================================================
CREATE TABLE IF NOT EXISTS links (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- short_code is the auto-generated code (e.g. "aB3xKp")
  -- custom_slug is a user-supplied alias (e.g. "my-sale")
  -- The redirect handler resolves either one
  short_code    TEXT UNIQUE NOT NULL,
  original_url  TEXT NOT NULL,
  user_id       UUID REFERENCES users(id) ON DELETE SET NULL,
  password_hash TEXT,
  expires_at    TIMESTAMPTZ,
  max_clicks    INTEGER,
  click_count   INTEGER NOT NULL DEFAULT 0,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  domain_id     UUID REFERENCES domains(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_links_short_code ON links(short_code);
CREATE INDEX IF NOT EXISTS idx_links_user_id ON links(user_id);
CREATE INDEX IF NOT EXISTS idx_links_is_active ON links(is_active);

-- =============================================================================
-- CLICKS table (Phase 2 analytics — schema ready, logging opt-in)
-- =============================================================================
CREATE TABLE IF NOT EXISTS clicks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id     UUID NOT NULL REFERENCES links(id) ON DELETE CASCADE,
  clicked_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Store hashed IP for privacy (GDPR-friendly)
  ip_hash     TEXT,
  country     TEXT,
  device_type TEXT,
  browser     TEXT,
  referrer    TEXT
);

CREATE INDEX IF NOT EXISTS idx_clicks_link_id ON clicks(link_id);
CREATE INDEX IF NOT EXISTS idx_clicks_clicked_at ON clicks(clicked_at);

-- =============================================================================
-- API_KEYS table (Phase 3)
-- =============================================================================
CREATE TABLE IF NOT EXISTS api_keys (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  key_hash         TEXT NOT NULL,
  name             TEXT,
  rate_limit_tier  TEXT NOT NULL DEFAULT 'free',
  last_used_at     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- Helper function: increment click_count atomically
-- =============================================================================
CREATE OR REPLACE FUNCTION increment_click_count(p_short_code TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE links
  SET click_count = click_count + 1
  WHERE short_code = p_short_code;
END;
$$ LANGUAGE plpgsql;
