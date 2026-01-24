-- Allow users to update their own sensitive data
CREATE POLICY "Users can update their own sensitive data"
ON public.user_sensitive_data
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create function to update sensitive data
CREATE OR REPLACE FUNCTION public.update_user_sensitive_data(
  p_first_name text,
  p_last_name text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_encrypted_first text;
  v_encrypted_last text;
  v_data_hash text;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Check if user has existing data
  IF NOT EXISTS (SELECT 1 FROM user_sensitive_data WHERE user_id = v_user_id) THEN
    RAISE EXCEPTION 'No existing data to update';
  END IF;
  
  -- Encrypt the data
  v_encrypted_first := encrypt_sensitive_text(p_first_name);
  v_encrypted_last := encrypt_sensitive_text(p_last_name);
  v_data_hash := encode(sha256((p_first_name || p_last_name)::bytea), 'hex');
  
  -- Update the record
  UPDATE user_sensitive_data
  SET 
    first_name_encrypted = v_encrypted_first,
    last_name_encrypted = v_encrypted_last,
    data_hash = v_data_hash,
    updated_at = now()
  WHERE user_id = v_user_id;
  
  RETURN true;
END;
$$;