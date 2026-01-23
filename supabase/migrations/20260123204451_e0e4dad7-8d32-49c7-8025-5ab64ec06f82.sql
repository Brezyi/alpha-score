-- Create promo_codes table
CREATE TABLE public.promo_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('premium', 'lifetime')),
  duration_days INTEGER, -- NULL for lifetime, number of days for premium
  max_uses INTEGER DEFAULT 1, -- How many times the code can be used
  current_uses INTEGER DEFAULT 0, -- Current usage count
  expires_at TIMESTAMP WITH TIME ZONE, -- Optional expiration date
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN DEFAULT true
);

-- Create promo_code_redemptions table to track who redeemed what
CREATE TABLE public.promo_code_redemptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  promo_code_id UUID REFERENCES public.promo_codes(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  redeemed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (promo_code_id, user_id) -- Each user can only redeem a code once
);

-- Enable RLS
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_code_redemptions ENABLE ROW LEVEL SECURITY;

-- Policies for promo_codes
CREATE POLICY "Anyone can view active promo codes by code"
ON public.promo_codes
FOR SELECT
TO authenticated
USING (is_active = true);

CREATE POLICY "Owners can manage promo codes"
ON public.promo_codes
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'owner'::app_role))
WITH CHECK (has_role(auth.uid(), 'owner'::app_role));

-- Policies for redemptions
CREATE POLICY "Users can view their own redemptions"
ON public.promo_code_redemptions
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can create their own redemptions"
ON public.promo_code_redemptions
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Index for faster code lookups
CREATE INDEX idx_promo_codes_code ON public.promo_codes(code);
CREATE INDEX idx_promo_codes_active ON public.promo_codes(is_active) WHERE is_active = true;