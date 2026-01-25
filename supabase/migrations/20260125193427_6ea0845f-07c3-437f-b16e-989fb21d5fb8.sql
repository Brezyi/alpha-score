-- =====================================================
-- SECURITY HARDENING: Hide Sensitive Hashes & Tokens
-- =====================================================

-- 1. ADMIN PASSWORDS: Create view that hides password_hash
-- =====================================================
CREATE OR REPLACE VIEW public.admin_passwords_safe
WITH (security_invoker = on) AS
SELECT 
  id,
  user_id,
  created_at,
  last_changed_at,
  expires_at
  -- password_hash is intentionally excluded
FROM public.admin_passwords;

-- Block direct SELECT on base table (only allow via RPC functions)
DROP POLICY IF EXISTS "Users can check their own admin password status" ON public.admin_passwords;
CREATE POLICY "No direct SELECT - use functions" 
ON public.admin_passwords FOR SELECT
USING (false);

-- Keep INSERT and UPDATE for authenticated users setting their own password
-- These are already properly restricted

-- 2. MFA BACKUP CODES: Create view that hides code_hash
-- =====================================================
CREATE OR REPLACE VIEW public.mfa_backup_codes_safe
WITH (security_invoker = on) AS
SELECT 
  id,
  user_id,
  created_at,
  used,
  used_at
  -- code_hash is intentionally excluded
FROM public.mfa_backup_codes
WHERE user_id = auth.uid();

-- Block direct SELECT on base table
DROP POLICY IF EXISTS "Users can view their own backup codes metadata" ON public.mfa_backup_codes;
CREATE POLICY "No direct SELECT - use view or functions" 
ON public.mfa_backup_codes FOR SELECT
USING (false);

-- 3. ACCOUNT DELETION TOKENS: Create view that hides token
-- =====================================================
CREATE OR REPLACE VIEW public.account_deletion_tokens_safe
WITH (security_invoker = on) AS
SELECT 
  id,
  user_id,
  created_at,
  used,
  expires_at
  -- token is intentionally excluded
FROM public.account_deletion_tokens
WHERE user_id = auth.uid();

-- Block direct SELECT on base table
DROP POLICY IF EXISTS "Users can view their own deletion tokens" ON public.account_deletion_tokens;
CREATE POLICY "No direct SELECT - use view or functions" 
ON public.account_deletion_tokens FOR SELECT
USING (false);

-- 4. ADMIN PASSWORD RESET TOKENS: Already has USING(false), verified secure
-- =====================================================

-- 5. Ensure all system settings are only readable by owners (except maintenance_mode)
-- Already configured correctly, verified

-- 6. Add additional protection: Rate limit function for sensitive operations
-- =====================================================
CREATE OR REPLACE FUNCTION public.check_sensitive_rate_limit(
  _action_type text,
  _max_actions integer DEFAULT 5,
  _time_window interval DEFAULT '1 hour'::interval
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT COUNT(*) < _max_actions
      FROM public.audit_logs
      WHERE actor_id = auth.uid()
        AND action_type = _action_type
        AND created_at > (now() - _time_window)
    ),
    true
  )
$$;

-- 7. Create secure function to get admin password status without exposing hash
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_admin_password_status()
RETURNS TABLE(
  has_password boolean,
  is_expired boolean,
  days_until_expiry integer,
  last_changed_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    EXISTS(SELECT 1 FROM admin_passwords WHERE user_id = auth.uid()) as has_password,
    COALESCE(
      (SELECT ap.expires_at < now() FROM admin_passwords ap WHERE ap.user_id = auth.uid()),
      false
    ) as is_expired,
    COALESCE(
      (SELECT EXTRACT(DAY FROM (ap.expires_at - now()))::integer FROM admin_passwords ap WHERE ap.user_id = auth.uid()),
      0
    ) as days_until_expiry,
    (SELECT ap.last_changed_at FROM admin_passwords ap WHERE ap.user_id = auth.uid()) as last_changed_at;
END;
$$;

-- 8. Create secure function to get backup codes count without exposing hashes
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_backup_codes_count(_user_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::integer
  FROM public.mfa_backup_codes
  WHERE user_id = _user_id
    AND used = false
$$;

-- 9. Verify all sensitive tables have RLS enabled (double-check)
-- =====================================================
ALTER TABLE public.admin_passwords ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mfa_backup_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_deletion_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_password_reset_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sensitive_data ENABLE ROW LEVEL SECURITY;

-- 10. Add audit logging for security-sensitive operations
-- =====================================================
CREATE OR REPLACE FUNCTION public.log_security_event(
  _event_type text,
  _details jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.audit_logs (
    action_type,
    actor_id,
    table_name,
    metadata
  ) VALUES (
    _event_type,
    auth.uid(),
    'security_events',
    _details
  );
END;
$$;

-- 11. Grant SELECT on safe views to authenticated users
-- =====================================================
GRANT SELECT ON public.admin_passwords_safe TO authenticated;
GRANT SELECT ON public.mfa_backup_codes_safe TO authenticated;
GRANT SELECT ON public.account_deletion_tokens_safe TO authenticated;