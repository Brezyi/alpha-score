-- Add sleep tracking columns to lifestyle_entries table
ALTER TABLE public.lifestyle_entries 
ADD COLUMN IF NOT EXISTS sleep_bedtime TIME,
ADD COLUMN IF NOT EXISTS sleep_waketime TIME,
ADD COLUMN IF NOT EXISTS sleep_quality INTEGER CHECK (sleep_quality >= 1 AND sleep_quality <= 5);

-- Create user sleep goals table
CREATE TABLE IF NOT EXISTS public.user_sleep_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  target_hours NUMERIC(3,1) NOT NULL DEFAULT 8.0,
  target_bedtime TIME,
  target_waketime TIME,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on user_sleep_goals
ALTER TABLE public.user_sleep_goals ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_sleep_goals
CREATE POLICY "Users can view their own sleep goals" 
ON public.user_sleep_goals FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sleep goals" 
ON public.user_sleep_goals FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sleep goals" 
ON public.user_sleep_goals FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sleep goals" 
ON public.user_sleep_goals FOR DELETE 
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_user_sleep_goals_updated_at
BEFORE UPDATE ON public.user_sleep_goals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();