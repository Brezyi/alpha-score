-- Add 'validation_failed' to the allowed status values
ALTER TABLE public.analyses DROP CONSTRAINT IF EXISTS analyses_status_check;

ALTER TABLE public.analyses ADD CONSTRAINT analyses_status_check 
CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'validation_failed'));