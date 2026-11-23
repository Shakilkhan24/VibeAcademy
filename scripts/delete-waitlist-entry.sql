-- Run with psql -X -f after verifying the requester's mailbox (docs/privacy.md).
\set ON_ERROR_STOP on
\set VERBOSITY terse
\warn Enter the verified waitlist email and press Return.
\prompt address

WITH removed AS (
  DELETE FROM public.waitlist_entries
  WHERE email = lower(btrim($1))
  RETURNING 1
)
INSERT INTO public.events (id, name, created_at, props)
SELECT gen_random_uuid()::text, 'waitlist_deleted', date_trunc('day', CURRENT_TIMESTAMP, 'UTC'), '{}'::jsonb
FROM removed
RETURNING (created_at AT TIME ZONE 'UTC')::date AS deletion_date_utc
\bind :address
\g
\unset address
