-- Applications table
create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  email text not null,
  first_name text not null,
  last_name text not null,
  phone_number text,
  discipline text,
  reason_for_applying jsonb,
  status text not null default 'pending_review' check (status in ('pending_review', 'approved', 'rejected', 'more_info_needed', 'invited')),
  mentor_type text,
  meeting_preference text check (meeting_preference in ('Virtual', 'In-Person', 'Hybrid')),
  frequency text,
  seriousness integer check (seriousness >= 1 and seriousness <= 10),
  location text,
  focus_area text,
  program_id uuid references public.programs(id) on delete set null,
  role_selected text,
  top_strength text,
  needs_focus text,
  mentor_notes text,
  rejection_reason text,
  feedback text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists idx_applications_user on public.applications(user_id);
create index if not exists idx_applications_status on public.applications(status);
create index if not exists idx_applications_email on public.applications(email);

-- Application notes
create table if not exists public.application_notes (
  id uuid primary key default gen_random_uuid(),
  application_id uuid references public.applications(id) on delete cascade not null,
  author_id uuid references public.profiles(id) on delete set null,
  content text not null,
  created_at timestamptz not null default now()
);

-- Application info requests (for more_info_needed flow)
create table if not exists public.application_info_requests (
  id uuid primary key default gen_random_uuid(),
  application_id uuid references public.applications(id) on delete cascade not null,
  requested_info text not null,
  response text,
  status text default 'pending' check (status in ('pending', 'responded')),
  created_at timestamptz not null default now(),
  responded_at timestamptz
);
