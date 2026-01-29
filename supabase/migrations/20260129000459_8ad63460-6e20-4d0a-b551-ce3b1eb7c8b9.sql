-- Add new habit tracking columns to lifestyle_entries
ALTER TABLE public.lifestyle_entries
ADD COLUMN IF NOT EXISTS sunscreen_applied boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS nutrition_quality integer CHECK (nutrition_quality >= 1 AND nutrition_quality <= 5),
ADD COLUMN IF NOT EXISTS skincare_routine_completed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS supplements_taken boolean DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN public.lifestyle_entries.sunscreen_applied IS 'Whether sunscreen was applied today';
COMMENT ON COLUMN public.lifestyle_entries.nutrition_quality IS 'Nutrition quality rating 1-5';
COMMENT ON COLUMN public.lifestyle_entries.skincare_routine_completed IS 'Whether skincare routine was completed';
COMMENT ON COLUMN public.lifestyle_entries.supplements_taken IS 'Whether supplements were taken today';