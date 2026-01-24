-- =============================================
-- GAMIFICATION SYSTEM: XP, Levels, Achievements, Challenges
-- =============================================

-- 1. USER XP & LEVELS TABLE
CREATE TABLE public.user_xp (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  current_xp INTEGER NOT NULL DEFAULT 0,
  total_xp INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_xp ENABLE ROW LEVEL SECURITY;

-- Policies for user_xp
CREATE POLICY "Users can view their own XP" 
ON public.user_xp FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own XP" 
ON public.user_xp FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own XP" 
ON public.user_xp FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 2. ACHIEVEMENTS/BADGES TABLE
CREATE TABLE public.achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  xp_reward INTEGER NOT NULL DEFAULT 50,
  requirement_type TEXT NOT NULL,
  requirement_value INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS (public read for achievements)
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view achievements" 
ON public.achievements FOR SELECT 
USING (true);

-- 3. USER ACHIEVEMENTS (unlocked badges)
CREATE TABLE public.user_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- Enable RLS
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own achievements" 
ON public.user_achievements FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own achievements" 
ON public.user_achievements FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 4. DAILY CHALLENGES TABLE
CREATE TABLE public.daily_challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '🎯',
  category TEXT NOT NULL DEFAULT 'general',
  xp_reward INTEGER NOT NULL DEFAULT 25,
  difficulty TEXT NOT NULL DEFAULT 'easy',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS (public read)
ALTER TABLE public.daily_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active challenges" 
ON public.daily_challenges FOR SELECT 
USING (is_active = true);

-- 5. USER CHALLENGE PROGRESS
CREATE TABLE public.user_challenge_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  challenge_id UUID NOT NULL REFERENCES public.daily_challenges(id) ON DELETE CASCADE,
  completed BOOLEAN NOT NULL DEFAULT false,
  assigned_date DATE NOT NULL DEFAULT CURRENT_DATE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, challenge_id, assigned_date)
);

-- Enable RLS
ALTER TABLE public.user_challenge_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own challenge progress" 
ON public.user_challenge_progress FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own challenge progress" 
ON public.user_challenge_progress FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own challenge progress" 
ON public.user_challenge_progress FOR UPDATE 
USING (auth.uid() = user_id);

-- 6. SKINCARE PRODUCT RECOMMENDATIONS TABLE
CREATE TABLE public.product_recommendations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  brand TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  target_issues TEXT[] NOT NULL DEFAULT '{}',
  skin_types TEXT[] DEFAULT '{}',
  price_range TEXT DEFAULT 'medium',
  affiliate_link TEXT,
  image_url TEXT,
  rating NUMERIC(2,1) DEFAULT 4.5,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS (public read)
ALTER TABLE public.product_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active products" 
ON public.product_recommendations FOR SELECT 
USING (is_active = true);

-- 7. USER EMAIL PREFERENCES
CREATE TABLE public.user_email_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  weekly_report BOOLEAN NOT NULL DEFAULT true,
  challenge_reminders BOOLEAN NOT NULL DEFAULT true,
  achievement_notifications BOOLEAN NOT NULL DEFAULT true,
  marketing_emails BOOLEAN NOT NULL DEFAULT false,
  last_weekly_report_sent TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_email_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own email preferences" 
ON public.user_email_preferences FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own email preferences" 
ON public.user_email_preferences FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own email preferences" 
ON public.user_email_preferences FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- =============================================
-- SEED DATA: Achievements
-- =============================================
INSERT INTO public.achievements (key, name, description, icon, category, xp_reward, requirement_type, requirement_value) VALUES
-- Streak Achievements
('streak_3', '3-Tage-Streak', 'Sei 3 Tage hintereinander aktiv', '🔥', 'streak', 50, 'streak', 3),
('streak_7', 'Wochenkrieger', 'Sei 7 Tage hintereinander aktiv', '💪', 'streak', 100, 'streak', 7),
('streak_14', 'Zwei-Wochen-Champion', '14 Tage Streak erreicht', '⚡', 'streak', 200, 'streak', 14),
('streak_30', 'Monatsmeister', '30 Tage Streak erreicht', '👑', 'streak', 500, 'streak', 30),

