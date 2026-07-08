-- ============================================================
-- MIGRATION 048: ALLOW ANONYMOUS BOOKING TIMELINE INSERTS
--
-- The existing RLS policy only allows mentors to insert into
-- booking_timeline. But visitorBookingService.submit() inserts
-- a 'booking_created' timeline entry using the anonymous key.
-- This migration adds a policy allowing anyone to insert.
-- ============================================================

drop policy if exists "Anyone can insert booking timeline" on public.booking_timeline;
create policy "Anyone can insert booking timeline"
  on public.booking_timeline for insert
  with check (true);
