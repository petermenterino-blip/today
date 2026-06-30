-- Enable Realtime on tables for live subscriptions
-- Messages: new message notifications
-- Notifications: real-time badge updates
-- Sessions: status changes (scheduled → completed/cancelled)

alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.sessions;
alter publication supabase_realtime add table public.bookings;
