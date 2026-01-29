-- =============================================
-- FRIENDS SYSTEM - Part 1: Core Tables
-- =============================================

-- Friend connection status enum
CREATE TYPE public.friend_status AS ENUM ('pending', 'accepted', 'blocked');

-- Privacy visibility enum
CREATE TYPE public.privacy_visibility AS ENUM ('none', 'delta_only', 'full');

-- =============================================
-- FRIEND CONNECTIONS TABLE
-- =============================================
CREATE TABLE public.friend_connections (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    addressee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status friend_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (requester_id, addressee_id),
    CHECK (requester_id != addressee_id)
);

ALTER TABLE public.friend_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own friend connections"
ON public.friend_connections FOR SELECT
USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

CREATE POLICY "Users can create friend requests"
ON public.friend_connections FOR INSERT
WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Users can update their own friend connections"
ON public.friend_connections FOR UPDATE
USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

CREATE POLICY "Users can delete their own friend connections"
ON public.friend_connections FOR DELETE
USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- =============================================
-- FRIEND CODES TABLE
-- =============================================
CREATE TABLE public.friend_codes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    code VARCHAR(8) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.friend_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view friend codes"
ON public.friend_codes FOR SELECT USING (true);

CREATE POLICY "Users can create their own friend code"
ON public.friend_codes FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =============================================
-- PRIVACY SETTINGS TABLE
-- =============================================
CREATE TABLE public.friend_privacy_settings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    show_score privacy_visibility NOT NULL DEFAULT 'delta_only',
    show_streak BOOLEAN NOT NULL DEFAULT true,
    show_challenges BOOLEAN NOT NULL DEFAULT true,
    allow_challenge_invites BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.friend_privacy_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view privacy settings"
ON public.friend_privacy_settings FOR SELECT USING (true);

CREATE POLICY "Users can manage their own privacy settings"
ON public.friend_privacy_settings FOR ALL USING (auth.uid() = user_id);

-- =============================================
-- ACCOUNTABILITY PARTNERS TABLE
-- =============================================
CREATE TABLE public.accountability_partners (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    partner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    ended_at TIMESTAMP WITH TIME ZONE,
    UNIQUE (user_id, partner_id),
    CHECK (user_id != partner_id)
);

ALTER TABLE public.accountability_partners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their accountability partnerships"
ON public.accountability_partners FOR SELECT
USING (auth.uid() = user_id OR auth.uid() = partner_id);

CREATE POLICY "Users can create accountability partnerships"
ON public.accountability_partners FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their accountability partnerships"
ON public.accountability_partners FOR UPDATE
USING (auth.uid() = user_id OR auth.uid() = partner_id);

-- =============================================
-- PARTNER CHECK-INS TABLE
-- =============================================
CREATE TABLE public.partner_check_ins (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    partnership_id UUID NOT NULL REFERENCES public.accountability_partners(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    check_in_date DATE NOT NULL DEFAULT CURRENT_DATE,
    completed_goals TEXT[],
    mood_score INTEGER CHECK (mood_score >= 1 AND mood_score <= 5),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (partnership_id, user_id, check_in_date)
);

ALTER TABLE public.partner_check_ins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view check-ins in their partnerships"
ON public.partner_check_ins FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.accountability_partners ap
        WHERE ap.id = partnership_id
        AND (ap.user_id = auth.uid() OR ap.partner_id = auth.uid())
    )
);

CREATE POLICY "Users can create their own check-ins"
ON public.partner_check_ins FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- =============================================
-- SHARED CHALLENGES TABLE
-- =============================================
CREATE TABLE public.shared_challenges (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    challenge_type VARCHAR(50) NOT NULL,
    target_value INTEGER,
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE NOT NULL,
    xp_reward INTEGER NOT NULL DEFAULT 50,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CHECK (end_date > start_date)
);

ALTER TABLE public.shared_challenges ENABLE ROW LEVEL SECURITY;

