-- Fix the get_daily_challenges function with ambiguous column reference
CREATE OR REPLACE FUNCTION public.get_daily_challenges(p_user_id uuid)
 RETURNS TABLE(challenge_id uuid, title text, description text, icon text, category text, xp_reward integer, difficulty text, completed boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_today DATE := CURRENT_DATE;
  v_seed INTEGER;
  v_challenge_ids UUID[];
BEGIN
  -- Generate deterministic seed from date for consistent daily challenges
  v_seed := EXTRACT(DOY FROM v_today)::INTEGER + EXTRACT(YEAR FROM v_today)::INTEGER;
  
  -- Get 3 random challenges based on date seed
  SELECT ARRAY_AGG(dc.id ORDER BY md5(dc.id::text || v_seed::text)) INTO v_challenge_ids
  FROM (
    SELECT id FROM public.daily_challenges 
    WHERE is_active = true
    ORDER BY md5(id::text || v_seed::text)
    LIMIT 3
  ) dc;
  
  -- Ensure user has progress records for today
  INSERT INTO public.user_challenge_progress (user_id, challenge_id, assigned_date)
  SELECT p_user_id, unnest(v_challenge_ids), v_today
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
  JOIN public.user_challenge_progress ucp ON dc.id = ucp.challenge_id
  WHERE ucp.user_id = p_user_id 
    AND ucp.assigned_date = v_today
    AND dc.id = ANY(v_challenge_ids);
END;
$function$;

-- Also ensure the add_user_xp function creates the record if it doesn't exist
CREATE OR REPLACE FUNCTION public.add_user_xp(p_user_id uuid, p_xp_amount integer, p_reason text DEFAULT 'activity'::text)
 RETURNS TABLE(new_xp integer, new_level integer, leveled_up boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_current_xp INTEGER;
  v_current_level INTEGER;
  v_new_level INTEGER;
BEGIN
  -- Get or create user XP record
  INSERT INTO public.user_xp (user_id, current_xp, total_xp, level)
  VALUES (p_user_id, p_xp_amount, p_xp_amount, 1)
  ON CONFLICT (user_id) DO UPDATE
  SET 
    current_xp = user_xp.current_xp + p_xp_amount,
    total_xp = user_xp.total_xp + p_xp_amount,
    updated_at = now()
  RETURNING current_xp, level INTO v_current_xp, v_current_level;
  
  -- Calculate new level (100 XP per level, exponential growth)
  v_new_level := 1 + FLOOR(POWER(v_current_xp / 100.0, 0.8))::INTEGER;
  v_new_level := GREATEST(v_new_level, 1);
  
  -- Update level if changed
  IF v_new_level > v_current_level THEN
    UPDATE public.user_xp
    SET level = v_new_level, updated_at = now()
    WHERE user_id = p_user_id;
  END IF;
  
  RETURN QUERY SELECT v_current_xp, v_new_level, (v_new_level > v_current_level);
END;
$function$;