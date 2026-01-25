import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { format, startOfDay, endOfDay } from "date-fns";

export interface FaceFitnessSession {
  id: string;
  user_id: string;
  exercise_key: string;
  duration_seconds: number;
  completed_at: string;
}

export interface ExerciseStats {
  exerciseKey: string;
  totalSessions: number;
  totalSeconds: number;
  lastCompleted: string | null;
}

export function useFaceFitness() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [todaySessions, setTodaySessions] = useState<FaceFitnessSession[]>([]);
  const [allSessions, setAllSessions] = useState<FaceFitnessSession[]>([]);
  const [exerciseStats, setExerciseStats] = useState<ExerciseStats[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTodaySessions = useCallback(async () => {
    if (!user) return;

    try {
      const today = new Date();
      const start = startOfDay(today).toISOString();
      const end = endOfDay(today).toISOString();

      const { data, error } = await supabase
        .from("face_fitness_sessions")
        .select("*")
        .eq("user_id", user.id)
        .gte("completed_at", start)
        .lte("completed_at", end)
        .order("completed_at", { ascending: false });

      if (error) throw error;
      setTodaySessions(data || []);
    } catch (error) {
      console.error("Error fetching today's sessions:", error);
    }
  }, [user]);

  const fetchAllSessions = useCallback(async (limit = 100) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("face_fitness_sessions")
        .select("*")
        .eq("user_id", user.id)
        .order("completed_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      setAllSessions(data || []);

      // Calculate stats per exercise
      const statsMap = new Map<string, ExerciseStats>();
      
      (data || []).forEach(session => {
        const existing = statsMap.get(session.exercise_key);
        if (existing) {
          existing.totalSessions += 1;
          existing.totalSeconds += session.duration_seconds;
          if (!existing.lastCompleted || session.completed_at > existing.lastCompleted) {
            existing.lastCompleted = session.completed_at;
          }
        } else {
          statsMap.set(session.exercise_key, {
            exerciseKey: session.exercise_key,
            totalSessions: 1,
            totalSeconds: session.duration_seconds,
            lastCompleted: session.completed_at
          });
        }
      });

      setExerciseStats(Array.from(statsMap.values()));
    } catch (error) {
      console.error("Error fetching all sessions:", error);
    }
  }, [user]);

  const logSession = async (exerciseKey: string, durationSeconds: number) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from("face_fitness_sessions")
        .insert({
          user_id: user.id,
          exercise_key: exerciseKey,
          duration_seconds: durationSeconds,
          completed_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Add XP for completing exercise
      const xpAmount = Math.min(Math.floor(durationSeconds / 60) * 5 + 10, 50);
      await supabase.rpc("add_user_xp", {
        p_user_id: user.id,
        p_xp_amount: xpAmount,
        p_reason: `Face Fitness: ${exerciseKey}`
      });

      await Promise.all([fetchTodaySessions(), fetchAllSessions()]);
      
      toast({
        title: "Training abgeschlossen! 💪",
        description: `+${xpAmount} XP verdient!`
      });
      
      return data;
    } catch (error) {
      console.error("Error logging session:", error);
      toast({
        title: "Fehler",
        description: "Training konnte nicht gespeichert werden.",
        variant: "destructive"
      });
      return null;
    }
  };

  const getTodayTotalMinutes = () => {
    return Math.floor(
      todaySessions.reduce((acc, s) => acc + s.duration_seconds, 0) / 60
    );
  };

  const getTodayExerciseCount = () => {
    return new Set(todaySessions.map(s => s.exercise_key)).size;
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchTodaySessions(), fetchAllSessions()]);
      setLoading(false);
    };

    init();
  }, [fetchTodaySessions, fetchAllSessions]);

  return {
    todaySessions,
    allSessions,
    exerciseStats,
    loading,
    logSession,
    getTodayTotalMinutes,
    getTodayExerciseCount,
    refetch: async () => {
      await Promise.all([fetchTodaySessions(), fetchAllSessions()]);
    }
  };
}
