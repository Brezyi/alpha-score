-- Add is_archived column to coach_conversations
ALTER TABLE public.coach_conversations 
ADD COLUMN is_archived boolean NOT NULL DEFAULT false;