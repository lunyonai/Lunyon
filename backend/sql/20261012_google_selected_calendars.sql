-- Selected Google Calendar IDs for Lunyon Calendar reads.
-- GENERATE ONLY. Do not apply until approved.
-- Prerequisite: public.integration_connections
--   (20260925_phase2_5_integration_connections.sql or the reviewed equivalent).
-- Additive only: does not drop tables, rows, credentials, policies, or grants.

alter table public.integration_connections
  add column if not exists selected_calendar_ids text[] default null;

comment on column public.integration_connections.selected_calendar_ids is
  'Google Calendar IDs Lunyon may read. NULL = not chosen yet (follow Google CalendarList selected flags). Empty array = read none. Never treat NULL and {} as the same.';
