import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface UserXP {
  currentXp: number;
  totalXp: number;
  level: number;
  xpForNextLevel: number;
  progress: number;
}

interface Achievement {
  id: string;
  key: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  xpReward: number;
  requirementType: string;
  requirementValue: number;
  unlocked: boolean;
  unlockedAt?: string;
}

interface DailyChallenge {
  challengeId: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  xpReward: number;
  difficulty: string;
  completed: boolean;
}

export const useGamification = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [xp, setXp] = useState<UserXP>({
    currentXp: 0,
    totalXp: 0,
    level: 1,
    xpForNextLevel: 100,
    progress: 0,
  });
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [dailyChallenges, setDailyChallenges] = useState<DailyChallenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [challengesLoading, setChallengesLoading] = useState(true);

  // Calculate XP needed for next level (exponential growth)
  const calculateXpForLevel = (level: number): number => {
    return Math.floor(100 * Math.pow(level, 1.25));
  };

  // Initialize XP record if it doesn't exist
  const initializeXp = useCallback(async () => {
    if (!user) return;

    try {
      // Check if user has XP record
      const { data, error } = await supabase
        .from("user_xp")
        .select("current_xp, total_xp, level")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        // Create initial XP record
        const { error: insertError } = await supabase
          .from("user_xp")
          .insert({ user_id: user.id, current_xp: 0, total_xp: 0, level: 1 });

        if (insertError) throw insertError;

        setXp({
          currentXp: 0,
          totalXp: 0,
          level: 1,
          xpForNextLevel: 100,
          progress: 0,
        });
      } else {
        const xpForNext = calculateXpForLevel(data.level);
        const progressInLevel = data.current_xp % xpForNext;
        setXp({
          currentXp: data.current_xp,
          totalXp: data.total_xp,
          level: data.level,
          xpForNextLevel: xpForNext,
          progress: Math.round((progressInLevel / xpForNext) * 100),
        });
      }
    } catch (error) {
      console.error("Error initializing XP:", error);
    }
  }, [user]);

  // Fetch user XP
  const fetchXp = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("user_xp")
        .select("current_xp, total_xp, level")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const xpForNext = calculateXpForLevel(data.level);
        const progressInLevel = data.current_xp % xpForNext;
        setXp({
          currentXp: data.current_xp,
          totalXp: data.total_xp,
          level: data.level,
          xpForNextLevel: xpForNext,
          progress: Math.round((progressInLevel / xpForNext) * 100),
        });
      }
    } catch (error) {
      console.error("Error fetching XP:", error);
    }
  }, [user]);

  // Fetch achievements
  const fetchAchievements = useCallback(async () => {
    if (!user) return;

    try {
      // Fetch all achievements
      const { data: allAchievements, error: achievementsError } = await supabase
        .from("achievements")
        .select("*")
        .eq("is_active", true)
        .order("requirement_value", { ascending: true });

      if (achievementsError) throw achievementsError;

      // Fetch user's unlocked achievements
      const { data: userAchievements, error: userAchievementsError } = await supabase
        .from("user_achievements")
        .select("achievement_id, unlocked_at")
        .eq("user_id", user.id);

      if (userAchievementsError) throw userAchievementsError;

      const unlockedMap = new Map(
        userAchievements?.map((ua) => [ua.achievement_id, ua.unlocked_at]) || []
      );

      const combined: Achievement[] = (allAchievements || []).map((a) => ({
        id: a.id,
        key: a.key,
        name: a.name,
        description: a.description,
        icon: a.icon,
        category: a.category,
        xpReward: a.xp_reward,
        requirementType: a.requirement_type,
        requirementValue: a.requirement_value,
        unlocked: unlockedMap.has(a.id),
        unlockedAt: unlockedMap.get(a.id) || undefined,
      }));

      setAchievements(combined);
    } catch (error) {
      console.error("Error fetching achievements:", error);
    }
  }, [user]);

  // Fetch daily challenges
  const fetchDailyChallenges = useCallback(async () => {
    if (!user) {
      setChallengesLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.rpc("get_daily_challenges", {
        p_user_id: user.id,
      });

      if (error) throw error;

      const challenges: DailyChallenge[] = (data || []).map((c: any) => ({
        challengeId: c.challenge_id,
        title: c.title,
        description: c.description,
        icon: c.icon,
        category: c.category,
        xpReward: c.xp_reward,
        difficulty: c.difficulty,
        completed: c.completed,
      }));

      setDailyChallenges(challenges);
    } catch (error) {
      console.error("Error fetching daily challenges:", error);
    } finally {
      setChallengesLoading(false);
    }
  }, [user]);

  // Complete a challenge
  const completeChallenge = useCallback(
    async (challengeId: string) => {
      if (!user) return;

      try {
        const { data, error } = await supabase.rpc("complete_challenge", {
          p_user_id: user.id,
          p_challenge_id: challengeId,
        });

        if (error) throw error;

        const result = data?.[0];
        if (result?.success) {
          toast({
            title: "Challenge abgeschlossen! 🎉",
            description: `+${result.xp_earned} XP verdient!`,
          });

          // Refresh data
          await Promise.all([fetchXp(), fetchDailyChallenges()]);
        } else {
          toast({
            title: "Hinweis",
            description: result?.message || "Challenge konnte nicht abgeschlossen werden.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error completing challenge:", error);
        toast({
          title: "Fehler",
          description: "Challenge konnte nicht abgeschlossen werden.",
          variant: "destructive",
        });
      }
    },
    [user, toast, fetchXp, fetchDailyChallenges]
  );

  // Add XP (used by other features)
  const addXp = useCallback(
    async (amount: number, reason: string = "activity") => {
      if (!user) return null;

      try {
        const { data, error } = await supabase.rpc("add_user_xp", {
          p_user_id: user.id,
          p_xp_amount: amount,
          p_reason: reason,
        });

        if (error) throw error;

        const result = data?.[0];
        if (result?.leveled_up) {
          toast({
            title: "Level Up! 🎊",
            description: `Du bist jetzt Level ${result.new_level}!`,
          });
        }

        await fetchXp();
        return result;
      } catch (error) {
        console.error("Error adding XP:", error);
        return null;
      }
    },
    [user, toast, fetchXp]
  );

  // Initial fetch
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await initializeXp();
      await Promise.all([fetchAchievements(), fetchDailyChallenges()]);
      setLoading(false);
    };

    if (user) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [user, initializeXp, fetchAchievements, fetchDailyChallenges]);

  return {
    xp,
    achievements,
    dailyChallenges,
    loading,
    challengesLoading,
    completeChallenge,
    addXp,
    refetch: () => Promise.all([fetchXp(), fetchAchievements(), fetchDailyChallenges()]),
  };
};
