-- Create refund requests table
CREATE TABLE public.refund_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  payment_intent_id TEXT NOT NULL,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'eur',
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'auto_refunded')),
  payment_date TIMESTAMP WITH TIME ZONE NOT NULL,
  request_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE,
  processed_by UUID,
  admin_notes TEXT,
  is_within_period BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.refund_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own refund requests
CREATE POLICY "Users can view their own refund requests"
ON public.refund_requests
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create refund requests for themselves
CREATE POLICY "Users can create refund requests"
ON public.refund_requests
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admins/owners can view all refund requests
CREATE POLICY "Admins can view all refund requests"
ON public.refund_requests
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'owner')
  )
);

-- Admins/owners can update refund requests
CREATE POLICY "Admins can update refund requests"
ON public.refund_requests
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'owner')
  )
);

-- Create index for faster lookups
CREATE INDEX idx_refund_requests_user_id ON public.refund_requests(user_id);
CREATE INDEX idx_refund_requests_status ON public.refund_requests(status);
CREATE INDEX idx_refund_requests_payment_intent ON public.refund_requests(payment_intent_id);