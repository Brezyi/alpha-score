-- Add potential_score and potential_image_url columns to analyses table
ALTER TABLE public.analyses
ADD COLUMN potential_score numeric,
ADD COLUMN potential_image_url text;