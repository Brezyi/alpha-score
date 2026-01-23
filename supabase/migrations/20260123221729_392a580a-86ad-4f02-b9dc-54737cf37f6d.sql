-- =====================================================
-- FINAL SECURITY FIXES - Remaining items only
-- =====================================================

-- 1. Users can create deletion tokens for themselves
DROP POLICY IF EXISTS "Users can create their own deletion tokens" ON public.account_deletion_tokens;
CREATE POLICY "Users can create their own deletion tokens"
ON public.account_deletion_tokens
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);