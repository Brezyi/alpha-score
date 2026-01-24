-- Add unique constraint to display_name (case-insensitive)
CREATE UNIQUE INDEX idx_profiles_display_name_unique ON public.profiles (lower(display_name)) WHERE display_name IS NOT NULL;

-- Function to check if display_name is available
CREATE OR REPLACE FUNCTION public.check_display_name_available(p_display_name text, p_current_user_id uuid DEFAULT NULL)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE lower(display_name) = lower(p_display_name)
    AND (p_current_user_id IS NULL OR user_id != p_current_user_id)
  );
$$;