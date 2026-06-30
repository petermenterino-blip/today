-- Conversations table
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.profiles(id) on delete set null,
  mentor_id uuid references public.profiles(id) on delete set null not null,
  student_name text,
  is_group boolean default false,
  name text,
  description text,
  admin_id uuid references public.profiles(id) on delete set null,
  last_message text,
  last_message_time timestamptz,
  unread_count integer default 0,
  pinned boolean default false,
  archived boolean default false,
  participants uuid[] default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists idx_conv_mentor on public.conversations(mentor_id);
create index if not exists idx_conv_student on public.conversations(student_id);

-- Conversation participants
create table if not exists public.conversation_participants (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  joined_at timestamptz not null default now(),
  unique(conversation_id, user_id)
);

create index if not exists idx_conv_parts_user on public.conversation_participants(user_id);

-- Messages table
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid references public.profiles(id) on delete cascade not null,
  sender_name text,
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  content text not null,
  type text not null default 'text' check (type in ('text', 'image', 'file', 'voice', 'system')),
  status text not null default 'sent' check (status in ('sent', 'delivered', 'read')),
  audio_url text,
  duration numeric,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists idx_messages_conversation on public.messages(conversation_id);
create index if not exists idx_messages_sender on public.messages(sender_id);
create index if not exists idx_messages_created on public.messages(created_at desc);

-- Ensure columns exist if table was created before this migration
alter table public.conversations add column if not exists participants uuid[] default '{}';
alter table public.messages add column if not exists sender_name text;
