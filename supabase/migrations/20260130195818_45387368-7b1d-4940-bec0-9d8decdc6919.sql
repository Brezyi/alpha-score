-- Add DELETE policy for partner_requests so users can clean up old requests
CREATE POLICY "Users can delete their own partner requests"
ON public.partner_requests
FOR DELETE
USING (
  auth.uid() = requester_id OR auth.uid() = addressee_id
);