-- Analysis Achievements
('first_analysis', 'Erste Schritte', 'Schließe deine erste Analyse ab', '📸', 'analysis', 50, 'analyses', 1),
('analysis_5', 'Auf dem Weg', '5 Analysen abgeschlossen', '📊', 'analysis', 100, 'analyses', 5),
('analysis_10', 'Datensammler', '10 Analysen abgeschlossen', '📈', 'analysis', 200, 'analyses', 10),
('analysis_25', 'Analyse-Profi', '25 Analysen abgeschlossen', '🎯', 'analysis', 500, 'analyses', 25),

-- Score Improvements
('first_improvement', 'Erste Verbesserung', 'Verbessere deinen Score zum ersten Mal', '⬆️', 'improvement', 100, 'improvement', 1),
('improvement_1', '+1 Punkt', 'Erreiche eine Verbesserung von 1 Punkt', '🌟', 'improvement', 200, 'score_gain', 10),
('improvement_2', '+2 Punkte', 'Erreiche eine Verbesserung von 2 Punkten', '💫', 'improvement', 400, 'score_gain', 20),

-- Level Achievements
('level_5', 'Aufsteiger', 'Erreiche Level 5', '🎖️', 'level', 100, 'level', 5),
('level_10', 'Veteran', 'Erreiche Level 10', '🏅', 'level', 250, 'level', 10),
('level_25', 'Elite', 'Erreiche Level 25', '🏆', 'level', 500, 'level', 25),

-- Task Achievements
('tasks_10', 'Produktiv', '10 Tasks abgeschlossen', '✅', 'tasks', 100, 'tasks', 10),
('tasks_50', 'Fleißig', '50 Tasks abgeschlossen', '🔧', 'tasks', 300, 'tasks', 50),
('tasks_100', 'Unaufhaltsam', '100 Tasks abgeschlossen', '💎', 'tasks', 500, 'tasks', 100);

-- =============================================
-- SEED DATA: Daily Challenges
-- =============================================
INSERT INTO public.daily_challenges (title, description, icon, category, xp_reward, difficulty) VALUES
-- Skincare
('Trink 2L Wasser', 'Halte deine Haut von innen hydratisiert', '💧', 'skincare', 20, 'easy'),
('Sonnenschutz auftragen', 'Schütze deine Haut vor UV-Strahlen', '☀️', 'skincare', 15, 'easy'),
('Gesichtsmassage 5 Min', 'Fördere die Durchblutung mit einer Massage', '👐', 'skincare', 25, 'medium'),
('Doppelte Reinigung', 'Reinige dein Gesicht gründlich mit Ölreiniger und Waschgel', '🧴', 'skincare', 20, 'easy'),
('Vitamin C Serum', 'Verwende ein antioxidatives Serum', '🍊', 'skincare', 15, 'easy'),

-- Fitness
('10 Liegestütze', 'Stärke deinen Oberkörper', '💪', 'fitness', 25, 'medium'),
('Neck Curls', '3 Sätze Neck Curls für einen stärkeren Nacken', '🦒', 'fitness', 30, 'medium'),
('Mewing 10 Min', 'Halte die richtige Zungenposition', '👅', 'fitness', 20, 'easy'),
('Gesichtsyoga', '5 Minuten Gesichtsübungen', '🧘', 'fitness', 25, 'medium'),

-- Lifestyle
('8 Stunden Schlaf', 'Bekomme ausreichend erholsamen Schlaf', '😴', 'lifestyle', 30, 'medium'),
('Kein Zucker heute', 'Verzichte einen Tag auf Zucker', '🚫', 'lifestyle', 35, 'hard'),
('Selfie-Check', 'Mache ein Foto um deinen Fortschritt zu tracken', '📱', 'lifestyle', 15, 'easy'),
('Positive Affirmation', 'Sage dir 3 positive Dinge über dich', '🌟', 'lifestyle', 10, 'easy'),

