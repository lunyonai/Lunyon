-- Redact Gmail send confirmation bodies after consume or expiry.
-- GENERATE ONLY. Apply in Supabase after 20261013_gmail_send_intents
-- if that table already stores To/Cc/Bcc/subject/text in payload jsonb.
-- Does not drop the table. Does not touch Calendar or AI tables.

update public.gmail_send_intents
set payload = jsonb_build_object(
  'redacted', true,
  'action', action,
  'threadId', payload -> 'threadId'
)
where (consumed_at is not null or expires_at < now())
  and coalesce(payload ->> 'redacted', 'false') <> 'true';

comment on table public.gmail_send_intents is
  'Short-lived Gmail send confirmations. After consume or expiry, payload must be redacted; bodies must not be retained.';
