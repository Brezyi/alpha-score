-- Create a function to increment promo code usage that can be called by any authenticated user
-- Uses SECURITY DEFINER to bypass RLS
CREATE OR REPLACE FUNCTION public.increment_promo_code_usage(promo_code_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE promo_codes 
  SET current_uses = current_uses + 1 
  WHERE id = promo_code_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.increment_promo_code_usage(uuid) TO authenticated;