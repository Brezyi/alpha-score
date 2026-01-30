-- Create affiliate_earnings table to track commissions
CREATE TABLE public.affiliate_earnings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL,
  referred_id UUID NOT NULL,
  subscription_id UUID REFERENCES public.subscriptions(id),
  payment_amount NUMERIC NOT NULL,
  commission_rate NUMERIC NOT NULL DEFAULT 0.20,
  commission_amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  paid_at TIMESTAMP WITH TIME ZONE,
  payout_method TEXT,
  payout_reference TEXT
);

-- Enable RLS
ALTER TABLE public.affiliate_earnings ENABLE ROW LEVEL SECURITY;

-- Users can view their own earnings (as referrer)
CREATE POLICY "Users can view their own affiliate earnings"
ON public.affiliate_earnings
FOR SELECT
USING (auth.uid() = referrer_id);

-- Create index for faster lookups
CREATE INDEX idx_affiliate_earnings_referrer ON public.affiliate_earnings(referrer_id);
CREATE INDEX idx_affiliate_earnings_status ON public.affiliate_earnings(status);

-- Add payout_email to profiles for PayPal/Bank payout
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS payout_email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS payout_method TEXT DEFAULT 'paypal';