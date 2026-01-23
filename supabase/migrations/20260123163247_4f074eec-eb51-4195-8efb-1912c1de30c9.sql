-- Create user_testimonials table for storing real user reviews
CREATE TABLE public.user_testimonials (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    analysis_id UUID REFERENCES public.analyses(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    age INTEGER,
    testimonial_text TEXT NOT NULL,
    score_before NUMERIC(3,1),
    score_after NUMERIC(3,1),
    is_approved BOOLEAN NOT NULL DEFAULT false,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_testimonials ENABLE ROW LEVEL SECURITY;

-- Users can create their own testimonials
CREATE POLICY "Users can create their own testimonials"
ON public.user_testimonials
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can view their own testimonials
CREATE POLICY "Users can view their own testimonials"
ON public.user_testimonials
FOR SELECT
USING (auth.uid() = user_id);

-- Users can update their own testimonials
CREATE POLICY "Users can update their own testimonials"
ON public.user_testimonials
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own testimonials
CREATE POLICY "Users can delete their own testimonials"
ON public.user_testimonials
FOR DELETE
USING (auth.uid() = user_id);

-- Everyone can view approved testimonials (for landing page)
CREATE POLICY "Anyone can view approved testimonials"
ON public.user_testimonials
FOR SELECT
USING (is_approved = true);

-- Admins can view all testimonials
CREATE POLICY "Admins can view all testimonials"
ON public.user_testimonials
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role));

-- Admins can update testimonials (approve/feature)
CREATE POLICY "Admins can update all testimonials"
ON public.user_testimonials
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role));

-- Add updated_at trigger
CREATE TRIGGER update_user_testimonials_updated_at
BEFORE UPDATE ON public.user_testimonials
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();