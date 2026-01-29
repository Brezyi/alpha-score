import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface MotivationTip {
  id: string;
  category: string;
  tip_text: string;
}

export function useMotivation() {
  const { user } = useAuth();
  const [todayTip, setTodayTip] = useState<MotivationTip | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchRandomTip = useCallback(async () => {
    try {
      // Get all active tips
      const { data: tips, error } = await supabase
        .from("motivation_tips")
        .select("*")
        .eq("is_active", true);

      if (error) throw error;
      if (!tips || tips.length === 0) return null;

      // Pick a random tip based on today's date (consistent for the day)
      const today = new Date().toISOString().split('T')[0];
      const seed = today.split('-').reduce((a, b) => a + parseInt(b), 0);
      const index = seed % tips.length;
      
      setTodayTip(tips[index]);
      return tips[index];
    } catch (error) {
      console.error("Error fetching motivation tip:", error);
      return null;
    }
  }, []);

  const getTipsByCategory = useCallback(async (category: string) => {
    try {
      const { data, error } = await supabase
        .from("motivation_tips")
        .select("*")
        .eq("category", category)
        .eq("is_active", true);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching tips by category:", error);
      return [];
    }
  }, []);

  const logTipViewed = useCallback(async (tipId: string) => {
    if (!user) return;

    try {
      await supabase
        .from("user_motivation_logs")
        .insert({
          user_id: user.id,
          tip_id: tipId
        });
    } catch (error) {
      console.error("Error logging tip view:", error);
    }
  }, [user]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchRandomTip();
      setLoading(false);
    };

    init();
  }, [fetchRandomTip]);

  return {
    todayTip,
    loading,
    fetchRandomTip,
    getTipsByCategory,
    logTipViewed
  };
}
