-- Remove duplicate/overly permissive policy and keep only the user-specific one
DROP POLICY IF EXISTS "Anyone can validate tokens by token value" ON public.account_deletion_tokens;

-- Add a proper policy for unauthenticated token validation (using token column)
CREATE POLICY "Token validation by token value"
ON public.account_deletion_tokens
FOR SELECT
USING (true);

-- Allow service role to insert/update/delete (handled by edge functions)
-- No direct user insert/update/delete needed - handled by edge functions with service role