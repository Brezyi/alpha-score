-- Fix ambiguous column reference in get_daily_challenges function
CREATE OR REPLACE FUNCTION public.get_daily_challenges(p_user_id uuid)
RETURNS TABLE(challenge_id uuid, title text, description text, icon text, category text, xp_reward integer, difficulty text, completed boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_today DATE := CURRENT_DATE;
  v_seed INTEGER;
  v_challenge_id_item UUID;
  v_challenge_ids UUID[];
BEGIN
  -- Generate deterministic seed from date for consistent daily challenges
  v_seed := EXTRACT(DOY FROM v_today)::INTEGER + EXTRACT(YEAR FROM v_today)::INTEGER;
  
  -- Get 3 challenges based on date seed (deterministic selection)
  SELECT ARRAY_AGG(sub.cid) INTO v_challenge_ids
  FROM (
    SELECT dc.id AS cid 
    FROM public.daily_challenges dc
    WHERE dc.is_active = true
    ORDER BY md5(dc.id::text || v_seed::text)
    LIMIT 3
  ) sub;
  
  -- Ensure user has progress records for today - iterate to avoid ambiguity
  FOREACH v_challenge_id_item IN ARRAY v_challenge_ids
  LOOP
    INSERT INTO public.user_challenge_progress (user_id, challenge_id, assigned_date, completed)
    VALUES (p_user_id, v_challenge_id_item, v_today, false)
    ON CONFLICT (user_id, challenge_id, assigned_date) DO NOTHING;
  END LOOP;
  
  -- Return challenges with completion status - using explicit table aliases
  RETURN QUERY
  SELECT 
    dc.id AS challenge_id,
    dc.title AS title,
    dc.description AS description,
    dc.icon AS icon,
    dc.category AS category,
    dc.xp_reward AS xp_reward,
    dc.difficulty AS difficulty,
    COALESCE(ucp.completed, false) AS completed
  FROM public.daily_challenges dc
  INNER JOIN public.user_challenge_progress ucp 
    ON dc.id = ucp.challenge_id 
    AND ucp.user_id = p_user_id 
    AND ucp.assigned_date = v_today
  WHERE dc.id = ANY(v_challenge_ids);
END;
$function$;