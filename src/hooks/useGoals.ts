import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface UserGoal {
  id: string;
  user_id: string;
  target_score: number;
  category: string | null;
  target_date: string | null;
  is_active: boolean;
  achieved_at: string | null;
  created_at: string;
}

export function useGoals() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [goals, setGoals] = useState<UserGoal[]>([]);
  const [activeGoal, setActiveGoal] = useState<UserGoal | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchGoals = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("user_goals")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      setGoals(data || []);
      setActiveGoal(data?.find(g => g.is_active && !g.achieved_at) || null);
    } catch (error) {
      console.error("Error fetching goals:", error);
    }
  }, [user]);

  const createGoal = async (targetScore: number, category?: string, targetDate?: string) => {
    if (!user) return null;

    try {
      // Deactivate existing active goals
      if (activeGoal) {
        await supabase
          .from("user_goals")
          .update({ is_active: false })
          .eq("id", activeGoal.id);
      }

      const { data, error } = await supabase
        .from("user_goals")
        .insert({
          user_id: user.id,
          target_score: targetScore,
          category: category || "overall",
          target_date: targetDate,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;

      await fetchGoals();
      toast({
        title: "Ziel gesetzt! 🎯",
        description: `Dein neues Ziel: ${targetScore.toFixed(1)} Score`
      });
      return data;
    } catch (error) {
      console.error("Error creating goal:", error);
      toast({
        title: "Fehler",
        description: "Ziel konnte nicht erstellt werden.",
        variant: "destructive"
      });
      return null;
    }
  };

  const checkGoalAchievement = async (currentScore: number) => {
    if (!user || !activeGoal) return false;

    if (currentScore >= activeGoal.target_score) {
      try {
        const { error } = await supabase
          .from("user_goals")
          .update({
            achieved_at: new Date().toISOString(),
            is_active: false
          })
          .eq("id", activeGoal.id);

        if (error) throw error;

        // Add XP for achieving goal
        await supabase.rpc("add_user_xp", {
          p_user_id: user.id,
          p_xp_amount: 200,
          p_reason: "Goal achieved"
        });

        toast({
          title: "🎉 Ziel erreicht!",
          description: `Du hast ${activeGoal.target_score.toFixed(1)} Score erreicht! +200 XP`
        });

        await fetchGoals();
        return true;
      } catch (error) {
        console.error("Error marking goal as achieved:", error);
      }
    }
    return false;
  };

  const deleteGoal = async (goalId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from("user_goals")
        .delete()
        .eq("id", goalId)
        .eq("user_id", user.id);

      if (error) throw error;

      await fetchGoals();
      toast({
        title: "Ziel gelöscht",
        description: "Das Ziel wurde entfernt."
      });
      return true;
    } catch (error) {
      console.error("Error deleting goal:", error);
      return false;
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchGoals();
      setLoading(false);
    };

    init();
  }, [fetchGoals]);

  return {
    goals,
    activeGoal,
    loading,
    createGoal,
    checkGoalAchievement,
    deleteGoal,
    refetch: fetchGoals
  };
}
