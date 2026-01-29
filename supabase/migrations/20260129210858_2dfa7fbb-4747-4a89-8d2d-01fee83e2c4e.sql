-- Add partner_requests table for partner request system
CREATE TABLE public.partner_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  addressee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  responded_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(requester_id, addressee_id)
);

-- Enable RLS
ALTER TABLE public.partner_requests ENABLE ROW LEVEL SECURITY;

-- RLS policies for partner_requests
CREATE POLICY "Users can view their own partner requests"
ON public.partner_requests FOR SELECT
USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

CREATE POLICY "Users can create partner requests"
ON public.partner_requests FOR INSERT
WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Addressee can update partner request status"
ON public.partner_requests FOR UPDATE
USING (auth.uid() = addressee_id)
WITH CHECK (auth.uid() = addressee_id);

CREATE POLICY "Users can delete their own pending requests"
ON public.partner_requests FOR DELETE
USING (auth.uid() = requester_id AND status = 'pending');

-- Create notification preferences table if not exists
CREATE TABLE IF NOT EXISTS public.notification_counts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  unread_messages INTEGER NOT NULL DEFAULT 0,
  unread_friend_requests INTEGER NOT NULL DEFAULT 0,
  unread_partner_requests INTEGER NOT NULL DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notification_counts ENABLE ROW LEVEL SECURITY;

-- RLS policies for notification_counts
CREATE POLICY "Users can view their own notification counts"
ON public.notification_counts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification counts"
ON public.notification_counts FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notification counts"
ON public.notification_counts FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Enable realtime for partner_requests
ALTER PUBLICATION supabase_realtime ADD TABLE public.partner_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notification_counts;