-- Create activities table for step tracking and workouts
CREATE TABLE public.activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  steps INTEGER DEFAULT 0,
  active_calories INTEGER DEFAULT 0,
  distance_km DECIMAL(10,2) DEFAULT 0,
  activity_type TEXT DEFAULT 'walking',
  duration_minutes INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create mood_entries table for mood and symptom tracking
CREATE TABLE public.mood_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  mood_score INTEGER CHECK (mood_score >= 1 AND mood_score <= 5),
  energy_level INTEGER CHECK (energy_level >= 1 AND energy_level <= 5),
  stress_level INTEGER CHECK (stress_level >= 1 AND stress_level <= 5),
  symptoms TEXT[] DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, entry_date)
);

-- Create recipes table for recipe database
CREATE TABLE public.recipes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'main',
  cuisine TEXT,
  prep_time_minutes INTEGER,
  cook_time_minutes INTEGER,
  servings INTEGER DEFAULT 1,
  difficulty TEXT DEFAULT 'medium',
  calories_per_serving INTEGER,
  protein_g DECIMAL(10,2),
  carbs_g DECIMAL(10,2),
  fat_g DECIMAL(10,2),
  fiber_g DECIMAL(10,2),
  ingredients JSONB DEFAULT '[]',
  instructions TEXT[] DEFAULT '{}',
  image_url TEXT,
  is_system BOOLEAN DEFAULT false,
  created_by UUID,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create saved_recipes table for user favorites
CREATE TABLE public.saved_recipes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  saved_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, recipe_id)
);

-- Create grocery_lists table
CREATE TABLE public.grocery_lists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL DEFAULT 'Einkaufsliste',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create grocery_items table
CREATE TABLE public.grocery_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  list_id UUID NOT NULL REFERENCES public.grocery_lists(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  item_name TEXT NOT NULL,
  quantity DECIMAL(10,2) DEFAULT 1,
  unit TEXT,
  category TEXT DEFAULT 'other',
  is_checked BOOLEAN DEFAULT false,
  recipe_id UUID REFERENCES public.recipes(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create health_connections table for app integrations
CREATE TABLE public.health_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  provider TEXT NOT NULL,
  is_connected BOOLEAN DEFAULT false,
  access_token_encrypted TEXT,
  refresh_token_encrypted TEXT,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  sync_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, provider)
);

-- Create calorie_adjustments for weekend/custom days
CREATE TABLE public.calorie_adjustments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6),
  calorie_adjustment INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, day_of_week)
);

-- Enable RLS on all tables
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mood_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grocery_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grocery_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calorie_adjustments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for activities
CREATE POLICY "Users can view their own activities" ON public.activities FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own activities" ON public.activities FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own activities" ON public.activities FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own activities" ON public.activities FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for mood_entries
CREATE POLICY "Users can view their own mood entries" ON public.mood_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own mood entries" ON public.mood_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own mood entries" ON public.mood_entries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own mood entries" ON public.mood_entries FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for recipes (system recipes are public, user recipes are private)
CREATE POLICY "Anyone can view system recipes" ON public.recipes FOR SELECT USING (is_system = true OR auth.uid() = created_by);
CREATE POLICY "Users can create their own recipes" ON public.recipes FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update their own recipes" ON public.recipes FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Users can delete their own recipes" ON public.recipes FOR DELETE USING (auth.uid() = created_by);

-- RLS Policies for saved_recipes
CREATE POLICY "Users can view their saved recipes" ON public.saved_recipes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can save recipes" ON public.saved_recipes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove saved recipes" ON public.saved_recipes FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for grocery_lists
CREATE POLICY "Users can view their own lists" ON public.grocery_lists FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own lists" ON public.grocery_lists FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own lists" ON public.grocery_lists FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own lists" ON public.grocery_lists FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for grocery_items
CREATE POLICY "Users can view their own items" ON public.grocery_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own items" ON public.grocery_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own items" ON public.grocery_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own items" ON public.grocery_items FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for health_connections
CREATE POLICY "Users can view their own connections" ON public.health_connections FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own connections" ON public.health_connections FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own connections" ON public.health_connections FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own connections" ON public.health_connections FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for calorie_adjustments
CREATE POLICY "Users can view their own adjustments" ON public.calorie_adjustments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own adjustments" ON public.calorie_adjustments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own adjustments" ON public.calorie_adjustments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own adjustments" ON public.calorie_adjustments FOR DELETE USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_activities_user_date ON public.activities(user_id, entry_date);
CREATE INDEX idx_mood_entries_user_date ON public.mood_entries(user_id, entry_date);
CREATE INDEX idx_recipes_category ON public.recipes(category);
CREATE INDEX idx_recipes_system ON public.recipes(is_system);
CREATE INDEX idx_saved_recipes_user ON public.saved_recipes(user_id);
CREATE INDEX idx_grocery_items_list ON public.grocery_items(list_id);
CREATE INDEX idx_health_connections_user ON public.health_connections(user_id);

