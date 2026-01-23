-- Create account deletion tokens table
CREATE TABLE IF NOT EXISTS public.account_deletion_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.account_deletion_tokens ENABLE ROW LEVEL SECURITY;

-- Users can only read their own tokens (for validation)
CREATE POLICY "Users can view their own deletion tokens"
ON public.account_deletion_tokens
FOR SELECT
USING (auth.uid() = user_id);

-- Allow anonymous read for token validation on confirm page (needed since user might be logged out)
CREATE POLICY "Anyone can validate tokens by token value"
ON public.account_deletion_tokens
FOR SELECT
USING (true);

-- Cleanup index for expired tokens
CREATE INDEX idx_deletion_tokens_expires ON public.account_deletion_tokens(expires_at);
CREATE INDEX idx_deletion_tokens_token ON public.account_deletion_tokens(token);