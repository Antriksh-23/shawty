// ─── Shared Types ─────────────────────────────────────────────────────────────

export interface Link {
  id: string;
  short_code: string;
  original_url: string;
  user_id: string | null;
  password_hash: string | null;
  expires_at: string | null;
  max_clicks: number | null;
  click_count: number;
  is_active: boolean;
  domain_id: string | null;
  created_at: string;
}

export interface Click {
  id: string;
  link_id: string;
  clicked_at: string;
  ip_hash: string | null;
  country: string | null;
  device_type: string | null;
  browser: string | null;
  referrer: string | null;
}

export interface CreateLinkRequest {
  url: string;
  custom_slug?: string;
  expires_at?: string;
  password?: string;
  max_clicks?: number;
}

export interface CreateLinkResponse {
  short_url: string;
  short_code: string;
  original_url: string;
  expires_at: string | null;
  max_clicks: number | null;
  created_at: string;
}

export interface ApiError {
  error: string;
  code?: string;
}

// ─── Link status after checking expiry / click limits ────────────────────────
export type LinkStatus =
  | 'active'
  | 'expired_time'
  | 'expired_clicks'
  | 'password_protected'
  | 'not_found'
  | 'inactive';

// ─── Analytics Response ────────────────────────────────────────────────────────
export interface BreakdownItem {
  device?: string;
  browser?: string;
  referrer?: string;
  count: number;
  percentage: number;
}

export interface ClicksOverTimeItem {
  date: string;
  count: number;
}

export interface RecentClickItem {
  id: string;
  clicked_at: string;
  device_type: string;
  browser: string;
  referrer: string;
}

export interface LinkStatsResponse {
  link: {
    short_code: string;
    original_url: string;
    click_count: number;
    max_clicks: number | null;
    expires_at: string | null;
    is_active: boolean;
    created_at: string;
  };
  metrics: {
    total_clicks: number;
    unique_visitors: number;
  };
  clicks_by_device: BreakdownItem[];
  clicks_by_browser: BreakdownItem[];
  clicks_by_referrer: BreakdownItem[];
  clicks_over_time: ClicksOverTimeItem[];
  recent_clicks: RecentClickItem[];
}