-- Insert sample system recipes
INSERT INTO public.recipes (name, description, category, cuisine, prep_time_minutes, cook_time_minutes, servings, difficulty, calories_per_serving, protein_g, carbs_g, fat_g, fiber_g, ingredients, instructions, is_system, tags) VALUES
('Griechischer Salat', 'Frischer mediterraner Salat mit Feta', 'salad', 'Griechisch', 15, 0, 2, 'easy', 285, 8, 12, 22, 4, '[{"name": "Tomaten", "amount": "4", "unit": "Stück"}, {"name": "Gurke", "amount": "1", "unit": "Stück"}, {"name": "Feta", "amount": "150", "unit": "g"}, {"name": "Oliven", "amount": "100", "unit": "g"}, {"name": "Olivenöl", "amount": "3", "unit": "EL"}]', ARRAY['Gemüse waschen und schneiden', 'Feta würfeln', 'Alles in einer Schüssel mischen', 'Mit Olivenöl beträufeln'], true, ARRAY['vegetarisch', 'low-carb', 'schnell']),
('Protein Pancakes', 'Fitness Pancakes mit extra Protein', 'breakfast', 'International', 5, 10, 2, 'easy', 320, 28, 35, 8, 3, '[{"name": "Haferflocken", "amount": "80", "unit": "g"}, {"name": "Proteinpulver", "amount": "30", "unit": "g"}, {"name": "Eier", "amount": "2", "unit": "Stück"}, {"name": "Milch", "amount": "100", "unit": "ml"}, {"name": "Banane", "amount": "1", "unit": "Stück"}]', ARRAY['Alle Zutaten in Mixer geben', 'Zu glattem Teig pürieren', 'In beschichteter Pfanne braten', 'Mit Früchten servieren'], true, ARRAY['proteinreich', 'fitness', 'frühstück']),
('Hähnchen Bowl', 'Gesunde Buddha Bowl mit Hähnchen', 'main', 'Asiatisch', 15, 20, 1, 'medium', 480, 42, 38, 16, 6, '[{"name": "Hähnchenfilet", "amount": "150", "unit": "g"}, {"name": "Quinoa", "amount": "80", "unit": "g"}, {"name": "Brokkoli", "amount": "100", "unit": "g"}, {"name": "Avocado", "amount": "0.5", "unit": "Stück"}, {"name": "Edamame", "amount": "50", "unit": "g"}]', ARRAY['Quinoa nach Packungsanweisung kochen', 'Hähnchen würzen und braten', 'Brokkoli dämpfen', 'Alle Zutaten in Bowl anrichten'], true, ARRAY['proteinreich', 'meal-prep', 'gesund']),
('Overnight Oats', 'Cremige Haferflocken zum Vorbereiten', 'breakfast', 'International', 5, 0, 1, 'easy', 350, 12, 52, 10, 7, '[{"name": "Haferflocken", "amount": "60", "unit": "g"}, {"name": "Joghurt", "amount": "100", "unit": "g"}, {"name": "Milch", "amount": "100", "unit": "ml"}, {"name": "Chiasamen", "amount": "1", "unit": "EL"}, {"name": "Beeren", "amount": "50", "unit": "g"}]', ARRAY['Haferflocken mit Joghurt und Milch mischen', 'Chiasamen hinzufügen', 'Über Nacht im Kühlschrank ziehen lassen', 'Morgens mit Beeren toppen'], true, ARRAY['meal-prep', 'frühstück', 'vegetarisch']),
('Lachs mit Spargel', 'Gegrillter Lachs mit grünem Spargel', 'main', 'International', 10, 15, 1, 'medium', 420, 38, 8, 26, 3, '[{"name": "Lachsfilet", "amount": "180", "unit": "g"}, {"name": "Grüner Spargel", "amount": "200", "unit": "g"}, {"name": "Zitrone", "amount": "0.5", "unit": "Stück"}, {"name": "Olivenöl", "amount": "2", "unit": "EL"}, {"name": "Knoblauch", "amount": "2", "unit": "Zehen"}]', ARRAY['Backofen auf 200°C vorheizen', 'Lachs und Spargel mit Öl beträufeln', 'Mit Zitrone und Knoblauch würzen', '15 Minuten backen'], true, ARRAY['omega-3', 'low-carb', 'proteinreich']);