-- =============================================
-- SHARED CHALLENGE PARTICIPANTS TABLE
-- =============================================
CREATE TABLE public.shared_challenge_participants (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    challenge_id UUID NOT NULL REFERENCES public.shared_challenges(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    current_progress INTEGER NOT NULL DEFAULT 0,
    is_completed BOOLEAN NOT NULL DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,
    joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (challenge_id, user_id)
);

ALTER TABLE public.shared_challenge_participants ENABLE ROW LEVEL SECURITY;

-- Now add policies for shared_challenges (after participants table exists)
CREATE POLICY "Users can view shared challenges they participate in"
ON public.shared_challenges FOR SELECT
USING (
    creator_id = auth.uid() OR
    EXISTS (
        SELECT 1 FROM public.shared_challenge_participants scp
        WHERE scp.challenge_id = id AND scp.user_id = auth.uid()
    )
);

CREATE POLICY "Users can create shared challenges"
ON public.shared_challenges FOR INSERT
WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update their challenges"
ON public.shared_challenges FOR UPDATE
USING (auth.uid() = creator_id);

-- Policies for participants
CREATE POLICY "Users can view challenge participants"
ON public.shared_challenge_participants FOR SELECT
USING (
    user_id = auth.uid() OR
    EXISTS (
        SELECT 1 FROM public.shared_challenges sc
        WHERE sc.id = challenge_id AND sc.creator_id = auth.uid()
    ) OR
    EXISTS (
        SELECT 1 FROM public.shared_challenge_participants other
        WHERE other.challenge_id = challenge_id AND other.user_id = auth.uid()
    )
);

CREATE POLICY "Users can join challenges"
ON public.shared_challenge_participants FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress"
ON public.shared_challenge_participants FOR UPDATE
USING (auth.uid() = user_id);

-- =============================================
-- FRIEND MESSAGES TABLE
-- =============================================
CREATE TABLE public.friend_messages (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CHECK (sender_id != receiver_id)
);

ALTER TABLE public.friend_messages ENABLE ROW LEVEL SECURITY;
ALTER PUBLICATION supabase_realtime ADD TABLE public.friend_messages;

CREATE POLICY "Users can view their own messages"
ON public.friend_messages FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages to friends"
ON public.friend_messages FOR INSERT
WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
        SELECT 1 FROM public.friend_connections fc
        WHERE fc.status = 'accepted'
        AND (
            (fc.requester_id = auth.uid() AND fc.addressee_id = receiver_id) OR
            (fc.addressee_id = auth.uid() AND fc.requester_id = receiver_id)
        )
    )
);

CREATE POLICY "Users can update read status of received messages"
ON public.friend_messages FOR UPDATE
USING (auth.uid() = receiver_id);

-- =============================================
-- HELPER FUNCTIONS
-- =============================================
CREATE OR REPLACE FUNCTION public.generate_friend_code()
RETURNS VARCHAR(8)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_code VARCHAR(8);
    code_exists BOOLEAN;
BEGIN
    LOOP
        new_code := UPPER(SUBSTR(MD5(RANDOM()::TEXT), 1, 8));
        SELECT EXISTS (SELECT 1 FROM public.friend_codes WHERE code = new_code) INTO code_exists;
        EXIT WHEN NOT code_exists;
    END LOOP;
    RETURN new_code;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_friend_code_for_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.friend_codes (user_id, code)
    VALUES (NEW.user_id, public.generate_friend_code())
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$;

CREATE TRIGGER create_friend_code_on_profile
    AFTER INSERT ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.create_friend_code_for_user();

CREATE OR REPLACE FUNCTION public.create_privacy_settings_for_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.friend_privacy_settings (user_id)
    VALUES (NEW.user_id)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$;

CREATE TRIGGER create_privacy_settings_on_profile
    AFTER INSERT ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.create_privacy_settings_for_user();

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX idx_friend_connections_requester ON public.friend_connections(requester_id);
CREATE INDEX idx_friend_connections_addressee ON public.friend_connections(addressee_id);
CREATE INDEX idx_friend_connections_status ON public.friend_connections(status);
CREATE INDEX idx_friend_messages_receiver ON public.friend_messages(receiver_id, is_read);
CREATE INDEX idx_shared_challenge_participants_user ON public.shared_challenge_participants(user_id);
CREATE INDEX idx_accountability_partners_user ON public.accountability_partners(user_id);
CREATE INDEX idx_friend_codes_code ON public.friend_codes(code);