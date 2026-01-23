-- Add deleted_at column for soft deletes
ALTER TABLE public.user_testimonials 
ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Add index for faster queries on deleted items
CREATE INDEX idx_user_testimonials_deleted_at ON public.user_testimonials(deleted_at);

-- Update RLS policy to exclude deleted testimonials from public view
DROP POLICY IF EXISTS "Anyone can view approved testimonials" ON public.user_testimonials;

CREATE POLICY "Anyone can view approved testimonials" 
ON public.user_testimonials 
FOR SELECT 
USING (is_approved = true AND deleted_at IS NULL);

-- Admins can still see all including deleted
DROP POLICY IF EXISTS "Admins can view all testimonials" ON public.user_testimonials;

CREATE POLICY "Admins can view all testimonials" 
ON public.user_testimonials 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role));