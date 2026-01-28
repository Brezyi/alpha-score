-- Drop the problematic view that exposes auth.users
DROP VIEW IF EXISTS public.unconfirmed_users_stats;

-- Instead, create a secure function that only owners can call
CREATE OR REPLACE FUNCTION public.get_unconfirmed_users_stats()
RETURNS TABLE(expired_unconfirmed bigint, pending_confirmation bigint, confirmed bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Security: Only owners can view these stats
  IF NOT public.has_role(auth.uid(), 'owner') THEN
    RAISE EXCEPTION 'Unauthorized: Only owners can view user stats';
  END IF;
  
  RETURN QUERY
  SELECT 
    COUNT(*) FILTER (WHERE email_confirmed_at IS NULL AND created_at < now() - INTERVAL '7 days') as expired_unconfirmed,
    COUNT(*) FILTER (WHERE email_confirmed_at IS NULL AND created_at >= now() - INTERVAL '7 days') as pending_confirmation,
    COUNT(*) FILTER (WHERE email_confirmed_at IS NOT NULL) as confirmed
  FROM auth.users;
END;
$$;

-- Update cleanup function to return user IDs for edge function processing
CREATE OR REPLACE FUNCTION public.get_expired_unconfirmed_user_ids()
RETURNS TABLE(user_id uuid, email text, created_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- This function is only called by edge function with service role
  -- No auth check needed as service role bypasses RLS
  
  RETURN QUERY
  SELECT 
    u.id as user_id,
    u.email::text,
    u.created_at
  FROM auth.users u
  WHERE u.email_confirmed_at IS NULL
    AND u.created_at < now() - INTERVAL '7 days';
END;
$$;