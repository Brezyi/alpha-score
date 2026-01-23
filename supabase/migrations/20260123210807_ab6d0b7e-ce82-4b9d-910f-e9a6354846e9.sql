-- Allow owners to view all redemptions for the history feature
CREATE POLICY "Owners can view all redemptions"
ON public.promo_code_redemptions
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'owner'::app_role));