-- Add gender and country fields to profiles table for personalized coaching
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male', 'female')),
ADD COLUMN IF NOT EXISTS country TEXT;

-- Create index for potential filtering
CREATE INDEX IF NOT EXISTS idx_profiles_gender ON public.profiles(gender);
CREATE INDEX IF NOT EXISTS idx_profiles_country ON public.profiles(country);