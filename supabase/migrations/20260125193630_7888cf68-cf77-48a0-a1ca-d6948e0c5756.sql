-- =====================================================
-- SECURITY HARDENING PHASE 2: Fix Remaining Critical Issues
-- =====================================================

-- 1. PRODUCT RECOMMENDATIONS: Hide affiliate links from public view
-- Create a safe view that excludes affiliate links
-- =====================================================
CREATE OR REPLACE VIEW public.product_recommendations_safe
WITH (security_invoker = on) AS
SELECT 
  id,
  name,
  brand,
  category,
  description,
  image_url,
  price_range,
  rating,
  skin_types,
  target_issues,
  is_active,
  created_at
  -- affiliate_link is intentionally excluded - serve via edge function
FROM public.product_recommendations
WHERE is_active = true;

-- Restrict direct table access - only owners can see affiliate links
DROP POLICY IF EXISTS "Anyone can view active products" ON public.product_recommendations;

CREATE POLICY "Owners can manage products" 
ON public.product_recommendations FOR ALL
USING (has_role(auth.uid(), 'owner'::app_role))
WITH CHECK (has_role(auth.uid(), 'owner'::app_role));

-- Allow authenticated users to read the safe view
GRANT SELECT ON public.product_recommendations_safe TO authenticated;
GRANT SELECT ON public.product_recommendations_safe TO anon;

-- 2. SYSTEM SETTINGS: Make maintenance_mode check more secure
-- Create a dedicated function instead of public table access
-- =====================================================
CREATE OR REPLACE FUNCTION public.is_maintenance_mode()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT value::text::boolean 
     FROM public.system_settings 
     WHERE key = 'maintenance_mode'),
    false
  )
$$;

-- Also create function to get public branding info
CREATE OR REPLACE FUNCTION public.get_public_branding()
RETURNS TABLE(
  app_name text,
  app_logo_url text,
  favicon_url text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(
      (SELECT s.value::text FROM system_settings s WHERE s.key = 'app_name'),
      '"GLOWMAXXED AI"'
    )::text as app_name,
    COALESCE(
      (SELECT s.value::text FROM system_settings s WHERE s.key = 'app_logo_url'),
      '""'
    )::text as app_logo_url,
    COALESCE(
      (SELECT s.value::text FROM system_settings s WHERE s.key = 'favicon_url'),
      '""'
    )::text as favicon_url;
END;
$$;

-- Update system_settings policy - allow reading specific public keys
DROP POLICY IF EXISTS "Anyone can view maintenance mode" ON public.system_settings;

CREATE POLICY "Anyone can view public settings" 
ON public.system_settings FOR SELECT
USING (key IN ('maintenance_mode', 'app_name', 'app_logo_url', 'favicon_url'));

-- 3. ADDITIONAL SECURITY: Ensure analyses photos can't be accessed via transformation_submissions
-- Add check that transformation submissions only expose approved photos
-- =====================================================
DROP POLICY IF EXISTS "Users can view approved transformations" ON public.transformation_submissions;

CREATE POLICY "Users can view their own or approved transformations" 
ON public.transformation_submissions FOR SELECT
USING (
  (auth.uid() = user_id) OR 
  (is_approved = true AND is_featured = true)
);

-- 4. Harden failed_login_attempts - mask email addresses
-- Create a view that masks sensitive data
-- =====================================================
CREATE OR REPLACE VIEW public.failed_login_attempts_masked
WITH (security_invoker = on) AS
SELECT 
  id,
  -- Mask email: show first 2 chars and domain
  CASE 
    WHEN email LIKE '%@%' THEN
      LEFT(SPLIT_PART(email, '@', 1), 2) || '***@' || SPLIT_PART(email, '@', 2)
    ELSE '***'
  END as email_masked,
  -- Mask IP: show only first two octets
  CASE 
    WHEN ip_address IS NOT NULL THEN
      SPLIT_PART(ip_address, '.', 1) || '.' || SPLIT_PART(ip_address, '.', 2) || '.***'
    ELSE NULL
  END as ip_masked,
  attempted_at,
  created_at
FROM public.failed_login_attempts;

-- Only admins/owners can view the masked view
GRANT SELECT ON public.failed_login_attempts_masked TO authenticated;

-- 5. Strengthen audit log access - ensure sensitive values are never exposed
-- =====================================================
CREATE OR REPLACE VIEW public.audit_logs_safe
WITH (security_invoker = on) AS
SELECT 
  id,
  action_type,
  table_name,
  record_id,
  actor_id,
  target_user_id,
  created_at,
  -- Exclude old_values and new_values which may contain sensitive data
  -- Only show metadata if it doesn't contain sensitive keys
  CASE 
    WHEN metadata ? 'password' OR metadata ? 'token' OR metadata ? 'secret' THEN
      jsonb_build_object('event', 'sensitive data redacted')
    ELSE metadata
  END as metadata
FROM public.audit_logs;

-- Grant access to safe view for admins
GRANT SELECT ON public.audit_logs_safe TO authenticated;

-- 6. Tighten testimonials access during approval workflow
-- =====================================================
DROP POLICY IF EXISTS "Admins can view all testimonials" ON public.user_testimonials;

CREATE POLICY "Admins can view non-deleted testimonials" 
ON public.user_testimonials FOR SELECT
USING (
  (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role))
  AND deleted_at IS NULL
);

-- 7. Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.is_maintenance_mode() TO anon;
GRANT EXECUTE ON FUNCTION public.is_maintenance_mode() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_branding() TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_branding() TO authenticated;