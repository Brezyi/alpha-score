-- Create coach conversations table
CREATE TABLE public.coach_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL DEFAULT 'Neues Gespräch',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create coach messages table
CREATE TABLE public.coach_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.coach_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.coach_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for conversations
CREATE POLICY "Users can view their own conversations"
ON public.coach_conversations FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own conversations"
ON public.coach_conversations FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations"
ON public.coach_conversations FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conversations"
ON public.coach_conversations FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for messages
CREATE POLICY "Users can view messages of their conversations"
ON public.coach_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.coach_conversations
    WHERE id = coach_messages.conversation_id
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can create messages in their conversations"
ON public.coach_messages FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.coach_conversations
    WHERE id = coach_messages.conversation_id
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete messages from their conversations"
ON public.coach_messages FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.coach_conversations
    WHERE id = coach_messages.conversation_id
    AND user_id = auth.uid()
  )
);

-- Indexes for performance
CREATE INDEX idx_coach_conversations_user ON public.coach_conversations(user_id);
CREATE INDEX idx_coach_messages_conversation ON public.coach_messages(conversation_id);
CREATE INDEX idx_coach_messages_created ON public.coach_messages(created_at);

-- Trigger to update conversation timestamp
CREATE TRIGGER update_coach_conversations_updated_at
BEFORE UPDATE ON public.coach_conversations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();