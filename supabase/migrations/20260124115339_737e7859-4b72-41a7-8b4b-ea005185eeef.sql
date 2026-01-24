-- Drop and recreate the get_daily_challenges function with proper logic
DROP FUNCTION IF EXISTS get_daily_challenges(uuid);

CREATE OR REPLACE FUNCTION get_daily_challenges(p_user_id uuid)
RETURNS TABLE (
  challenge_id uuid,
  title text,
  description text,
  icon text,
  category text,
  xp_reward integer,
  difficulty text,
  completed boolean
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_today DATE := CURRENT_DATE;
  v_seed INTEGER;
  v_challenge_ids UUID[];
BEGIN
  -- Generate deterministic seed from date for consistent daily challenges
  v_seed := EXTRACT(DOY FROM v_today)::INTEGER + EXTRACT(YEAR FROM v_today)::INTEGER;
  
  -- Get 3 challenges based on date seed (deterministic selection)
  SELECT ARRAY_AGG(sub.id) INTO v_challenge_ids
  FROM (
    SELECT dc.id 
    FROM public.daily_challenges dc
    WHERE dc.is_active = true
    ORDER BY md5(dc.id::text || v_seed::text)
    LIMIT 3
  ) sub;
  
  -- Ensure user has progress records for today
  INSERT INTO public.user_challenge_progress (user_id, challenge_id, assigned_date, completed)
  SELECT p_user_id, unnest(v_challenge_ids), v_today, false
  ON CONFLICT (user_id, challenge_id, assigned_date) DO NOTHING;
  
  -- Return challenges with completion status
  RETURN QUERY
  SELECT 
    dc.id AS challenge_id,
    dc.title,
    dc.description,
    dc.icon,
    dc.category,
    dc.xp_reward,
    dc.difficulty,
    COALESCE(ucp.completed, false) AS completed
  FROM public.daily_challenges dc
  INNER JOIN public.user_challenge_progress ucp 
    ON dc.id = ucp.challenge_id 
    AND ucp.user_id = p_user_id 
    AND ucp.assigned_date = v_today
  WHERE dc.id = ANY(v_challenge_ids);
END;
$$;

-- Also fix the complete_challenge function 
DROP FUNCTION IF EXISTS complete_challenge(uuid, uuid);

CREATE OR REPLACE FUNCTION complete_challenge(p_user_id uuid, p_challenge_id uuid)
RETURNS TABLE (success boolean, xp_earned integer, message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_xp_reward INTEGER;
  v_already_completed BOOLEAN;
  v_today DATE := CURRENT_DATE;
BEGIN
  -- Check if already completed today
  SELECT ucp.completed INTO v_already_completed
  FROM public.user_challenge_progress ucp
  WHERE ucp.user_id = p_user_id 
    AND ucp.challenge_id = p_challenge_id 
    AND ucp.assigned_date = v_today;
  
  IF v_already_completed = true THEN
    RETURN QUERY SELECT false, 0, 'Challenge bereits abgeschlossen'::text;
    RETURN;
  END IF;
  
  -- Get XP reward
  SELECT dc.xp_reward INTO v_xp_reward
  FROM public.daily_challenges dc
  WHERE dc.id = p_challenge_id;
  
  IF v_xp_reward IS NULL THEN
    RETURN QUERY SELECT false, 0, 'Challenge nicht gefunden'::text;
    RETURN;
  END IF;
  
  -- Mark as completed
  UPDATE public.user_challenge_progress
  SET completed = true, completed_at = now()
  WHERE user_id = p_user_id 
    AND challenge_id = p_challenge_id 
    AND assigned_date = v_today;
  
  -- Add XP
  PERFORM public.add_user_xp(p_user_id, v_xp_reward, 'challenge');
  
  RETURN QUERY SELECT true, v_xp_reward, ('Challenge abgeschlossen! +' || v_xp_reward || ' XP')::text;
END;
$$;