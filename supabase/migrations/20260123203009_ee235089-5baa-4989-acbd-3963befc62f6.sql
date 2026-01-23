-- Allow owners to insert subscriptions
CREATE POLICY "Owners can insert subscriptions"
ON public.subscriptions
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'owner'::app_role));

-- Allow owners to update subscriptions
CREATE POLICY "Owners can update subscriptions"
ON public.subscriptions
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'owner'::app_role));

-- Allow owners to delete subscriptions
CREATE POLICY "Owners can delete subscriptions"
ON public.subscriptions
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'owner'::app_role));