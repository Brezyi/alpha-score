-- Function for owner to reset another user's admin password
CREATE OR REPLACE FUNCTION public.reset_admin_password_for_user(_target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_id UUID := auth.uid();
  v_is_owner BOOLEAN;
BEGIN
  -- Security: Verify actor is authenticated
  IF v_actor_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Must be authenticated';
  END IF;

  -- Security: Verify actor is an owner
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = v_actor_id AND role = 'owner'
  ) INTO v_is_owner;

  IF NOT v_is_owner THEN
    RAISE EXCEPTION 'Unauthorized: Only owners can reset admin passwords';
  END IF;

  -- Delete the admin password record (user will need to set up new one)
  DELETE FROM public.admin_passwords WHERE user_id = _target_user_id;

  -- Log the event
  PERFORM public.log_security_event(
    'ADMIN_PASSWORD_RESET_BY_OWNER',
    jsonb_build_object(
      'actor_id', v_actor_id,
      'target_user_id', _target_user_id
    )
  );

  RETURN TRUE;
END;
$$;

-- Table for admin password reset tokens (for owner self-reset via email)
CREATE TABLE IF NOT EXISTS public.admin_password_reset_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '1 hour'),
  used BOOLEAN NOT NULL DEFAULT false
);

-- Enable RLS
ALTER TABLE public.admin_password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- No direct access - only through functions
DROP POLICY IF EXISTS "No direct access to reset tokens" ON public.admin_password_reset_tokens;
CREATE POLICY "No direct access to reset tokens"
  ON public.admin_password_reset_tokens FOR SELECT
  USING (false);

-- Function to request admin password reset (owner only, for self)
CREATE OR REPLACE FUNCTION public.request_admin_password_reset()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_is_owner BOOLEAN;
  v_token TEXT;
  v_token_hash TEXT;
BEGIN
  -- Security: Verify user is authenticated
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Must be authenticated';
  END IF;

  -- Security: Only owners can self-reset via email
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = v_user_id AND role = 'owner'
  ) INTO v_is_owner;

  IF NOT v_is_owner THEN
    RAISE EXCEPTION 'Unauthorized: Only owners can request email reset';
  END IF;

  -- Generate secure token
  v_token := encode(gen_random_bytes(32), 'hex');
  v_token_hash := encode(sha256(v_token::bytea), 'hex');

  -- Delete any existing tokens for this user
  DELETE FROM public.admin_password_reset_tokens WHERE user_id = v_user_id;

  -- Insert new token
  INSERT INTO public.admin_password_reset_tokens (user_id, token_hash, expires_at)
  VALUES (v_user_id, v_token_hash, now() + INTERVAL '1 hour');

  -- Log the event
  PERFORM public.log_security_event(
    'ADMIN_PASSWORD_RESET_REQUESTED',
    jsonb_build_object('user_id', v_user_id)
  );

  -- Return the token (will be sent via email by edge function)
  RETURN v_token;
END;
$$;

-- Function to verify admin password reset token and clear password
CREATE OR REPLACE FUNCTION public.verify_admin_password_reset_token(_token TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_token_hash TEXT;
  v_token_record public.admin_password_reset_tokens%ROWTYPE;
BEGIN
  -- Security: Verify user is authenticated
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Must be authenticated';
  END IF;

  -- Hash the provided token
  v_token_hash := encode(sha256(_token::bytea), 'hex');

  -- Find matching token
  SELECT * INTO v_token_record
  FROM public.admin_password_reset_tokens
  WHERE user_id = v_user_id
    AND token_hash = v_token_hash
    AND used = false
    AND expires_at > now();

  IF v_token_record IS NULL THEN
    -- Log failed attempt
    PERFORM public.log_security_event(
      'ADMIN_PASSWORD_RESET_TOKEN_INVALID',
      jsonb_build_object('user_id', v_user_id)
    );
    RETURN FALSE;
  END IF;

  -- Mark token as used
  UPDATE public.admin_password_reset_tokens
  SET used = true
  WHERE id = v_token_record.id;

  -- Delete the admin password (user will set up new one)
  DELETE FROM public.admin_passwords WHERE user_id = v_user_id;

  -- Log success
  PERFORM public.log_security_event(
    'ADMIN_PASSWORD_RESET_VIA_EMAIL',
    jsonb_build_object('user_id', v_user_id)
  );

  RETURN TRUE;
END;
$$;

-- Function to get list of admins/owners with their admin password status (owner only)
CREATE OR REPLACE FUNCTION public.get_admin_users_password_status()
RETURNS TABLE(
  user_id UUID,
  email TEXT,
  display_name TEXT,
  role TEXT,
  has_admin_password BOOLEAN,
  password_expired BOOLEAN,
  days_until_expiry INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_id UUID := auth.uid();
  v_is_owner BOOLEAN;
BEGIN
  -- Security: Verify actor is owner
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = v_actor_id AND role = 'owner'
  ) INTO v_is_owner;

  IF NOT v_is_owner THEN
    RAISE EXCEPTION 'Unauthorized: Only owners can view admin password status';
  END IF;

  RETURN QUERY
  SELECT 
    ur.user_id,
    u.email,
    COALESCE(p.display_name, split_part(u.email, '@', 1)) as display_name,
    ur.role::TEXT,
    ap.id IS NOT NULL as has_admin_password,
    COALESCE(ap.expires_at < now(), false) as password_expired,
    COALESCE(GREATEST(0, EXTRACT(DAY FROM (ap.expires_at - now()))::INTEGER), 0) as days_until_expiry
  FROM public.user_roles ur
  JOIN auth.users u ON u.id = ur.user_id
  LEFT JOIN public.profiles p ON p.user_id = ur.user_id
  LEFT JOIN public.admin_passwords ap ON ap.user_id = ur.user_id
  WHERE ur.role IN ('admin', 'owner')
  ORDER BY 
    CASE ur.role WHEN 'owner' THEN 1 WHEN 'admin' THEN 2 END,
    u.email;
END;
$$;

-- Function to get masked email for password reset display
CREATE OR REPLACE FUNCTION public.get_owner_masked_email()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_email TEXT;
  v_local_part TEXT;
  v_domain TEXT;
  v_masked TEXT;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT email INTO v_email FROM auth.users WHERE id = v_user_id;
  
  IF v_email IS NULL THEN
    RETURN NULL;
  END IF;

  -- Split email into local and domain parts
  v_local_part := split_part(v_email, '@', 1);
  v_domain := split_part(v_email, '@', 2);
  
  -- Mask the local part: show first 2 chars, then ***, then last char
  IF length(v_local_part) <= 3 THEN
    v_masked := substr(v_local_part, 1, 1) || '***';
  ELSE
    v_masked := substr(v_local_part, 1, 2) || '***' || substr(v_local_part, length(v_local_part), 1);
  END IF;

  RETURN v_masked || '@' || v_domain;
END;
$$;