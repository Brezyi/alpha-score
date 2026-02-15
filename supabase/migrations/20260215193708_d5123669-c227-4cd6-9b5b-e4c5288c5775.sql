
-- Add bank details columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS payout_iban text,
ADD COLUMN IF NOT EXISTS payout_bic text,
ADD COLUMN IF NOT EXISTS payout_account_holder text;

-- Create payout requests table
CREATE TABLE public.payout_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'EUR',
  payout_method text NOT NULL,
  payout_email text,
  payout_iban text,
  payout_bic text,
  payout_account_holder text,
  status text NOT NULL DEFAULT 'pending',
  admin_notes text,
  processed_by uuid,
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.payout_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own payout requests
CREATE POLICY "Users can view own payout requests"
ON public.payout_requests FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own payout requests
CREATE POLICY "Users can create own payout requests"
ON public.payout_requests FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admins/owners can view all payout requests
CREATE POLICY "Admins can view all payout requests"
ON public.payout_requests FOR SELECT
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

-- Admins/owners can update payout requests
CREATE POLICY "Admins can update payout requests"
ON public.payout_requests FOR UPDATE
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

-- RPC to get affiliate overview for admins
CREATE OR REPLACE FUNCTION public.get_affiliate_overview()
RETURNS TABLE(
  user_id uuid,
  display_name text,
  email text,
  referral_code text,
  referral_count bigint,
  conversion_count bigint,
  total_earnings numeric,
  pending_earnings numeric,
  paid_earnings numeric,
  payout_method text,
  pending_payout_requests bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only admins/owners can call this
  IF NOT (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner')) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
  SELECT 
    urc.user_id,
    COALESCE(p.display_name, split_part(u.email, '@', 1))::text as display_name,
    u.email::text,
    urc.code::text as referral_code,
    (SELECT COUNT(*) FROM referrals r WHERE r.referrer_id = urc.user_id) as referral_count,
    (SELECT COUNT(*) FROM affiliate_earnings ae WHERE ae.referrer_id = urc.user_id) as conversion_count,
    COALESCE((SELECT SUM(ae.commission_amount) FROM affiliate_earnings ae WHERE ae.referrer_id = urc.user_id), 0) as total_earnings,
    COALESCE((SELECT SUM(ae.commission_amount) FROM affiliate_earnings ae WHERE ae.referrer_id = urc.user_id AND ae.status = 'pending'), 0) as pending_earnings,
    COALESCE((SELECT SUM(ae.commission_amount) FROM affiliate_earnings ae WHERE ae.referrer_id = urc.user_id AND ae.status = 'paid'), 0) as paid_earnings,
    p.payout_method::text,
    (SELECT COUNT(*) FROM payout_requests pr WHERE pr.user_id = urc.user_id AND pr.status = 'pending') as pending_payout_requests
  FROM user_referral_codes urc
  JOIN auth.users u ON u.id = urc.user_id
  LEFT JOIN profiles p ON p.user_id = urc.user_id
  ORDER BY total_earnings DESC;
END;
$$;
