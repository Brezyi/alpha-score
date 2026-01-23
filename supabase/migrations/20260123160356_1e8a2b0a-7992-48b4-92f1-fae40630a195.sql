-- Add is_priority column to support_tickets for Premium priority support
ALTER TABLE public.support_tickets 
ADD COLUMN IF NOT EXISTS is_priority boolean NOT NULL DEFAULT false;

-- Add index for faster priority ticket queries
CREATE INDEX IF NOT EXISTS idx_support_tickets_priority ON public.support_tickets(is_priority, created_at DESC) WHERE is_priority = true;