-- ──────────────────────────────────────────────────────────────────────────────
-- Phase 3: Transactional Provisioning Engine
-- Adds provisioning job tracking, audit logging, and recovery support.
-- UP:   Creates provisioning_jobs + provisioning_audit_logs tables.
-- DOWN: Drops both tables.
-- ──────────────────────────────────────────────────────────────────────────────

-- ═══════════════════════════════════════════════════════════════════════════════
-- UP
-- ═══════════════════════════════════════════════════════════════════════════════

-- ── 1. Provisioning Jobs ──────────────────────────────────────────────────────
-- Tracks every provisioning attempt with full state machine support.
create table if not exists public.provisioning_jobs (
  id uuid primary key default gen_random_uuid(),

  -- Application being provisioned
  application_id uuid not null references public.applications(id) on delete cascade,

  -- Idempotency: unique per application, prevents duplicate provisioning
  idempotency_key text not null,

  -- Who requested this
  mentor_id uuid not null references public.profiles(id) on delete cascade,
  student_id uuid references public.profiles(id) on delete set null,

  -- State machine status
  status text not null default 'pending'
    check (status in (
      'pending', 'running', 'completed', 'failed', 'rolled_back', 'retrying'
    )),

  -- Current step in the state machine
  current_step text not null default 'validating'
    check (current_step in (
      'validating',
      'creating_auth_user',
      'creating_profile',
      'updating_application',
      'initializing_crm',
      'creating_goals',
      'creating_conversations',
      'sending_email',
      'completed',
      'rolling_back',
      'failed'
    )),

  -- Step ordering counter
  step_order integer not null default 0,

  -- Timing
  start_time timestamptz,
  end_time timestamptz,
  execution_time_ms integer,

  -- Retry
  retry_count integer not null default 0,
  max_retries integer not null default 3,

  -- Error tracking
  last_error text,
  last_error_detail jsonb default '{}'::jsonb,

  -- Result data
  result_data jsonb default '{}'::jsonb,

  -- Timestamps
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Enforce idempotency per application
  unique(application_id, idempotency_key)
);

-- Indexes for querying
create index if not exists idx_provisioning_jobs_status
  on public.provisioning_jobs(status);
create index if not exists idx_provisioning_jobs_application
  on public.provisioning_jobs(application_id);
create index if not exists idx_provisioning_jobs_mentor
  on public.provisioning_jobs(mentor_id);
create index if not exists idx_provisioning_jobs_created
  on public.provisioning_jobs(created_at desc);

-- Enable RLS (policy: service_role only — no direct public access)
alter table public.provisioning_jobs enable row level security;

-- Auto-update updated_at
create or replace function public.handle_provisioning_jobs_updated_at()
returns trigger
language plpgsql
security definer
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$ begin
  if not exists (
    select 1 from pg_trigger where tgname = 'set_provisioning_jobs_updated_at'
  ) then
    create trigger set_provisioning_jobs_updated_at
      before update on public.provisioning_jobs
      for each row
      execute function public.handle_provisioning_jobs_updated_at();
  end if;
end $$;

-- ── 2. Provisioning Audit Log ─────────────────────────────────────────────────
-- Immutable audit trail for every provisioning state transition.
create table if not exists public.provisioning_audit_logs (
  id uuid primary key default gen_random_uuid(),

  -- Link to the provisioning job
  provisioning_job_id uuid not null references public.provisioning_jobs(id) on delete cascade,

  -- Application being provisioned
  application_id uuid not null references public.applications(id) on delete cascade,

  -- Trace identifiers
  request_id text not null,
  mentor_id uuid not null,

  -- What happened
  action text not null,
  step text not null,
  status text not null
    check (status in ('started', 'completed', 'failed', 'rolled_back', 'retrying', 'skipped')),

  -- Details
  message text,
  metadata jsonb default '{}'::jsonb,

  -- Timing
  duration_ms integer,

  -- Immutable timestamp
  created_at timestamptz not null default now()
);

-- Indexes for querying
create index if not exists idx_audit_logs_job
  on public.provisioning_audit_logs(provisioning_job_id);
create index if not exists idx_audit_logs_application
  on public.provisioning_audit_logs(application_id);
create index if not exists idx_audit_logs_request
  on public.provisioning_audit_logs(request_id);
create index if not exists idx_audit_logs_created
  on public.provisioning_audit_logs(created_at desc);

-- Enable RLS (policy: service_role only — no direct public access)
alter table public.provisioning_audit_logs enable row level security;

-- ── 3. Health Monitoring View ─────────────────────────────────────────────────
-- Provides dashboard-ready provisioning metrics.
create or replace view public.provisioning_dashboard as
select
  count(*) filter (where status = 'completed')::bigint as success_count,
  count(*) filter (where status in ('failed', 'rolled_back'))::bigint as failure_count,
  count(*) filter (where status = 'running')::bigint as running_count,
  count(*) filter (where status = 'retrying')::bigint as retrying_count,
  count(*) filter (where status = 'pending')::bigint as pending_count,
  round(
    avg(execution_time_ms) filter (where status = 'completed')
  )::integer as avg_duration_ms,
  sum(retry_count)::bigint as total_retries,
  count(*) filter (
    where status in ('failed', 'rolled_back') and retry_count > 0
  )::bigint as total_rollbacks,
  count(*) filter (
    where status = 'completed' and retry_count > 0
  )::bigint as recovered_jobs
from public.provisioning_jobs;

-- ═══════════════════════════════════════════════════════════════════════════════
-- DOWN (reversible)
-- ═══════════════════════════════════════════════════════════════════════════════
-- drop view if exists public.provisioning_dashboard;
-- drop table if exists public.provisioning_audit_logs;
-- drop table if exists public.provisioning_jobs;
-- drop function if exists public.handle_provisioning_jobs_updated_at;
