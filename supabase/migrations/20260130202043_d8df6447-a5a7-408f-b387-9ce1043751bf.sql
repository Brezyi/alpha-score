-- Fix add_user_xp function to correctly calculate levels
CREATE OR REPLACE FUNCTION public.add_user_xp(p_user_id UUID, p_xp_amount INTEGER, p_reason TEXT DEFAULT 'activity')
RETURNS TABLE(new_xp INTEGER, new_level INTEGER, leveled_up BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_xp INTEGER;
  v_total_xp INTEGER;
  v_current_level INTEGER;
  v_new_level INTEGER;
  v_xp_for_current_level INTEGER;
  v_xp_accumulated INTEGER;
BEGIN
  -- Get or create user XP record
  INSERT INTO public.user_xp (user_id, current_xp, total_xp, level)
  VALUES (p_user_id, p_xp_amount, p_xp_amount, 1)
  ON CONFLICT (user_id) DO UPDATE
  SET 
    current_xp = user_xp.current_xp + p_xp_amount,
    total_xp = user_xp.total_xp + p_xp_amount,
    updated_at = now()
  RETURNING current_xp, total_xp, level INTO v_current_xp, v_total_xp, v_current_level;
  
  -- Calculate level based on total XP using exponential growth formula
  -- XP needed for level N = 100 * N^1.25
  -- We accumulate XP requirements until we find the level
  v_new_level := 1;
  v_xp_accumulated := 0;
  
  LOOP
    v_xp_for_current_level := FLOOR(100 * POWER(v_new_level, 1.25))::INTEGER;
    EXIT WHEN v_xp_accumulated + v_xp_for_current_level > v_current_xp;
    v_xp_accumulated := v_xp_accumulated + v_xp_for_current_level;
    v_new_level := v_new_level + 1;
  END LOOP;
  
  -- Update level if changed
  IF v_new_level > v_current_level THEN
    UPDATE public.user_xp
    SET level = v_new_level, updated_at = now()
    WHERE user_id = p_user_id;
  END IF;
  
  RETURN QUERY SELECT v_current_xp, v_new_level, (v_new_level > v_current_level);
END;
$$;