import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null;
  isActiveToday: boolean;
}

export const useStreak = () => {
  const { user } = useAuth();
  const [streak, setStreak] = useState<StreakData>({
    currentStreak: 0,
    longestStreak: 0,
    lastActivityDate: null,
    isActiveToday: false,
  });
  const [loading, setLoading] = useState(true);

  const fetchStreak = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("user_streaks")
        .select("current_streak, longest_streak, last_activity_date")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const today = new Date().toISOString().split("T")[0];
        const isActiveToday = data.last_activity_date === today;
        
        // Check if streak is still valid (activity yesterday or today)
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split("T")[0];
        
        const isStreakValid = 
          data.last_activity_date === today || 
          data.last_activity_date === yesterdayStr;

        setStreak({
          currentStreak: isStreakValid ? data.current_streak : 0,
          longestStreak: data.longest_streak,
          lastActivityDate: data.last_activity_date,
          isActiveToday,
        });
      } else {
        setStreak({
          currentStreak: 0,
          longestStreak: 0,
          lastActivityDate: null,
          isActiveToday: false,
        });
      }
    } catch (error) {
      console.error("Error fetching streak:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const recordActivity = useCallback(async () => {
    if (!user) return null;

    try {
      const { data, error } = await supabase.rpc("update_user_streak", {
        p_user_id: user.id,
      });

      if (error) throw error;

      if (data) {
        const today = new Date().toISOString().split("T")[0];
        setStreak({
          currentStreak: data.current_streak,
          longestStreak: data.longest_streak,
          lastActivityDate: data.last_activity_date,
          isActiveToday: data.last_activity_date === today,
        });
      }

      return data;
    } catch (error) {
      console.error("Error recording activity:", error);
      return null;
    }
  }, [user]);

  useEffect(() => {
    fetchStreak();
  }, [fetchStreak]);

  return {
    ...streak,
    loading,
    recordActivity,
    refetch: fetchStreak,
  };
};
