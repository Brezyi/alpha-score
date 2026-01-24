-- Create table for admin passwords
CREATE TABLE public.admin_passwords (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '3 months')
);

-- Enable RLS
ALTER TABLE public.admin_passwords ENABLE ROW LEVEL SECURITY;

-- Only the user can read their own admin password record (to check if exists/expired)
CREATE POLICY "Users can check their own admin password status"
  ON public.admin_passwords FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own admin password
CREATE POLICY "Users can create their own admin password"
  ON public.admin_passwords FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own admin password
CREATE POLICY "Users can update their own admin password"
  ON public.admin_passwords FOR UPDATE
  USING (auth.uid() = user_id);

-- Function to set/update admin password (hashed with SHA-256)
CREATE OR REPLACE FUNCTION public.set_admin_password(_password TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_password_hash TEXT;
  v_has_admin_role BOOLEAN;
BEGIN
  -- Security: Verify user is authenticated
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Must be authenticated';
  END IF;

  -- Security: Verify user has admin or owner role
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = v_user_id AND role IN ('admin', 'owner')
  ) INTO v_has_admin_role;

  IF NOT v_has_admin_role THEN
    RAISE EXCEPTION 'Unauthorized: Requires admin or owner role';
  END IF;

  -- Hash the password
  v_password_hash := encode(sha256(_password::bytea), 'hex');

  -- Upsert the admin password
  INSERT INTO public.admin_passwords (user_id, password_hash, last_changed_at, expires_at)
  VALUES (v_user_id, v_password_hash, now(), now() + INTERVAL '3 months')
  ON CONFLICT (user_id) DO UPDATE
  SET 
    password_hash = v_password_hash,
    last_changed_at = now(),
    expires_at = now() + INTERVAL '3 months';

  -- Log the event
  PERFORM public.log_security_event(
    'ADMIN_PASSWORD_SET',
    jsonb_build_object('user_id', v_user_id)
  );

  RETURN TRUE;
END;
$$;

-- Function to verify admin password
CREATE OR REPLACE FUNCTION public.verify_admin_password(_password TEXT)
RETURNS TABLE(is_valid BOOLEAN, is_expired BOOLEAN, needs_setup BOOLEAN, days_until_expiry INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_record public.admin_passwords%ROWTYPE;
  v_password_hash TEXT;
  v_has_admin_role BOOLEAN;
BEGIN
  -- Security: Verify user is authenticated
  IF v_user_id IS NULL THEN
    RETURN QUERY SELECT FALSE, FALSE, TRUE, 0;
    RETURN;
  END IF;

  -- Security: Verify user has admin or owner role
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = v_user_id AND role IN ('admin', 'owner')
  ) INTO v_has_admin_role;

  IF NOT v_has_admin_role THEN
    RETURN QUERY SELECT FALSE, FALSE, FALSE, 0;
    RETURN;
  END IF;

  -- Get the admin password record
  SELECT * INTO v_record
  FROM public.admin_passwords
  WHERE user_id = v_user_id;

  -- Check if password is set up
  IF v_record IS NULL THEN
    RETURN QUERY SELECT FALSE, FALSE, TRUE, 0;
    RETURN;
  END IF;

  -- Check if expired
  IF v_record.expires_at < now() THEN
    RETURN QUERY SELECT FALSE, TRUE, FALSE, 0;
    RETURN;
  END IF;

  -- Hash and compare
  v_password_hash := encode(sha256(_password::bytea), 'hex');

  IF v_record.password_hash = v_password_hash THEN
    -- Log successful verification
    PERFORM public.log_security_event(
      'ADMIN_PASSWORD_VERIFIED',
      jsonb_build_object('user_id', v_user_id)
    );
    
    RETURN QUERY SELECT 
      TRUE, 
      FALSE, 
      FALSE, 
      EXTRACT(DAY FROM (v_record.expires_at - now()))::INTEGER;
  ELSE
    -- Log failed attempt
    PERFORM public.log_security_event(
      'ADMIN_PASSWORD_FAILED',
      jsonb_build_object('user_id', v_user_id)
    );
    
    RETURN QUERY SELECT FALSE, FALSE, FALSE, 0;
  END IF;
END;
$$;

-- Function to check admin password status (without verifying)
CREATE OR REPLACE FUNCTION public.get_admin_password_status()
RETURNS TABLE(has_password BOOLEAN, is_expired BOOLEAN, days_until_expiry INTEGER, last_changed_at TIMESTAMP WITH TIME ZONE)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_record public.admin_passwords%ROWTYPE;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN QUERY SELECT FALSE, FALSE, 0, NULL::TIMESTAMP WITH TIME ZONE;
    RETURN;
  END IF;

  SELECT * INTO v_record
  FROM public.admin_passwords
  WHERE user_id = v_user_id;

  IF v_record IS NULL THEN
    RETURN QUERY SELECT FALSE, FALSE, 0, NULL::TIMESTAMP WITH TIME ZONE;
    RETURN;
  END IF;

  RETURN QUERY SELECT 
    TRUE,
    v_record.expires_at < now(),
    GREATEST(0, EXTRACT(DAY FROM (v_record.expires_at - now()))::INTEGER),
    v_record.last_changed_at;
END;
$$;