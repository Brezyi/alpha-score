-- Update the function to use token_hash like the original
CREATE OR REPLACE FUNCTION public.request_admin_password_reset_for_user(_target_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _caller_id uuid;
  _caller_role text;
  _token text;
  _token_hash text;
BEGIN
  -- Get the calling user
  _caller_id := auth.uid();
  
  IF _caller_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Check if caller is owner
  SELECT role INTO _caller_role
  FROM user_roles
  WHERE user_id = _caller_id;
  
  IF _caller_role != 'owner' THEN
    RAISE EXCEPTION 'Only owners can request password reset for other users';
  END IF;
  
  -- Verify target user exists and is admin/owner
  IF NOT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = _target_user_id 
    AND role IN ('admin', 'owner')
  ) THEN
    RAISE EXCEPTION 'Target user is not an admin or owner';
  END IF;
  
  -- Generate a random token
  _token := encode(gen_random_bytes(32), 'hex');
  _token_hash := encode(sha256(_token::bytea), 'hex');
  
  -- Delete any existing reset tokens for the target user
  DELETE FROM admin_password_reset_tokens WHERE user_id = _target_user_id;
  
  -- Insert new token with hash (expires in 1 hour)
  INSERT INTO admin_password_reset_tokens (user_id, token_hash, expires_at)
  VALUES (_target_user_id, _token_hash, now() + interval '1 hour');
  
  -- Log the action
  INSERT INTO audit_logs (actor_id, action_type, table_name, metadata)
  VALUES (_caller_id, 'ADMIN_PASSWORD_RESET_FOR_USER', 'security_events', 
    jsonb_build_object('target_user_id', _target_user_id));
  
  RETURN _token;
END;
$$;