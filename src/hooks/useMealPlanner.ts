import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { format, startOfWeek, addDays } from "date-fns";

export interface MealPlan {
  id: string;
  plan_date: string;
  meal_type: "breakfast" | "lunch" | "dinner" | "snack";
  recipe_id: string | null;
  custom_meal_name: string | null;
  notes: string | null;
  recipe?: {
    id: string;
    name: string;
    calories_per_serving: number | null;
    image_url: string | null;
  };
}

export function useMealPlanner() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [weekPlans, setWeekPlans] = useState<MealPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWeekStart, setSelectedWeekStart] = useState(() => 
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );

  const fetchWeekPlans = useCallback(async () => {
    if (!user) return;

    try {
      const weekEnd = addDays(selectedWeekStart, 6);

      const { data, error } = await supabase
        .from("meal_plans")
        .select(`
          *,
          recipe:recipes(id, name, calories_per_serving, image_url)
        `)
        .eq("user_id", user.id)
        .gte("plan_date", format(selectedWeekStart, "yyyy-MM-dd"))
        .lte("plan_date", format(weekEnd, "yyyy-MM-dd"))
        .order("plan_date");

      if (error) throw error;
      setWeekPlans(data || []);
    } catch (error) {
      console.error("Error fetching meal plans:", error);
    }
  }, [user, selectedWeekStart]);

  const addMealPlan = useCallback(async (
    planDate: Date,
    mealType: MealPlan["meal_type"],
    recipeId?: string,
    customMealName?: string,
    notes?: string
  ) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from("meal_plans")
        .upsert({
          user_id: user.id,
          plan_date: format(planDate, "yyyy-MM-dd"),
          meal_type: mealType,
          recipe_id: recipeId || null,
          custom_meal_name: customMealName || null,
          notes: notes || null
        });

      if (error) throw error;

      await fetchWeekPlans();
      toast({
        title: "Mahlzeit geplant ✓"
      });
      return true;
    } catch (error) {
      console.error("Error adding meal plan:", error);
      toast({
        title: "Fehler",
        description: "Mahlzeit konnte nicht geplant werden.",
        variant: "destructive"
      });
      return false;
    }
  }, [user, fetchWeekPlans, toast]);

  const removeMealPlan = useCallback(async (planId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from("meal_plans")
        .delete()
        .eq("id", planId)
        .eq("user_id", user.id);

      if (error) throw error;

      await fetchWeekPlans();
      toast({
        title: "Mahlzeit entfernt"
      });
      return true;
    } catch (error) {
      console.error("Error removing meal plan:", error);
      return false;
    }
  }, [user, fetchWeekPlans, toast]);

  const getMealsForDate = useCallback((date: Date, mealType?: MealPlan["meal_type"]) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return weekPlans.filter(p => 
      p.plan_date === dateStr && (!mealType || p.meal_type === mealType)
    );
  }, [weekPlans]);

  const goToNextWeek = useCallback(() => {
    setSelectedWeekStart(prev => addDays(prev, 7));
  }, []);

  const goToPrevWeek = useCallback(() => {
    setSelectedWeekStart(prev => addDays(prev, -7));
  }, []);

  useEffect(() => {
    const init = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      await fetchWeekPlans();
      setLoading(false);
    };

    init();
  }, [user, fetchWeekPlans]);

  return {
    weekPlans,
    loading,
    selectedWeekStart,
    addMealPlan,
    removeMealPlan,
    getMealsForDate,
    goToNextWeek,
    goToPrevWeek,
    refetch: fetchWeekPlans
  };
}
