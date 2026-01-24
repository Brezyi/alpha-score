-- =====================================================
-- SECURITY FIX 1: Sanitized Public View for Testimonials
-- Removes user_id and analysis_id from public access
-- =====================================================

-- Create a sanitized public view for testimonials
CREATE OR REPLACE VIEW public.user_testimonials_public
WITH (security_invoker = on) AS
SELECT 
  id,
  display_name,
  age,
  testimonial_text,
  score_before,
  score_after,
  star_rating,
  is_approved,
  is_featured,
  created_at
FROM public.user_testimonials
WHERE is_approved = true AND deleted_at IS NULL;

-- Grant public select on the view
GRANT SELECT ON public.user_testimonials_public TO anon, authenticated;

-- =====================================================
-- SECURITY FIX 2: Replace RPC with Trigger-based Increment
-- Eliminates separate RPC call vulnerability
-- =====================================================

-- Create trigger function for auto-incrementing promo usage
CREATE OR REPLACE FUNCTION public.auto_increment_promo_usage()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE promo_codes
  SET current_uses = current_uses + 1
  WHERE id = NEW.promo_code_id;
  RETURN NEW;
END;
$$;

-- Create trigger on promo_code_redemptions
DROP TRIGGER IF EXISTS increment_promo_usage_on_redemption ON promo_code_redemptions;
CREATE TRIGGER increment_promo_usage_on_redemption
AFTER INSERT ON promo_code_redemptions
FOR EACH ROW
EXECUTE FUNCTION public.auto_increment_promo_usage();

-- =====================================================
-- SECURITY FIX 3: Add Rate Limiting to complete_challenge
-- Prevents abuse through rapid repeated calls
-- =====================================================

CREATE OR REPLACE FUNCTION public.complete_challenge(p_user_id uuid, p_challenge_id uuid)
RETURNS TABLE(success boolean, xp_earned integer, message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_xp_reward INTEGER;
  v_already_completed BOOLEAN := false;
  v_today DATE := CURRENT_DATE;
BEGIN
  -- SECURITY: Only allow users to complete their own challenges
  IF p_user_id IS NULL OR p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: Cannot complete challenges for other users';
  END IF;

  -- SECURITY: Rate limit - max 30 challenge attempts per hour
  IF NOT public.check_rate_limit(
    p_user_id,
    'COMPLETE_CHALLENGE',
    30,
    '1 hour'::interval
  ) THEN
    RETURN QUERY SELECT false, 0, 'Zu viele Versuche. Bitte warte eine Stunde.'::text;
    RETURN;
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
$$;