-- Haare
('Kopfhautmassage', '5 Minuten Kopfhautmassage für besseres Haarwachstum', '💆', 'hair', 20, 'easy'),
('Haarpflege-Routine', 'Verwende Conditioner und lass ihn einwirken', '✨', 'hair', 15, 'easy');

-- =============================================
-- SEED DATA: Product Recommendations
-- =============================================
INSERT INTO public.product_recommendations (name, brand, category, description, target_issues, skin_types, price_range, rating) VALUES
('Niacinamid 10% + Zink 1%', 'The Ordinary', 'serum', 'Reduziert Poren und kontrolliert Talgproduktion', ARRAY['large_pores', 'oily_skin', 'acne'], ARRAY['oily', 'combination'], 'budget', 4.7),
('Retinol 0.5% in Squalane', 'The Ordinary', 'treatment', 'Anti-Aging und Hautstruktur-Verbesserung', ARRAY['fine_lines', 'uneven_texture', 'acne'], ARRAY['all'], 'budget', 4.5),
('Salicylic Acid 2% Solution', 'The Ordinary', 'exfoliant', 'BHA für verstopfte Poren und Akne', ARRAY['acne', 'blackheads', 'oily_skin'], ARRAY['oily', 'combination'], 'budget', 4.6),
('Vitamin C Suspension 23%', 'The Ordinary', 'serum', 'Hochdosiertes Vitamin C für strahlende Haut', ARRAY['dark_spots', 'dull_skin', 'uneven_tone'], ARRAY['all'], 'budget', 4.4),
('Hyaluronic Acid 2% + B5', 'The Ordinary', 'serum', 'Intensive Hydratation für alle Hauttypen', ARRAY['dry_skin', 'dehydration', 'fine_lines'], ARRAY['all'], 'budget', 4.8),
('Minoxidil 5%', 'Regaine', 'hair', 'Klinisch bewiesene Formel für Haarwachstum', ARRAY['hair_loss', 'thin_hair'], ARRAY['all'], 'medium', 4.3),
('Dermaroller 0.5mm', 'ZGTS', 'tool', 'Microneedling für bessere Produktaufnahme', ARRAY['acne_scars', 'uneven_texture', 'fine_lines'], ARRAY['all'], 'budget', 4.2),
('SPF 50 Sonnencreme', 'La Roche-Posay', 'sunscreen', 'Leichte UV-Schutz ohne weißen Film', ARRAY['sun_damage', 'dark_spots', 'aging'], ARRAY['all'], 'medium', 4.9);

