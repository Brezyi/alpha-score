-- Create subscriptions table to store Stripe subscription data locally
CREATE TABLE public.subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT NOT NULL,
  stripe_subscription_id TEXT UNIQUE,
  stripe_price_id TEXT,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('premium', 'lifetime')),
  status TEXT NOT NULL DEFAULT 'active',
  amount INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'eur',
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT false,
  canceled_at TIMESTAMP WITH TIME ZONE,
  customer_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_customer_id ON public.subscriptions(stripe_customer_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Owners can view all subscriptions
CREATE POLICY "Owners can view all subscriptions" 
ON public.subscriptions 
FOR SELECT 
USING (has_role(auth.uid(), 'owner'::app_role));

-- Admins can view all subscriptions (read-only)
CREATE POLICY "Admins can view all subscriptions" 
ON public.subscriptions 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Users can view their own subscriptions
CREATE POLICY "Users can view own subscriptions" 
ON public.subscriptions 
FOR SELECT 
USING (auth.uid() = user_id);

-- Service role can insert/update (for webhooks)
CREATE POLICY "Service role can manage subscriptions" 
ON public.subscriptions 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create payments table to track all payments
CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  stripe_payment_intent_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'eur',
  status TEXT NOT NULL DEFAULT 'pending',
  payment_type TEXT NOT NULL CHECK (payment_type IN ('subscription', 'one_time')),
  customer_email TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for payments
CREATE INDEX idx_payments_user_id ON public.payments(user_id);
CREATE INDEX idx_payments_status ON public.payments(status);
CREATE INDEX idx_payments_created_at ON public.payments(created_at);

-- Enable RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Owners can view all payments
CREATE POLICY "Owners can view all payments" 
ON public.payments 
FOR SELECT 
USING (has_role(auth.uid(), 'owner'::app_role));

-- Admins can view all payments (read-only)
CREATE POLICY "Admins can view all payments" 
ON public.payments 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Service role can manage payments
CREATE POLICY "Service role can manage payments" 
ON public.payments 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Add trigger for updated_at on subscriptions
CREATE TRIGGER update_subscriptions_updated_at
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default system settings if not exist
INSERT INTO public.system_settings (key, value, description, category)
VALUES 
  ('app_name', '"FaceRank"', 'Name der Anwendung', 'branding'),
  ('maintenance_mode', 'false', 'Wartungsmodus aktivieren', 'general'),
  ('auto_confirm_email', 'true', 'E-Mails automatisch bestätigen', 'auth'),
  ('max_upload_size_mb', '10', 'Maximale Upload-Größe in MB', 'general'),
  ('streak_reminder_enabled', 'true', 'Streak-Erinnerungen aktiviert', 'notifications'),
  ('analytics_enabled', 'true', 'Analytics aktiviert', 'general'),
  ('ai_analysis_intensity', '"standard"', 'KI-Analyse-Intensität', 'ai'),
  ('default_theme', '"dark"', 'Standard-Theme', 'branding'),
  ('accent_color', '"#00FF88"', 'Akzentfarbe', 'branding')
ON CONFLICT (key) DO NOTHING;