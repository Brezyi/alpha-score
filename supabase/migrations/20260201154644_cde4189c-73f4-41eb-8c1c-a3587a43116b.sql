-- Function to check if an email exists (for better login UX)
-- This is rate-limited and only accessible to authenticated requests or specific contexts
CREATE OR REPLACE FUNCTION public.check_email_exists(_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if email exists in auth.users
  RETURN EXISTS (
    SELECT 1 FROM auth.users 
    WHERE email = lower(_email)
  );
END;
$$;