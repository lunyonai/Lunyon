-- Recovery email existence lookup (service_role only).
-- Do not grant execute to anon, authenticated, or PUBLIC.
-- Apply in the production Supabase SQL editor after review. Do not expose as an anonymous RPC.

CREATE TABLE IF NOT EXISTS public.lunyon_recovery_lookup_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_hash text NOT NULL,
  email_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS lunyon_recovery_lookup_events_ip_created_idx
  ON public.lunyon_recovery_lookup_events (ip_hash, created_at);

CREATE INDEX IF NOT EXISTS lunyon_recovery_lookup_events_email_created_idx
  ON public.lunyon_recovery_lookup_events (email_hash, created_at);

ALTER TABLE public.lunyon_recovery_lookup_events ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.lunyon_recovery_lookup_events FROM PUBLIC;
REVOKE ALL ON TABLE public.lunyon_recovery_lookup_events FROM anon, authenticated;
GRANT SELECT, INSERT, DELETE ON TABLE public.lunyon_recovery_lookup_events TO service_role;

CREATE OR REPLACE FUNCTION public.lunyon_email_is_registered(p_email text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM auth.users AS u
    WHERE u.email IS NOT NULL
      AND lower(u.email::text) = lower(btrim(p_email))
  );
$$;

REVOKE ALL ON FUNCTION public.lunyon_email_is_registered(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.lunyon_email_is_registered(text) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.lunyon_email_is_registered(text) TO service_role;

COMMENT ON FUNCTION public.lunyon_email_is_registered(text) IS
  'Service-role only. Returns whether a normalized email exists in auth.users.';

CREATE OR REPLACE FUNCTION public.lunyon_recovery_lookup_consume(
  p_ip_hash text,
  p_email_hash text,
  p_window_seconds integer DEFAULT 900,
  p_ip_limit integer DEFAULT 8,
  p_email_limit integer DEFAULT 5
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_since timestamptz := now() - make_interval(secs => p_window_seconds);
  v_ip_count integer;
  v_email_count integer;
BEGIN
  IF p_ip_hash IS NULL OR btrim(p_ip_hash) = '' OR p_email_hash IS NULL OR btrim(p_email_hash) = '' THEN
    RETURN 'limited';
  END IF;

  DELETE FROM public.lunyon_recovery_lookup_events
  WHERE created_at < now() - interval '2 days';

  SELECT count(*)::integer INTO v_ip_count
  FROM public.lunyon_recovery_lookup_events
  WHERE ip_hash = p_ip_hash
    AND created_at >= v_since;

  SELECT count(*)::integer INTO v_email_count
  FROM public.lunyon_recovery_lookup_events
  WHERE email_hash = p_email_hash
    AND created_at >= v_since;

  IF v_ip_count >= p_ip_limit OR v_email_count >= p_email_limit THEN
    RETURN 'limited';
  END IF;

  INSERT INTO public.lunyon_recovery_lookup_events (ip_hash, email_hash)
  VALUES (p_ip_hash, p_email_hash);

  RETURN 'ok';
END;
$$;

REVOKE ALL ON FUNCTION public.lunyon_recovery_lookup_consume(text, text, integer, integer, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.lunyon_recovery_lookup_consume(text, text, integer, integer, integer) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.lunyon_recovery_lookup_consume(text, text, integer, integer, integer) TO service_role;

COMMENT ON FUNCTION public.lunyon_recovery_lookup_consume(text, text, integer, integer, integer) IS
  'Service-role only. Persistent IP and email hash rate limit for recovery lookups.';
