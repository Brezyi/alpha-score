-- Create table for user referral codes
CREATE TABLE public.user_referral_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  code VARCHAR(8) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for tracking referrals
CREATE TABLE public.referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL,
  referred_id UUID NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT fk_referrer FOREIGN KEY (referrer_id) REFERENCES user_referral_codes(user_id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public.user_referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_referral_codes
CREATE POLICY "Users can view their own referral code"
ON public.user_referral_codes
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own referral code"
ON public.user_referral_codes
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- RLS policies for referrals
CREATE POLICY "Users can view referrals they made"
ON public.referrals
FOR SELECT
USING (auth.uid() = referrer_id);

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS VARCHAR(8) AS $$
DECLARE
  new_code VARCHAR(8);
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate random 8 character alphanumeric code
    new_code := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8));
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM public.user_referral_codes WHERE code = new_code) INTO code_exists;
    
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- Function to get or create referral code for a user
CREATE OR REPLACE FUNCTION public.get_or_create_referral_code(p_user_id UUID)
RETURNS VARCHAR(8)
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing_code VARCHAR(8);
  new_code VARCHAR(8);
BEGIN
  -- Check if user already has a code
  SELECT code INTO existing_code FROM user_referral_codes WHERE user_id = p_user_id;
  
  IF existing_code IS NOT NULL THEN
    RETURN existing_code;
  END IF;
  
  -- Generate new code
  new_code := generate_referral_code();
  
  -- Insert new code
  INSERT INTO user_referral_codes (user_id, code) VALUES (p_user_id, new_code);
  
  RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- Function to validate and record referral (called during signup)
CREATE OR REPLACE FUNCTION public.record_referral(p_referral_code VARCHAR(8), p_new_user_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  referrer_user_id UUID;
BEGIN
  -- Find the referrer by code
  SELECT user_id INTO referrer_user_id 
  FROM user_referral_codes 
  WHERE code = upper(p_referral_code);
  
  IF referrer_user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Don't allow self-referral
  IF referrer_user_id = p_new_user_id THEN
    RETURN FALSE;
  END IF;
  
  -- Check if this user was already referred
  IF EXISTS(SELECT 1 FROM referrals WHERE referred_id = p_new_user_id) THEN
    RETURN FALSE;
  END IF;
  
  -- Record the referral
  INSERT INTO referrals (referrer_id, referred_id) VALUES (referrer_user_id, p_new_user_id);
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to count successful referrals for a user
CREATE OR REPLACE FUNCTION public.count_referrals(p_user_id UUID)
RETURNS INTEGER
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  referral_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO referral_count
  FROM referrals
  WHERE referrer_id = p_user_id;
  
  RETURN referral_count;
END;
$$ LANGUAGE plpgsql;