-- Drop potentially partially created policies
DROP POLICY IF EXISTS "Friends can view streaks if allowed" ON public.user_streaks;
DROP POLICY IF EXISTS "Friends can view XP" ON public.user_xp;
DROP POLICY IF EXISTS "Friends can view analyses if allowed" ON public.analyses;
DROP POLICY IF EXISTS "Users and friends can view streaks" ON public.user_streaks;
DROP POLICY IF EXISTS "Users and friends can view XP" ON public.user_xp;
DROP POLICY IF EXISTS "Users and friends can view analyses" ON public.analyses;

-- Drop old policies
DROP POLICY IF EXISTS "Users can view their own streaks" ON public.user_streaks;
DROP POLICY IF EXISTS "Users can view their own XP" ON public.user_xp;
DROP POLICY IF EXISTS "Users can view their own analyses" ON public.analyses;

-- Create new policies with friend visibility
CREATE POLICY "Users and friends can view streaks"
ON public.user_streaks
FOR SELECT
USING (
  auth.uid() = user_id
  OR
  (
    EXISTS (
      SELECT 1 FROM public.friend_connections fc
      WHERE fc.status = 'accepted'
        AND (
          (fc.requester_id = auth.uid() AND fc.addressee_id = user_streaks.user_id)
          OR (fc.addressee_id = auth.uid() AND fc.requester_id = user_streaks.user_id)
        )
    )
    AND
    COALESCE(
      (SELECT fps.show_streak FROM public.friend_privacy_settings fps WHERE fps.user_id = user_streaks.user_id),
      true
    ) = true
  )
);

CREATE POLICY "Users and friends can view XP"
ON public.user_xp
FOR SELECT
USING (
  auth.uid() = user_id
  OR
  EXISTS (
    SELECT 1 FROM public.friend_connections fc
    WHERE fc.status = 'accepted'
      AND (
        (fc.requester_id = auth.uid() AND fc.addressee_id = user_xp.user_id)
        OR (fc.addressee_id = auth.uid() AND fc.requester_id = user_xp.user_id)
      )
  )
);

CREATE POLICY "Users and friends can view analyses"
ON public.analyses
FOR SELECT
USING (
  auth.uid() = user_id
  OR
  (
    EXISTS (
      SELECT 1 FROM public.friend_connections fc
      WHERE fc.status = 'accepted'
        AND (
          (fc.requester_id = auth.uid() AND fc.addressee_id = analyses.user_id)
          OR (fc.addressee_id = auth.uid() AND fc.requester_id = analyses.user_id)
        )
    )
    AND
    COALESCE(
      (SELECT fps.show_score FROM public.friend_privacy_settings fps WHERE fps.user_id = analyses.user_id),
      'full'::privacy_visibility
    ) != 'none'::privacy_visibility
  )
);