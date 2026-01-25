import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { startOfWeek, endOfWeek, addDays } from "date-fns";

export interface WeeklyChallenge {
  id: string;
  title: string;
  description: string;
  category: string | null;
  difficulty: string | null;
  xp_reward: number | null;
  duration_days: number | null;
  icon: string | null;
  is_active: boolean;
}

export interface UserWeeklyChallenge {
  id: string;
  user_id: string;
  challenge_id: string | null;
  started_at: string;
  ends_at: string;
  progress: number | null;
  completed: boolean;
  completed_at: string | null;
  challenge?: WeeklyChallenge;
}

export function useWeeklyChallenges() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentChallenge, setCurrentChallenge] = useState<UserWeeklyChallenge | null>(null);
  const [availableChallenges, setAvailableChallenges] = useState<WeeklyChallenge[]>([]);
  const [completedChallenges, setCompletedChallenges] = useState<UserWeeklyChallenge[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAvailableChallenges = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("weekly_challenges")
        .select("*")
        .eq("is_active", true)
        .order("xp_reward", { ascending: false });

      if (error) throw error;
      setAvailableChallenges(data || []);
    } catch (error) {
      console.error("Error fetching weekly challenges:", error);
    }
  }, []);

  const fetchCurrentChallenge = useCallback(async () => {
    if (!user) return;

    try {
      const now = new Date().toISOString();
      
      const { data, error } = await supabase
        .from("user_weekly_challenges")
        .select(`
          *,
          challenge:weekly_challenges(*)
        `)
        .eq("user_id", user.id)
        .eq("completed", false)
        .gte("ends_at", now)
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setCurrentChallenge(data);
    } catch (error) {
      console.error("Error fetching current challenge:", error);
    }
  }, [user]);

  const fetchCompletedChallenges = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("user_weekly_challenges")
        .select(`
          *,
          challenge:weekly_challenges(*)
        `)
        .eq("user_id", user.id)
        .eq("completed", true)
        .order("completed_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      setCompletedChallenges(data || []);
    } catch (error) {
      console.error("Error fetching completed challenges:", error);
    }
  }, [user]);

  const startChallenge = async (challengeId: string) => {
    if (!user) return false;

    try {
      const challenge = availableChallenges.find(c => c.id === challengeId);
      if (!challenge) throw new Error("Challenge not found");

      const durationDays = challenge.duration_days || 7;
      const now = new Date();
      const endsAt = addDays(now, durationDays);

      const { error } = await supabase
        .from("user_weekly_challenges")
        .insert({
          user_id: user.id,
          challenge_id: challengeId,
          started_at: now.toISOString(),
          ends_at: endsAt.toISOString(),
          progress: 0,
          completed: false
        });

      if (error) throw error;

      await fetchCurrentChallenge();
      toast({
        title: "Challenge gestartet! 🎯",
        description: `Du hast ${durationDays} Tage Zeit für: ${challenge.title}`
      });
      return true;
    } catch (error) {
      console.error("Error starting challenge:", error);
      toast({
        title: "Fehler",
        description: "Challenge konnte nicht gestartet werden.",
        variant: "destructive"
      });
      return false;
    }
  };

  const updateProgress = async (progressIncrement: number) => {
    if (!user || !currentChallenge) return false;

    try {
      const newProgress = Math.min((currentChallenge.progress || 0) + progressIncrement, 100);
      const isCompleted = newProgress >= 100;

      const { error } = await supabase
        .from("user_weekly_challenges")
        .update({
          progress: newProgress,
          completed: isCompleted,
          completed_at: isCompleted ? new Date().toISOString() : null
        })
        .eq("id", currentChallenge.id);

      if (error) throw error;

      if (isCompleted) {
        const xpReward = currentChallenge.challenge?.xp_reward || 100;
        
        // Add XP via RPC
        await supabase.rpc("add_user_xp", {
          p_user_id: user.id,
          p_xp_amount: xpReward,
          p_reason: `Weekly Challenge: ${currentChallenge.challenge?.title}`
        });

        toast({
          title: "Challenge abgeschlossen! 🎉",
          description: `+${xpReward} XP verdient!`
        });
      }

      await Promise.all([fetchCurrentChallenge(), fetchCompletedChallenges()]);
      return true;
    } catch (error) {
      console.error("Error updating progress:", error);
      return false;
    }
  };

  const abandonChallenge = async () => {
    if (!user || !currentChallenge) return false;

    try {
      const { error } = await supabase
        .from("user_weekly_challenges")
        .delete()
        .eq("id", currentChallenge.id);

      if (error) throw error;

      setCurrentChallenge(null);
      toast({
        title: "Challenge abgebrochen",
        description: "Du kannst eine neue Challenge starten."
      });
      return true;
    } catch (error) {
      console.error("Error abandoning challenge:", error);
      return false;
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([
        fetchAvailableChallenges(),
        fetchCurrentChallenge(),
        fetchCompletedChallenges()
      ]);
      setLoading(false);
    };

    init();
  }, [fetchAvailableChallenges, fetchCurrentChallenge, fetchCompletedChallenges]);

  return {
    currentChallenge,
    availableChallenges,
    completedChallenges,
    loading,
    startChallenge,
    updateProgress,
    abandonChallenge,
    refetch: async () => {
      await Promise.all([
        fetchAvailableChallenges(),
        fetchCurrentChallenge(),
        fetchCompletedChallenges()
      ]);
    }
  };
}
