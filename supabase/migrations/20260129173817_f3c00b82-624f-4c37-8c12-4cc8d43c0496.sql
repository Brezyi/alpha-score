-- Meal Plans table for weekly meal planning
CREATE TABLE public.meal_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  plan_date DATE NOT NULL,
  meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  recipe_id UUID REFERENCES public.recipes(id) ON DELETE SET NULL,
  custom_meal_name TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, plan_date, meal_type)
);

-- Food database for searchable foods
CREATE TABLE public.food_database (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  brand TEXT,
  barcode TEXT,
  calories_per_100g INTEGER,
  protein_per_100g NUMERIC(6,2),
  carbs_per_100g NUMERIC(6,2),
  fat_per_100g NUMERIC(6,2),
  fiber_per_100g NUMERIC(6,2),
  serving_size_g INTEGER DEFAULT 100,
  category TEXT,
  is_verified BOOLEAN DEFAULT false,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- User water reminders
CREATE TABLE public.water_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  is_enabled BOOLEAN DEFAULT true,
  reminder_interval_hours INTEGER DEFAULT 2,
  start_time TIME DEFAULT '08:00',
  end_time TIME DEFAULT '22:00',
  daily_goal_liters NUMERIC(3,1) DEFAULT 2.5,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Water intake logs (more detailed than lifestyle_entries)
CREATE TABLE public.water_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  amount_ml INTEGER NOT NULL,
  logged_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Progress photos for before/after
CREATE TABLE public.progress_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  photo_url TEXT NOT NULL,
  photo_type TEXT CHECK (photo_type IN ('front', 'side', 'back')),
  weight_kg NUMERIC(5,2),
  notes TEXT,
  taken_at DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- User calorie settings (BMR calculation, goals)
CREATE TABLE public.user_calorie_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  height_cm INTEGER,
  current_weight_kg NUMERIC(5,2),
  target_weight_kg NUMERIC(5,2),
  birth_date DATE,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  activity_level TEXT DEFAULT 'moderate' CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'active', 'very_active')),
  goal_type TEXT DEFAULT 'maintain' CHECK (goal_type IN ('lose', 'maintain', 'gain')),
  weekly_goal_kg NUMERIC(3,2) DEFAULT 0.5,
  calculated_bmr INTEGER,
  calculated_tdee INTEGER,
  calculated_daily_calories INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Daily motivation tips
CREATE TABLE public.motivation_tips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT DEFAULT 'general',
  tip_text TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- User viewed tips (to avoid repeats)
CREATE TABLE public.user_motivation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  tip_id UUID REFERENCES public.motivation_tips(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_database ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.water_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.water_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_calorie_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.motivation_tips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_motivation_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for meal_plans
CREATE POLICY "Users can manage own meal plans" ON public.meal_plans
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for food_database (everyone can read, users can add)
CREATE POLICY "Everyone can read food database" ON public.food_database
  FOR SELECT USING (true);
CREATE POLICY "Users can add to food database" ON public.food_database
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- RLS Policies for water_reminders
CREATE POLICY "Users can manage own water reminders" ON public.water_reminders
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for water_logs
CREATE POLICY "Users can manage own water logs" ON public.water_logs
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for progress_photos
CREATE POLICY "Users can manage own progress photos" ON public.progress_photos
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for user_calorie_settings
CREATE POLICY "Users can manage own calorie settings" ON public.user_calorie_settings
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for motivation_tips (everyone can read)
CREATE POLICY "Everyone can read motivation tips" ON public.motivation_tips
  FOR SELECT USING (is_active = true);

-- RLS Policies for user_motivation_logs
CREATE POLICY "Users can manage own motivation logs" ON public.user_motivation_logs
  FOR ALL USING (auth.uid() = user_id);

-- Add some initial food database entries
INSERT INTO public.food_database (name, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, category, is_verified)
VALUES
  ('Hähnchenbrust', 165, 31, 0, 3.6, 'Fleisch', true),
  ('Reis (gekocht)', 130, 2.7, 28, 0.3, 'Beilagen', true),
  ('Brokkoli', 34, 2.8, 7, 0.4, 'Gemüse', true),
  ('Lachs', 208, 20, 0, 13, 'Fisch', true),
  ('Eier', 155, 13, 1.1, 11, 'Eier', true),
  ('Vollkornbrot', 247, 8.5, 41, 3.5, 'Brot', true),
  ('Banane', 89, 1.1, 23, 0.3, 'Obst', true),
  ('Apfel', 52, 0.3, 14, 0.2, 'Obst', true),
  ('Haferflocken', 389, 17, 66, 7, 'Frühstück', true),
  ('Griechischer Joghurt', 97, 9, 3.6, 5, 'Milchprodukte', true),
  ('Mandeln', 579, 21, 22, 50, 'Nüsse', true),
  ('Avocado', 160, 2, 9, 15, 'Gemüse', true),
  ('Kartoffeln (gekocht)', 77, 2, 17, 0.1, 'Beilagen', true),
  ('Thunfisch (Dose)', 116, 26, 0, 1, 'Fisch', true),
  ('Quinoa (gekocht)', 120, 4.4, 21, 1.9, 'Beilagen', true),
  ('Spinat', 23, 2.9, 3.6, 0.4, 'Gemüse', true),
  ('Magerquark', 67, 12, 4, 0.2, 'Milchprodukte', true),
  ('Olivenöl', 884, 0, 0, 100, 'Öle', true),
  ('Süßkartoffel', 86, 1.6, 20, 0.1, 'Gemüse', true),
  ('Hüttenkäse', 98, 11, 3.4, 4.3, 'Milchprodukte', true);

-- Add some initial motivation tips
INSERT INTO public.motivation_tips (category, tip_text)
VALUES
  ('nutrition', 'Trinke vor jeder Mahlzeit ein Glas Wasser – das hilft dir, weniger zu essen.'),
  ('nutrition', 'Iss langsam und kaue gründlich. Dein Gehirn braucht 20 Minuten, um Sättigung zu spüren.'),
  ('nutrition', 'Plane deine Mahlzeiten im Voraus – so vermeidest du spontane ungesunde Entscheidungen.'),
  ('fitness', 'Jeder Schritt zählt! Nimm öfter die Treppe statt den Aufzug.'),
  ('fitness', 'Schon 30 Minuten Bewegung täglich können dein Leben verändern.'),
  ('mindset', 'Fortschritt ist wichtiger als Perfektion. Feiere jeden kleinen Erfolg!'),
  ('mindset', 'Ein Rückschlag ist kein Scheitern – morgen ist ein neuer Tag.'),
  ('sleep', 'Guter Schlaf ist der Schlüssel zu erfolgreicher Gewichtsabnahme.'),
  ('hydration', 'Dein Körper besteht zu 60% aus Wasser. Halte ihn hydriert!'),
  ('general', 'Konsistenz schlägt Intensität. Bleib dran, auch wenn es langsam geht.');