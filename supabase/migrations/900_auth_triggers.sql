-- Auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'role', 'student')
  );
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Update updated_at on profile changes
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

create trigger set_programs_updated_at
  before update on public.programs
  for each row execute function public.handle_updated_at();

create trigger set_sessions_updated_at
  before update on public.sessions
  for each row execute function public.handle_updated_at();

create trigger set_goals_updated_at
  before update on public.goals
  for each row execute function public.handle_updated_at();

create trigger set_tasks_updated_at
  before update on public.tasks
  for each row execute function public.handle_updated_at();

create trigger set_journals_updated_at
  before update on public.journals
  for each row execute function public.handle_updated_at();

create trigger set_bookings_updated_at
  before update on public.bookings
  for each row execute function public.handle_updated_at();

create trigger set_conversations_updated_at
  before update on public.conversations
  for each row execute function public.handle_updated_at();

create trigger set_events_updated_at
  before update on public.events
  for each row execute function public.handle_updated_at();

create trigger set_applications_updated_at
  before update on public.applications
  for each row execute function public.handle_updated_at();

create trigger set_mentor_settings_updated_at
  before update on public.mentor_settings
  for each row execute function public.handle_updated_at();

create trigger set_dashboard_layouts_updated_at
  before update on public.dashboard_layouts
  for each row execute function public.handle_updated_at();

create trigger set_form_templates_updated_at
  before update on public.form_templates
  for each row execute function public.handle_updated_at();

create trigger set_mentor_availability_updated_at
  before update on public.mentor_availability
  for each row execute function public.handle_updated_at();
