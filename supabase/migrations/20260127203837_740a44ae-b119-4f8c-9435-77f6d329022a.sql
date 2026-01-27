-- Create a secure function to validate a single promo code
-- This prevents enumeration attacks by not exposing the entire promo_codes table

CREATE OR REPLACE FUNCTION public.validate_promo_code(p_code TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_promo_record RECORD;
  v_user_id UUID;
  v_already_redeemed BOOLEAN;
BEGIN
  -- Get the current user
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN json_build_object(
      'valid', false,
      'error', 'NOT_AUTHENTICATED',
      'message', 'Du musst angemeldet sein, um einen Code einzulösen.'
    );
  END IF;

  -- Find the promo code (case-insensitive)
  SELECT * INTO v_promo_record
  FROM public.promo_codes
  WHERE UPPER(code) = UPPER(p_code)
    AND is_active = true;

  -- Code not found or inactive
  IF v_promo_record IS NULL THEN
    RETURN json_build_object(
      'valid', false,
      'error', 'CODE_NOT_FOUND',
      'message', 'Dieser Code ist ungültig oder nicht mehr aktiv.'
    );
  END IF;

  -- Check if expired
  IF v_promo_record.expires_at IS NOT NULL AND v_promo_record.expires_at < NOW() THEN
    RETURN json_build_object(
      'valid', false,
      'error', 'CODE_EXPIRED',
      'message', 'Dieser Code ist abgelaufen.'
    );
  END IF;

  -- Check max uses
  IF v_promo_record.max_uses IS NOT NULL AND v_promo_record.current_uses >= v_promo_record.max_uses THEN
    RETURN json_build_object(
      'valid', false,
      'error', 'CODE_MAX_USES',
      'message', 'Dieser Code wurde bereits zu oft eingelöst.'
    );
  END IF;

  -- Check if user already redeemed this code
  SELECT EXISTS(
    SELECT 1 FROM public.promo_code_redemptions
    WHERE promo_code_id = v_promo_record.id
      AND user_id = v_user_id
  ) INTO v_already_redeemed;

  IF v_already_redeemed THEN
    RETURN json_build_object(
      'valid', false,
      'error', 'ALREADY_REDEEMED',
      'message', 'Du hast diesen Code bereits eingelöst.'
    );
  END IF;

  -- Code is valid - return details (without exposing sensitive info)
  RETURN json_build_object(
    'valid', true,
    'promo_code_id', v_promo_record.id,
    'plan_type', v_promo_record.plan_type,
    'duration_days', v_promo_record.duration_days
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.validate_promo_code(TEXT) TO authenticated;

-- Now restrict direct access to promo_codes table
-- Drop existing permissive policies if any
DROP POLICY IF EXISTS "Allow users to view promo codes" ON public.promo_codes;
DROP POLICY IF EXISTS "Users can view active promo codes" ON public.promo_codes;
DROP POLICY IF EXISTS "Anyone can view active promo codes" ON public.promo_codes;

-- Only allow admins/owners to view the full table
CREATE POLICY "Only admins can view promo codes"
ON public.promo_codes
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'owner')
);

-- Only admins/owners can insert
DROP POLICY IF EXISTS "Admins can create promo codes" ON public.promo_codes;
CREATE POLICY "Admins and owners can create promo codes"
ON public.promo_codes
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'owner')
);

-- Only admins/owners can update
DROP POLICY IF EXISTS "Admins can update promo codes" ON public.promo_codes;
CREATE POLICY "Admins and owners can update promo codes"
ON public.promo_codes
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'owner')
);

-- Only admins/owners can delete
DROP POLICY IF EXISTS "Admins can delete promo codes" ON public.promo_codes;
CREATE POLICY "Admins and owners can delete promo codes"
ON public.promo_codes
FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'owner')
);