-- Create user_streaks table for tracking daily activity streaks
CREATE TABLE public.user_streaks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_activity_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;

-- Users can view their own streaks
CREATE POLICY "Users can view their own streaks"
ON public.user_streaks
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own streaks
CREATE POLICY "Users can insert their own streaks"
ON public.user_streaks
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own streaks
CREATE POLICY "Users can update their own streaks"
ON public.user_streaks
FOR UPDATE
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_user_streaks_updated_at
BEFORE UPDATE ON public.user_streaks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to update user streak (called when user performs an activity)
CREATE OR REPLACE FUNCTION public.update_user_streak(p_user_id UUID)
RETURNS public.user_streaks
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_streak public.user_streaks;
  v_today DATE := CURRENT_DATE;
  v_yesterday DATE := CURRENT_DATE - INTERVAL '1 day';
BEGIN
  -- Try to get existing streak record
  SELECT * INTO v_streak FROM public.user_streaks WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    -- Create new streak record
    INSERT INTO public.user_streaks (user_id, current_streak, longest_streak, last_activity_date)
    VALUES (p_user_id, 1, 1, v_today)
    RETURNING * INTO v_streak;
  ELSE
    -- Check if already active today
    IF v_streak.last_activity_date = v_today THEN
      -- Already counted today, just return
      RETURN v_streak;
    ELSIF v_streak.last_activity_date = v_yesterday THEN
      -- Consecutive day, increment streak
      UPDATE public.user_streaks
      SET 
        current_streak = current_streak + 1,
        longest_streak = GREATEST(longest_streak, current_streak + 1),
        last_activity_date = v_today
      WHERE user_id = p_user_id
      RETURNING * INTO v_streak;
    ELSE
      -- Streak broken, reset to 1
      UPDATE public.user_streaks
      SET 
        current_streak = 1,
        last_activity_date = v_today
      WHERE user_id = p_user_id
      RETURNING * INTO v_streak;
    END IF;
  END IF;
  
  RETURN v_streak;
END;
$$;