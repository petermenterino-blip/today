create table if not exists public.email_templates (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  subject text not null,
  body text not null,
  variables text[] default '{}',
  updated_at timestamptz not null default now()
);

alter table public.email_templates enable row level security;

create policy "Anyone can read email_templates"
  on public.email_templates for select
  to authenticated
  using (true);

create policy "Mentors can update email_templates"
  on public.email_templates for update
  to authenticated
  using (auth.jwt() ->> 'role' = 'mentor')
  with check (auth.jwt() ->> 'role' = 'mentor');

insert into public.email_templates (key, subject, body, variables) values
(
  'application_submitted',
  'Application Received - Mentorino',
  '<h1>Thanks, {{name}}!</h1><p>Your application for <strong>{{programTitle}}</strong> has been received. We will review it and get back to you within 48 hours.</p><p>Best,<br/>The Mentorino Team</p>',
  array['name', 'email', 'programTitle']
),
(
  'application_approved',
  'Welcome to Mentorino!',
  '<h1>Welcome, {{name}}!</h1><p>Your application has been approved! Here are your login details:</p><p><strong>Email:</strong> {{email}}<br/><strong>Temporary Password:</strong> {{tempPassword}}</p><p>Please sign in and change your password after your first login.</p><p>Best,<br/>The Mentorino Team</p>',
  array['name', 'email', 'tempPassword', 'programTitle']
),
(
  'application_rejected',
  'Application Update - Mentorino',
  '<h1>Hi {{name}},</h1><p>Your application for <strong>{{programTitle}}</strong> has been reviewed.</p><p><strong>Status:</strong> Not accepted at this time</p>{{feedback}}<p>We encourage you to reapply in the future.</p><p>Best,<br/>The Mentorino Team</p>',
  array['name', 'email', 'programTitle', 'feedback']
),
(
  'broadcast',
  'Message from Mentorino',
  '<h1>Hi {{name}},</h1><p>{{message}}</p><p>Best,<br/>{{senderName}}</p>',
  array['name', 'message', 'senderName']
);
