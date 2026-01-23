-- =====================================================
-- CRITICAL SECURITY FIX - Final Round
-- =====================================================

-- 1. FIX: Remove the dangerous Token validation policy
-- The old policy allows ANYONE to read ALL tokens with USING(true)
DROP POLICY IF EXISTS "Token validation by token value" ON public.account_deletion_tokens;

-- 2. FIX: Remove the overly permissive promo_codes policy
DROP POLICY IF EXISTS "Anyone can view active promo codes by code" ON public.promo_codes;
DROP POLICY IF EXISTS "Authenticated users can validate promo codes" ON public.promo_codes;
DROP POLICY IF EXISTS "Authenticated users can validate specific promo codes" ON public.promo_codes;

-- Create a properly restricted policy - only for authenticated users checking valid codes
CREATE POLICY "Authenticated users can check promo codes"
ON public.promo_codes
FOR SELECT
TO authenticated
USING (
  is_active = true AND 
  (expires_at IS NULL OR expires_at > now()) AND
  (max_uses IS NULL OR current_uses < max_uses)
);

-- 3. FIX: failed_login_attempts - Add proper admin policy
DROP POLICY IF EXISTS "Admins can view failed login attempts" ON public.failed_login_attempts;
DROP POLICY IF EXISTS "Admins and owners can view failed login attempts" ON public.failed_login_attempts;

CREATE POLICY "Only admins and owners can view failed logins"
ON public.failed_login_attempts
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'owner')
);