
-- Create table to track failed login attempts
CREATE TABLE IF NOT EXISTS public.failed_login_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  ip_address TEXT,
  attempted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for efficient lookups
CREATE INDEX idx_failed_login_email_time ON public.failed_login_attempts (email, attempted_at DESC);

-- Enable RLS (only service role can access this table)
ALTER TABLE public.failed_login_attempts ENABLE ROW LEVEL SECURITY;

-- No RLS policies = only service role can access (for security)

-- Function to check if account is locked
CREATE OR REPLACE FUNCTION public.check_account_lockout(_email TEXT)
RETURNS TABLE (
  is_locked BOOLEAN,
  remaining_seconds INTEGER,
  failed_attempts INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lockout_duration INTERVAL := '5 minutes';
  v_max_attempts INTEGER := 5;
  v_attempt_count INTEGER;
  v_oldest_attempt TIMESTAMP WITH TIME ZONE;
  v_unlock_time TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Count failed attempts in the last 5 minutes
  SELECT COUNT(*), MIN(attempted_at)
  INTO v_attempt_count, v_oldest_attempt
  FROM public.failed_login_attempts
  WHERE email = LOWER(_email)
    AND attempted_at > now() - v_lockout_duration;

  -- If 5 or more attempts, account is locked
  IF v_attempt_count >= v_max_attempts THEN
    v_unlock_time := v_oldest_attempt + v_lockout_duration;
    RETURN QUERY SELECT 
      TRUE,
      GREATEST(0, EXTRACT(EPOCH FROM (v_unlock_time - now()))::INTEGER),
      v_attempt_count;
  ELSE
    RETURN QUERY SELECT FALSE, 0, v_attempt_count;
  END IF;
END;
$$;

-- Function to record a failed login attempt
CREATE OR REPLACE FUNCTION public.record_failed_login(_email TEXT, _ip_address TEXT DEFAULT NULL)
RETURNS TABLE (
  is_locked BOOLEAN,
  remaining_seconds INTEGER,
  failed_attempts INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert the failed attempt
  INSERT INTO public.failed_login_attempts (email, ip_address)
  VALUES (LOWER(_email), _ip_address);

  -- Log security event
  INSERT INTO public.audit_logs (action_type, table_name, metadata)
  VALUES (
    'FAILED_LOGIN',
    'auth_events',
    jsonb_build_object(
      'email', _email,
      'ip_address', _ip_address,
      'event', 'Fehlgeschlagener Anmeldeversuch'
    )
  );

  -- Return current lockout status
  RETURN QUERY SELECT * FROM public.check_account_lockout(_email);
END;
$$;

-- Function to clear failed attempts after successful login
CREATE OR REPLACE FUNCTION public.clear_failed_logins(_email TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.failed_login_attempts
  WHERE email = LOWER(_email);
END;
$$;

-- Cleanup old records (older than 1 hour) - can be called periodically
CREATE OR REPLACE FUNCTION public.cleanup_old_login_attempts()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  DELETE FROM public.failed_login_attempts
  WHERE attempted_at < now() - INTERVAL '1 hour';
  
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;

-- Add comment for documentation
COMMENT ON TABLE public.failed_login_attempts IS 'Tracks failed login attempts for account lockout after 5 failed attempts (5 minute lockout)';
