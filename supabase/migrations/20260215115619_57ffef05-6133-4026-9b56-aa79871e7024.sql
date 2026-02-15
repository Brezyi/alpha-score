
-- Add completed_tours column to profiles for cross-device persistence
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS completed_tours text[] DEFAULT '{}';
