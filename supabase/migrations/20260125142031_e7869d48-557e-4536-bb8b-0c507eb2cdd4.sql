-- Add bedtime reminder settings to user_sleep_goals
ALTER TABLE public.user_sleep_goals 
ADD COLUMN IF NOT EXISTS reminder_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS reminder_minutes_before INTEGER DEFAULT 30;