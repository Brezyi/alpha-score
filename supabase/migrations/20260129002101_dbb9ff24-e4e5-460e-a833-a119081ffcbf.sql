-- Fasting Tracking
CREATE TABLE public.fasting_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  fasting_type TEXT NOT NULL DEFAULT '16:8', -- 16:8, 18:6, 20:4, custom
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  target_end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  actual_end_time TIMESTAMP WITH TIME ZONE,
  is_completed BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.fasting_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own fasting sessions"
ON public.fasting_sessions FOR ALL
USING (auth.uid() = user_id);

-- Body Measurements
CREATE TABLE public.body_measurements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  measured_at DATE NOT NULL DEFAULT CURRENT_DATE,
  weight_kg DECIMAL(5,2),
  body_fat_percent DECIMAL(4,1),
  waist_cm DECIMAL(5,1),
  hip_cm DECIMAL(5,1),
  chest_cm DECIMAL(5,1),
  arm_cm DECIMAL(5,1),
  thigh_cm DECIMAL(5,1),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, measured_at)
);

ALTER TABLE public.body_measurements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own measurements"
ON public.body_measurements FOR ALL
USING (auth.uid() = user_id);

-- Nutrition / Meal Logging
CREATE TABLE public.meal_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  meal_type TEXT NOT NULL, -- breakfast, lunch, dinner, snack
  food_name TEXT NOT NULL,
  calories INTEGER,
  protein_g DECIMAL(5,1),
  carbs_g DECIMAL(5,1),
  fat_g DECIMAL(5,1),
  fiber_g DECIMAL(5,1),
  barcode TEXT,
  serving_size TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.meal_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own meals"
ON public.meal_entries FOR ALL
USING (auth.uid() = user_id);

-- Daily nutrition goals
CREATE TABLE public.nutrition_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  daily_calories INTEGER DEFAULT 2000,
  daily_protein_g INTEGER DEFAULT 100,
  daily_carbs_g INTEGER DEFAULT 250,
  daily_fat_g INTEGER DEFAULT 65,
  daily_fiber_g INTEGER DEFAULT 30,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.nutrition_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own nutrition goals"
ON public.nutrition_goals FOR ALL
USING (auth.uid() = user_id);

-- Add indexes for performance
CREATE INDEX idx_fasting_sessions_user_date ON public.fasting_sessions(user_id, start_time DESC);
CREATE INDEX idx_body_measurements_user_date ON public.body_measurements(user_id, measured_at DESC);
CREATE INDEX idx_meal_entries_user_date ON public.meal_entries(user_id, entry_date DESC);
CREATE INDEX idx_meal_entries_barcode ON public.meal_entries(barcode) WHERE barcode IS NOT NULL;