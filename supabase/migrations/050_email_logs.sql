-- Email logs table for tracking all sent emails
create table if not exists public.email_logs (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references public.visitor_bookings(id) on delete set null,
  recipient_email text not null,
  sender_email text not null default 'notifications@mentorino.com',
  subject text not null,
  template_key text,
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed', 'bounced')),
  email_type text not null check (email_type in ('visitor_confirmation', 'mentor_notification', 'booking_reminder', 'booking_update', 'booking_cancelled', 'booking_rescheduled', 'system')),
  booking_type text check (booking_type in ('intro', 'rapid', 'general')),
  sent_at timestamptz,
  delivered_at timestamptz,
  failure_reason text,
  created_at timestamptz not null default now()
);

create index if not exists idx_email_logs_booking_id on public.email_logs(booking_id);
create index if not exists idx_email_logs_recipient on public.email_logs(recipient_email);
create index if not exists idx_email_logs_status on public.email_logs(status);
create index if not exists idx_email_logs_email_type on public.email_logs(email_type);
create index if not exists idx_email_logs_booking_type on public.email_logs(booking_type);
create index if not exists idx_email_logs_created_at on public.email_logs(created_at desc);

alter table public.email_logs enable row level security;

-- Mentors can read all email logs
drop policy if exists "Mentors can read email logs" on public.email_logs;
create policy "Mentors can read email logs"
  on public.email_logs for select
  using (public.is_mentor());

-- Anyone can insert email logs (used by visitor booking flow with anon key)
drop policy if exists "Anyone can insert email logs" on public.email_logs;
create policy "Anyone can insert email logs"
  on public.email_logs for insert
  with check (true);

-- Mentors can update email logs (status changes from resend flow)
drop policy if exists "Mentors can update email logs" on public.email_logs;
create policy "Mentors can update email logs"
  on public.email_logs for update
  using (public.is_mentor())
  with check (public.is_mentor());

-- Add to realtime publication
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'email_logs') then
    alter publication supabase_realtime add table public.email_logs;
  end if;
end $$;

-- Seed booking email templates (idempotent)
insert into public.email_templates (key, subject, body, variables) values
(
  'booking_confirmation_visitor',
  'Your {{callType}} Call is Booked — Mentorino',
  '<h1>Thanks, {{visitorName}}!</h1><p>Your <strong>{{callType}}</strong> call has been booked for <strong>{{date}}</strong> at <strong>{{time}}</strong>.</p><p>We will be in touch soon to confirm the details.</p><p>Meeting type: <strong>{{meetingType}}</strong></p><p>Best,<br/>The Mentorino Team</p>',
  array['visitorName', 'callType', 'date', 'time', 'meetingType', 'message', 'email']
) on conflict (key) do nothing;

insert into public.email_templates (key, subject, body, variables) values
(
  'booking_notification_mentor',
  'New {{callType}} Booking — {{visitorName}}',
  '<h1>New Booking Received</h1><p><strong>Name:</strong> {{visitorName}}<br/><strong>Email:</strong> {{visitorEmail}}<br/><strong>Phone:</strong> {{visitorPhone}}<br/><strong>Call Type:</strong> {{callType}}<br/><strong>Date:</strong> {{date}}<br/><strong>Time:</strong> {{time}}<br/><strong>Meeting Type:</strong> {{meetingType}}</p><p><strong>Message:</strong><br/>{{message}}</p><p>Please review and follow up at your earliest convenience.</p>',
  array['visitorName', 'visitorEmail', 'visitorPhone', 'callType', 'date', 'time', 'meetingType', 'message']
) on conflict (key) do nothing;
