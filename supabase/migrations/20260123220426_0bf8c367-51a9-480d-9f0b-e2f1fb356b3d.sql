-- Add DELETE policy for admins/owners to permanently delete testimonials
CREATE POLICY "Admins can delete all testimonials"
ON public.user_testimonials
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role));