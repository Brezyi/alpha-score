import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export interface MealEntry {
  id: string;
  user_id: string;
  entry_date: string;
  meal_type: "breakfast" | "lunch" | "dinner" | "snack";
  food_name: string;
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  fiber_g: number | null;
  barcode: string | null;
  serving_size: string | null;
  notes: string | null;
  created_at: string;
}

export interface NutritionGoals {
  daily_calories: number;
  daily_protein_g: number;
  daily_carbs_g: number;
  daily_fat_g: number;
  daily_fiber_g: number;
}

export interface DailyTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

const DEFAULT_GOALS: NutritionGoals = {
  daily_calories: 2000,
  daily_protein_g: 100,
  daily_carbs_g: 250,
  daily_fat_g: 65,
  daily_fiber_g: 30,
};

export function useNutrition() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [meals, setMeals] = useState<MealEntry[]>([]);
  const [goals, setGoals] = useState<NutritionGoals>(DEFAULT_GOALS);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const dateStr = format(selectedDate, "yyyy-MM-dd");

  const fetchMeals = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("meal_entries")
        .select("*")
        .eq("user_id", user.id)
        .eq("entry_date", dateStr)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMeals((data as MealEntry[]) || []);
    } catch (error) {
      console.error("Error fetching meals:", error);
    }
  }, [user, dateStr]);

  const fetchGoals = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("nutrition_goals")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      if (data) {
        setGoals({
          daily_calories: data.daily_calories ?? DEFAULT_GOALS.daily_calories,
          daily_protein_g: data.daily_protein_g ?? DEFAULT_GOALS.daily_protein_g,
          daily_carbs_g: data.daily_carbs_g ?? DEFAULT_GOALS.daily_carbs_g,
          daily_fat_g: data.daily_fat_g ?? DEFAULT_GOALS.daily_fat_g,
          daily_fiber_g: data.daily_fiber_g ?? DEFAULT_GOALS.daily_fiber_g,
        });
      }
    } catch (error) {
      console.error("Error fetching goals:", error);
    }
  }, [user]);

  const addMeal = async (meal: Omit<MealEntry, "id" | "user_id" | "created_at">) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from("meal_entries")
        .insert({
          user_id: user.id,
          entry_date: meal.entry_date,
          meal_type: meal.meal_type,
          food_name: meal.food_name,
          calories: meal.calories,
          protein_g: meal.protein_g,
          carbs_g: meal.carbs_g,
          fat_g: meal.fat_g,
          fiber_g: meal.fiber_g,
          barcode: meal.barcode,
          serving_size: meal.serving_size,
          notes: meal.notes,
        })
        .select()
        .single();

      if (error) throw error;

      await fetchMeals();
      toast({ title: "Mahlzeit hinzugefügt ✓" });
      return data;
    } catch (error) {
      console.error("Error adding meal:", error);
      toast({
        title: "Fehler",
        description: "Mahlzeit konnte nicht hinzugefügt werden.",
        variant: "destructive",
      });
      return null;
    }
  };

  const deleteMeal = async (mealId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from("meal_entries")
        .delete()
        .eq("id", mealId)
        .eq("user_id", user.id);

      if (error) throw error;

      await fetchMeals();
      toast({ title: "Mahlzeit gelöscht ✓" });
      return true;
    } catch (error) {
      console.error("Error deleting meal:", error);
      return false;
    }
  };

  const updateGoals = async (newGoals: NutritionGoals) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from("nutrition_goals")
        .upsert({
          user_id: user.id,
          daily_calories: newGoals.daily_calories,
          daily_protein_g: newGoals.daily_protein_g,
          daily_carbs_g: newGoals.daily_carbs_g,
          daily_fat_g: newGoals.daily_fat_g,
          daily_fiber_g: newGoals.daily_fiber_g,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      setGoals(newGoals);
      toast({ title: "Ziele aktualisiert ✓" });
      return true;
    } catch (error) {
      console.error("Error updating goals:", error);
      return false;
    }
  };

  // Calculate daily totals
  const dailyTotals: DailyTotals = meals.reduce(
    (acc, meal) => ({
      calories: acc.calories + (meal.calories || 0),
      protein: acc.protein + (meal.protein_g || 0),
      carbs: acc.carbs + (meal.carbs_g || 0),
      fat: acc.fat + (meal.fat_g || 0),
      fiber: acc.fiber + (meal.fiber_g || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
  );

  // Get meals by type
  const getMealsByType = (type: MealEntry["meal_type"]) =>
    meals.filter((m) => m.meal_type === type);

  useEffect(() => {
    const init = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      setLoading(true);
      await Promise.all([fetchMeals(), fetchGoals()]);
      setLoading(false);
    };
    init();
  }, [user, fetchMeals, fetchGoals]);

  return {
    meals,
    goals,
    dailyTotals,
    loading,
    selectedDate,
    setSelectedDate,
    addMeal,
    deleteMeal,
    updateGoals,
    getMealsByType,
    refetch: fetchMeals,
  };
}
