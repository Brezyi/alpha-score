import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { differenceInYears } from "date-fns";

export interface CalorieSettings {
  height_cm: number | null;
  current_weight_kg: number | null;
  target_weight_kg: number | null;
  birth_date: string | null;
  gender: "male" | "female" | "other" | null;
  activity_level: "sedentary" | "light" | "moderate" | "active" | "very_active";
  goal_type: "lose" | "maintain" | "gain";
  weekly_goal_kg: number;
  calculated_bmr: number | null;
  calculated_tdee: number | null;
  calculated_daily_calories: number | null;
}

const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9
};

export function useCalorieCalculator() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [settings, setSettings] = useState<CalorieSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("user_calorie_settings")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      
      if (data) {
        setSettings({
          height_cm: data.height_cm,
          current_weight_kg: data.current_weight_kg ? Number(data.current_weight_kg) : null,
          target_weight_kg: data.target_weight_kg ? Number(data.target_weight_kg) : null,
          birth_date: data.birth_date,
          gender: data.gender as CalorieSettings["gender"],
          activity_level: (data.activity_level || "moderate") as CalorieSettings["activity_level"],
          goal_type: (data.goal_type || "maintain") as CalorieSettings["goal_type"],
          weekly_goal_kg: data.weekly_goal_kg ? Number(data.weekly_goal_kg) : 0.5,
          calculated_bmr: data.calculated_bmr,
          calculated_tdee: data.calculated_tdee,
          calculated_daily_calories: data.calculated_daily_calories
        });
      }
    } catch (error) {
      console.error("Error fetching calorie settings:", error);
    }
  }, [user]);

  const calculateBMR = useCallback((
    gender: "male" | "female" | "other",
    weightKg: number,
    heightCm: number,
    age: number
  ): number => {
    // Mifflin-St Jeor Equation
    if (gender === "male") {
      return Math.round(10 * weightKg + 6.25 * heightCm - 5 * age + 5);
    } else {
      return Math.round(10 * weightKg + 6.25 * heightCm - 5 * age - 161);
    }
  }, []);

  const calculateTDEE = useCallback((bmr: number, activityLevel: CalorieSettings["activity_level"]): number => {
    return Math.round(bmr * ACTIVITY_MULTIPLIERS[activityLevel]);
  }, []);

  const calculateDailyCalories = useCallback((
    tdee: number,
    goalType: CalorieSettings["goal_type"],
    weeklyGoalKg: number
  ): number => {
    // 1 kg = ~7700 calories deficit/surplus
    const dailyAdjustment = (weeklyGoalKg * 7700) / 7;
    
    if (goalType === "lose") {
      return Math.round(Math.max(1200, tdee - dailyAdjustment));
    } else if (goalType === "gain") {
      return Math.round(tdee + dailyAdjustment);
    }
    return tdee;
  }, []);

  const saveSettings = useCallback(async (updates: Partial<CalorieSettings>) => {
    if (!user) return false;

    try {
      const newSettings = { ...settings, ...updates };
      
      // Recalculate if we have all required data
      let bmr = newSettings.calculated_bmr;
      let tdee = newSettings.calculated_tdee;
      let dailyCals = newSettings.calculated_daily_calories;

      if (
        newSettings.gender &&
        newSettings.current_weight_kg &&
        newSettings.height_cm &&
        newSettings.birth_date
      ) {
        const age = differenceInYears(new Date(), new Date(newSettings.birth_date));
        bmr = calculateBMR(
          newSettings.gender as "male" | "female" | "other",
          newSettings.current_weight_kg,
          newSettings.height_cm,
          age
        );
        tdee = calculateTDEE(bmr, newSettings.activity_level || "moderate");
        dailyCals = calculateDailyCalories(
          tdee,
          newSettings.goal_type || "maintain",
          newSettings.weekly_goal_kg || 0.5
        );
      }

      const { error } = await supabase
        .from("user_calorie_settings")
        .upsert({
          user_id: user.id,
          ...newSettings,
          calculated_bmr: bmr,
          calculated_tdee: tdee,
          calculated_daily_calories: dailyCals,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      await fetchSettings();
      toast({
        title: "Einstellungen gespeichert ✓"
      });
      return true;
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "Fehler",
        description: "Einstellungen konnten nicht gespeichert werden.",
        variant: "destructive"
      });
      return false;
    }
  }, [user, settings, fetchSettings, toast, calculateBMR, calculateTDEE, calculateDailyCalories]);

  // Quick calculations without saving
  const quickCalculate = useCallback((
    gender: "male" | "female" | "other",
    weightKg: number,
    heightCm: number,
    age: number,
    activityLevel: CalorieSettings["activity_level"],
    goalType: CalorieSettings["goal_type"],
    weeklyGoalKg: number
  ) => {
    const bmr = calculateBMR(gender, weightKg, heightCm, age);
    const tdee = calculateTDEE(bmr, activityLevel);
    const dailyCalories = calculateDailyCalories(tdee, goalType, weeklyGoalKg);

    return { bmr, tdee, dailyCalories };
  }, [calculateBMR, calculateTDEE, calculateDailyCalories]);

  useEffect(() => {
    const init = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      await fetchSettings();
      setLoading(false);
    };

    init();
  }, [user, fetchSettings]);

  return {
    settings,
    loading,
    saveSettings,
    quickCalculate,
    refetch: fetchSettings
  };
}
