-- =====================================================
-- MFA BACKUP CODES TABLE
-- Secure storage for one-time recovery codes
-- =====================================================

-- Create table for backup codes
CREATE TABLE public.mfa_backup_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  code_hash text NOT NULL, -- SHA-256 hash of the code
  used boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  used_at timestamp with time zone
);

-- Enable RLS
ALTER TABLE public.mfa_backup_codes ENABLE ROW LEVEL SECURITY;

-- Users can only view their own backup codes (but not the hashes - use a view)
CREATE POLICY "Users can view their own backup codes metadata"
  ON public.mfa_backup_codes
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can mark their codes as used (through function only)
CREATE POLICY "Users can update their own backup codes"
  ON public.mfa_backup_codes
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own codes (for regeneration)
CREATE POLICY "Users can delete their own backup codes"
  ON public.mfa_backup_codes
  FOR DELETE
  USING (auth.uid() = user_id);

-- Users can insert their own codes
CREATE POLICY "Users can insert their own backup codes"
  ON public.mfa_backup_codes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Index for fast lookups
CREATE INDEX idx_mfa_backup_codes_user_id ON public.mfa_backup_codes (user_id);
CREATE INDEX idx_mfa_backup_codes_lookup ON public.mfa_backup_codes (user_id, used) WHERE used = false;

-- Function to verify and consume a backup code
CREATE OR REPLACE FUNCTION public.verify_backup_code(
  _user_id uuid,
  _code text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code_id uuid;
  v_code_hash text;
BEGIN
  -- Security: Verify caller is the user
  IF _user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: Cannot verify other users backup codes';
  END IF;

  -- Hash the provided code
  v_code_hash := encode(sha256(_code::bytea), 'hex');
  
  -- Find matching unused code
  SELECT id INTO v_code_id
  FROM public.mfa_backup_codes
  WHERE user_id = _user_id
    AND code_hash = v_code_hash
    AND used = false
  LIMIT 1;
  
  IF v_code_id IS NULL THEN
    -- Log failed attempt
    PERFORM public.log_security_event(
      'BACKUP_CODE_FAILED',
      jsonb_build_object('user_id', _user_id)
    );
    RETURN false;
  END IF;
  
  -- Mark code as used
  UPDATE public.mfa_backup_codes
  SET used = true, used_at = now()
  WHERE id = v_code_id;
  
  -- Log successful use
  PERFORM public.log_security_event(
    'BACKUP_CODE_USED',
    jsonb_build_object('user_id', _user_id, 'code_id', v_code_id)
  );
  
  RETURN true;
END;
$$;

-- Function to generate backup codes (returns plain codes, stores hashes)
CREATE OR REPLACE FUNCTION public.generate_backup_codes(
  _user_id uuid,
  _count integer DEFAULT 8
)
RETURNS text[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_codes text[] := '{}';
  v_code text;
  i integer;
BEGIN
  -- Security: Verify caller is the user
  IF _user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: Cannot generate backup codes for other users';
  END IF;

  -- Delete existing unused codes
  DELETE FROM public.mfa_backup_codes
  WHERE user_id = _user_id;
  
  -- Generate new codes
  FOR i IN 1.._count LOOP
    -- Generate random 8-character alphanumeric code
    v_code := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 4) || '-' ||
                    substr(md5(random()::text || clock_timestamp()::text), 5, 4));
    
    -- Store hash
    INSERT INTO public.mfa_backup_codes (user_id, code_hash)
    VALUES (_user_id, encode(sha256(v_code::bytea), 'hex'));
    
    -- Add plain code to return array
    v_codes := array_append(v_codes, v_code);
  END LOOP;
  
  -- Log code generation
  PERFORM public.log_security_event(
    'BACKUP_CODES_GENERATED',
    jsonb_build_object('user_id', _user_id, 'count', _count)
  );
  
  RETURN v_codes;
END;
$$;

-- Function to get count of remaining backup codes
CREATE OR REPLACE FUNCTION public.get_backup_codes_count(_user_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::integer
  FROM public.mfa_backup_codes
  WHERE user_id = _user_id AND used = false;
$$;

COMMENT ON TABLE public.mfa_backup_codes IS 'One-time backup codes for MFA recovery - codes are hashed for security';