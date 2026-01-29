import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export interface Activity {
  id: string;
  user_id: string;
  entry_date: string;
  steps: number;
  active_calories: number;
  distance_km: number;
  activity_type: string;
  duration_minutes: number;
  notes: string | null;
  created_at: string;
}

const ACTIVITY_TYPES = [
  { value: "walking", label: "Gehen", icon: "🚶", caloriesPerMin: 4 },
  { value: "running", label: "Laufen", icon: "🏃", caloriesPerMin: 10 },
  { value: "cycling", label: "Radfahren", icon: "🚴", caloriesPerMin: 7 },
  { value: "swimming", label: "Schwimmen", icon: "🏊", caloriesPerMin: 8 },
  { value: "strength", label: "Krafttraining", icon: "💪", caloriesPerMin: 5 },
  { value: "yoga", label: "Yoga", icon: "🧘", caloriesPerMin: 3 },
  { value: "hiit", label: "HIIT", icon: "🔥", caloriesPerMin: 12 },
  { value: "sports", label: "Sport", icon: "⚽", caloriesPerMin: 8 },
  { value: "other", label: "Sonstiges", icon: "🎯", caloriesPerMin: 5 },
];

export function useActivities() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [todayActivities, setTodayActivities] = useState<Activity[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  const today = format(new Date(), "yyyy-MM-dd");

  const fetchTodayActivities = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("activities")
        .select("*")
        .eq("user_id", user.id)
        .eq("entry_date", today)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTodayActivities(data || []);
    } catch (error) {
      console.error("Error fetching today's activities:", error);
    }
  }, [user, today]);

  const fetchActivities = useCallback(async (limit = 30) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("activities")
        .select("*")
        .eq("user_id", user.id)
        .order("entry_date", { ascending: false })
        .limit(limit);

      if (error) throw error;
      setActivities(data || []);
    } catch (error) {
      console.error("Error fetching activities:", error);
    }
  }, [user]);

  const addActivity = async (activity: Omit<Activity, "id" | "user_id" | "created_at">) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from("activities")
        .insert({
          user_id: user.id,
          ...activity
        })
        .select()
        .single();

      if (error) throw error;
      
      await fetchTodayActivities();
      toast({ title: "Aktivität hinzugefügt ✓" });
      return data;
    } catch (error) {
      console.error("Error adding activity:", error);
      toast({
        title: "Fehler",
        description: "Aktivität konnte nicht hinzugefügt werden.",
        variant: "destructive"
      });
      return null;
    }
  };

  const updateSteps = async (steps: number) => {
    if (!user) return false;

    try {
      // Find existing steps entry for today
      const existing = todayActivities.find(a => a.activity_type === "walking" && a.steps > 0);
      
      if (existing) {
        const { error } = await supabase
          .from("activities")
          .update({ steps, active_calories: Math.round(steps * 0.04) })
          .eq("id", existing.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("activities")
          .insert({
            user_id: user.id,
            entry_date: today,
            steps,
            active_calories: Math.round(steps * 0.04),
            activity_type: "walking"
          });
        
        if (error) throw error;
      }
      
      await fetchTodayActivities();
      toast({ title: "Schritte aktualisiert ✓" });
      return true;
    } catch (error) {
      console.error("Error updating steps:", error);
      toast({
        title: "Fehler",
        description: "Schritte konnten nicht gespeichert werden.",
        variant: "destructive"
      });
      return false;
    }
  };

  const deleteActivity = async (id: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from("activities")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;
      
      await fetchTodayActivities();
      toast({ title: "Aktivität gelöscht ✓" });
      return true;
    } catch (error) {
      console.error("Error deleting activity:", error);
      toast({
        title: "Fehler",
        description: "Aktivität konnte nicht gelöscht werden.",
        variant: "destructive"
      });
      return false;
    }
  };

  // Calculate daily totals
  const dailyTotals = {
    steps: todayActivities.reduce((sum, a) => sum + (a.steps || 0), 0),
    calories: todayActivities.reduce((sum, a) => sum + (a.active_calories || 0), 0),
    distance: todayActivities.reduce((sum, a) => sum + Number(a.distance_km || 0), 0),
    duration: todayActivities.reduce((sum, a) => sum + (a.duration_minutes || 0), 0),
  };

  useEffect(() => {
    const init = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      await Promise.all([fetchTodayActivities(), fetchActivities()]);
      setLoading(false);
    };

    init();
  }, [user, fetchTodayActivities, fetchActivities]);

  return {
    todayActivities,
    activities,
    dailyTotals,
    loading,
    activityTypes: ACTIVITY_TYPES,
    addActivity,
    updateSteps,
    deleteActivity,
    refetch: async () => {
      await Promise.all([fetchTodayActivities(), fetchActivities()]);
    }
  };
}
