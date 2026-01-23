-- Add star rating column to user_testimonials
ALTER TABLE public.user_testimonials
ADD COLUMN star_rating INTEGER CHECK (star_rating >= 1 AND star_rating <= 5);