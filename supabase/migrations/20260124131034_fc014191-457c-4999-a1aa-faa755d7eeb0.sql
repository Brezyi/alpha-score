-- Harden and fix daily challenges functions

-- 1) Fix ambiguity in get_daily_challenges by using ON CONFLICT ON CONSTRAINT
--    and restrict calls to the authenticated user
CREATE OR REPLACE FUNCTION public.get_daily_challenges(p_user_id uuid)
RETURNS TABLE(
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
SET search_path TO 'public'
AS $function$
DECLARE
  v_today DATE := CURRENT_DATE;
  v_seed INTEGER;
  v_challenge_id_item UUID;
  v_challenge_ids UUID[];
BEGIN
  -- SECURITY: Only allow users to fetch their own challenges
  IF p_user_id IS NULL OR p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: Cannot fetch challenges for other users';
  END IF;

  v_seed := EXTRACT(DOY FROM v_today)::INTEGER + EXTRACT(YEAR FROM v_today)::INTEGER;

  SELECT ARRAY_AGG(sub.cid) INTO v_challenge_ids
  FROM (
    SELECT dc.id AS cid
    FROM public.daily_challenges dc
    WHERE dc.is_active = true
    ORDER BY md5(dc.id::text || v_seed::text)
    LIMIT 3
  ) sub;

  FOREACH v_challenge_id_item IN ARRAY v_challenge_ids
  LOOP
    INSERT INTO public.user_challenge_progress (user_id, challenge_id, assigned_date, completed)
    VALUES (p_user_id, v_challenge_id_item, v_today, false)
    ON CONFLICT ON CONSTRAINT user_challenge_progress_user_id_challenge_id_assigned_date_key DO NOTHING;
  END LOOP;

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

-- 2) Ensure a challenge can only be completed once per day (and only if assigned today)
CREATE OR REPLACE FUNCTION public.complete_challenge(p_user_id uuid, p_challenge_id uuid)
RETURNS TABLE(success boolean, xp_earned integer, message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_xp_reward INTEGER;
  v_already_completed BOOLEAN := false;
  v_today DATE := CURRENT_DATE;
BEGIN
  -- SECURITY: Only allow users to complete their own challenges
  IF p_user_id IS NULL OR p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: Cannot complete challenges for other users';
  END IF;

  -- Ensure today's assignments exist (creates 3 records for today)
  PERFORM 1 FROM public.get_daily_challenges(p_user_id);

  -- Check if this challenge is assigned today and whether it's already completed
  SELECT ucp.completed
  INTO v_already_completed
  FROM public.user_challenge_progress ucp
  WHERE ucp.user_id = p_user_id
    AND ucp.challenge_id = p_challenge_id
    AND ucp.assigned_date = v_today;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 0, 'Challenge ist heute nicht aktiv'::text;
    RETURN;
  END IF;

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
  UPDATE public.user_challenge_progress ucp
  SET completed = true, completed_at = now()
  WHERE ucp.user_id = p_user_id
    AND ucp.challenge_id = p_challenge_id
    AND ucp.assigned_date = v_today;

  -- Add XP
  PERFORM public.add_user_xp(p_user_id, v_xp_reward, 'challenge');

  RETURN QUERY SELECT true, v_xp_reward, ('Challenge abgeschlossen! +' || v_xp_reward || ' XP')::text;
END;
$function$;