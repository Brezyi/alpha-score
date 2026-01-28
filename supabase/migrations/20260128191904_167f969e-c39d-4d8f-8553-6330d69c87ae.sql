-- Create a function to cleanup unconfirmed users older than 7 days
CREATE OR REPLACE FUNCTION public.cleanup_unconfirmed_users()
RETURNS TABLE(deleted_count integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted INTEGER := 0;
  v_user_ids UUID[];
BEGIN
  -- This function should be called from an edge function with service role
  -- Find users who haven't confirmed their email within 7 days
  
  -- Note: We can't directly delete from auth.users, but we can return the list
  -- The edge function with service role will handle the actual deletion
  
  SELECT ARRAY_AGG(id) INTO v_user_ids
  FROM auth.users
  WHERE email_confirmed_at IS NULL
    AND created_at < now() - INTERVAL '7 days';
  
  -- Return count of users to be deleted (actual deletion happens in edge function)
  v_deleted := COALESCE(array_length(v_user_ids, 1), 0);
  
  RETURN QUERY SELECT v_deleted;
END;
$$;

-- Create a view to check unconfirmed users (for monitoring)
CREATE OR REPLACE VIEW public.unconfirmed_users_stats AS
SELECT 
  COUNT(*) FILTER (WHERE email_confirmed_at IS NULL AND created_at < now() - INTERVAL '7 days') as expired_unconfirmed,
  COUNT(*) FILTER (WHERE email_confirmed_at IS NULL AND created_at >= now() - INTERVAL '7 days') as pending_confirmation,
  COUNT(*) FILTER (WHERE email_confirmed_at IS NOT NULL) as confirmed
FROM auth.users;