-- =============================================
-- FUNCTION: Add XP to user
-- =============================================
CREATE OR REPLACE FUNCTION public.add_user_xp(p_user_id UUID, p_xp_amount INTEGER, p_reason TEXT DEFAULT 'activity')
RETURNS TABLE(new_xp INTEGER, new_level INTEGER, leveled_up BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_current_xp INTEGER;
  v_current_level INTEGER;
  v_new_level INTEGER;
  v_xp_for_next_level INTEGER;
BEGIN
  -- Security: Verify caller is the user or is an internal call
  IF p_user_id != auth.uid() AND auth.uid() IS NOT NULL THEN
    RAISE EXCEPTION 'Unauthorized: Cannot add XP to other users';
  END IF;

  -- Get or create user XP record
  INSERT INTO public.user_xp (user_id, current_xp, total_xp, level)
  VALUES (p_user_id, p_xp_amount, p_xp_amount, 1)
  ON CONFLICT (user_id) DO UPDATE
  SET 
    current_xp = user_xp.current_xp + p_xp_amount,
    total_xp = user_xp.total_xp + p_xp_amount,
    updated_at = now()
  RETURNING current_xp, level INTO v_current_xp, v_current_level;
  
  -- Calculate new level (100 XP per level, exponential growth)
  v_new_level := 1 + FLOOR(POWER(v_current_xp / 100.0, 0.8))::INTEGER;
  v_new_level := GREATEST(v_new_level, 1);
  
  -- Update level if changed
  IF v_new_level > v_current_level THEN
    UPDATE public.user_xp
    SET level = v_new_level, updated_at = now()
    WHERE user_id = p_user_id;
  END IF;
  
  RETURN QUERY SELECT v_current_xp, v_new_level, (v_new_level > v_current_level);
END;
$$;

-- =============================================
-- FUNCTION: Get daily challenges for user
-- =============================================
CREATE OR REPLACE FUNCTION public.get_daily_challenges(p_user_id UUID)
RETURNS TABLE(
  challenge_id UUID,
  title TEXT,
  description TEXT,
  icon TEXT,
  category TEXT,
  xp_reward INTEGER,
  difficulty TEXT,
  completed BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_today DATE := CURRENT_DATE;
  v_seed INTEGER;
  v_challenge_ids UUID[];
BEGIN
  -- Generate deterministic seed from date for consistent daily challenges
  v_seed := EXTRACT(DOY FROM v_today)::INTEGER + EXTRACT(YEAR FROM v_today)::INTEGER;
  
  -- Get 3 random challenges based on date seed
  SELECT ARRAY_AGG(id ORDER BY md5(id::text || v_seed::text)) INTO v_challenge_ids
  FROM (
    SELECT id FROM public.daily_challenges 
    WHERE is_active = true
    ORDER BY md5(id::text || v_seed::text)
    LIMIT 3
  ) sub;
  
  -- Ensure user has progress records for today
  INSERT INTO public.user_challenge_progress (user_id, challenge_id, assigned_date)
  SELECT p_user_id, unnest(v_challenge_ids), v_today
  ON CONFLICT (user_id, challenge_id, assigned_date) DO NOTHING;
  
  -- Return challenges with completion status
  RETURN QUERY
  SELECT 
    dc.id,
    dc.title,
    dc.description,
    dc.icon,
    dc.category,
    dc.xp_reward,
    dc.difficulty,
    COALESCE(ucp.completed, false)
  FROM public.daily_challenges dc
  JOIN public.user_challenge_progress ucp ON dc.id = ucp.challenge_id
  WHERE ucp.user_id = p_user_id 
    AND ucp.assigned_date = v_today
    AND dc.id = ANY(v_challenge_ids);
END;
$$;

-- =============================================
-- FUNCTION: Complete a challenge
-- =============================================
CREATE OR REPLACE FUNCTION public.complete_challenge(p_user_id UUID, p_challenge_id UUID)
RETURNS TABLE(success BOOLEAN, xp_earned INTEGER, message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_xp_reward INTEGER;
  v_already_completed BOOLEAN;
BEGIN
  -- Security check
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  
  -- Check if already completed today
  SELECT completed INTO v_already_completed
  FROM public.user_challenge_progress
  WHERE user_id = p_user_id 
    AND challenge_id = p_challenge_id 
    AND assigned_date = CURRENT_DATE;
  
  IF v_already_completed THEN
    RETURN QUERY SELECT false, 0, 'Challenge bereits abgeschlossen';
    RETURN;
  END IF;
  
  -- Get XP reward
  SELECT xp_reward INTO v_xp_reward
  FROM public.daily_challenges
  WHERE id = p_challenge_id;
  
  IF v_xp_reward IS NULL THEN
    RETURN QUERY SELECT false, 0, 'Challenge nicht gefunden';
    RETURN;
  END IF;
  
  -- Mark as completed
  UPDATE public.user_challenge_progress
  SET completed = true, completed_at = now()
  WHERE user_id = p_user_id 
    AND challenge_id = p_challenge_id 
    AND assigned_date = CURRENT_DATE;
  
  -- Add XP
  PERFORM public.add_user_xp(p_user_id, v_xp_reward, 'challenge');
  
  RETURN QUERY SELECT true, v_xp_reward, 'Challenge abgeschlossen! +' || v_xp_reward || ' XP';
END;
$$;

-- Trigger for updated_at
CREATE TRIGGER update_user_xp_updated_at
BEFORE UPDATE ON public.user_xp
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_email_prefs_updated_at
BEFORE UPDATE ON public.user_email_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();