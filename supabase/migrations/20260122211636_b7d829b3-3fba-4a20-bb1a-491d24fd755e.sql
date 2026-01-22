-- Fix: Add authorization check to update_user_streak function
-- This prevents any authenticated user from updating other users' streaks

CREATE OR REPLACE FUNCTION public.update_user_streak(p_user_id uuid)
RETURNS user_streaks
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_streak public.user_streaks;
  v_today DATE := CURRENT_DATE;
  v_yesterday DATE := CURRENT_DATE - INTERVAL '1 day';
BEGIN
  -- SECURITY: Verify caller is updating their own streak
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: Cannot update other users'' streaks';
  END IF;

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