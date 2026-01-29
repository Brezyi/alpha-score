-- Fix: Allow either user_id or partner_id to be the current user when creating partnership
DROP POLICY IF EXISTS "Users can create accountability partnerships" ON public.accountability_partners;

CREATE POLICY "Users can create accountability partnerships"
ON public.accountability_partners
FOR INSERT
WITH CHECK (
  auth.uid() = user_id OR auth.uid() = partner_id
);