-- Fix the get_daily_challenges function - fully rewrite to avoid ambiguity
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
  v_challenge_id uuid;
BEGIN
  -- Ensure user has progress entries for today's active challenges
  FOR v_challenge_id IN 
    SELECT dc.id FROM daily_challenges dc WHERE dc.is_active = true
  LOOP
    INSERT INTO user_challenge_progress (user_id, challenge_id, completed_at)
    VALUES (p_user_id, v_challenge_id, NULL)
    ON CONFLICT (user_id, challenge_id) DO NOTHING;
  END LOOP;

  -- Return challenges with completion status
  RETURN QUERY
  SELECT 
    dc.id as challenge_id,
    dc.title,
    dc.description,
    dc.icon,
    dc.category,
    dc.xp_reward,
    dc.difficulty,
    CASE 
      WHEN ucp.completed_at IS NOT NULL 
           AND ucp.completed_at::date = CURRENT_DATE 
      THEN true 
      ELSE false 
    END as completed
  FROM daily_challenges dc
  LEFT JOIN user_challenge_progress ucp 
    ON ucp.challenge_id = dc.id 
    AND ucp.user_id = p_user_id
  WHERE dc.is_active = true
  ORDER BY dc.xp_reward DESC;
END;
$$;