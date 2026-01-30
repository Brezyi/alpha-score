-- Add policy to allow users to see profiles of their friends
CREATE POLICY "Users can view profiles of their friends"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.friend_connections fc
    WHERE fc.status = 'accepted'
    AND (
      (fc.requester_id = auth.uid() AND fc.addressee_id = profiles.user_id)
      OR
      (fc.addressee_id = auth.uid() AND fc.requester_id = profiles.user_id)
    )
  )
);

-- Add policy to allow users to see profiles of users who sent them a friend request (pending)
CREATE POLICY "Users can view profiles of pending friend requesters"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.friend_connections fc
    WHERE fc.status = 'pending'
    AND fc.addressee_id = auth.uid()
    AND fc.requester_id = profiles.user_id
  )
);