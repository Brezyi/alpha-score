-- Create table for tracking milestone achievements
CREATE TABLE public.user_milestones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  milestone_key TEXT NOT NULL,
  achieved_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, milestone_key)
);

-- Enable Row Level Security
ALTER TABLE public.user_milestones ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own milestones" 
ON public.user_milestones 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own milestones" 
ON public.user_milestones 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_user_milestones_user_id ON public.user_milestones(user_id);