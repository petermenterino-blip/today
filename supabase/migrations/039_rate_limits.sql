-- 039_rate_limits.sql
-- Production-safe rate limiting table for edge functions.
-- Replaces the in-memory Map<> that was broken in serverless (each instance has its own state).
-- Each row represents one rate limit counter for one key (function:userid or function:ip).
-- Rows expire and are auto-cleaned by the expires_at comparison.

create table if not exists public.rate_limits (
  key text primary key,
  count integer not null default 1,
  expires_at timestamptz not null,
  updated_at timestamptz not null default now()
);

-- Index for cleanup queries
create index if not exists idx_rate_limits_expires_at on public.rate_limits(expires_at);

-- No RLS needed — only accessible via service_role key in edge functions
