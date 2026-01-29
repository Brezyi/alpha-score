import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface FastingSession {
  id: string;
  user_id: string;
  fasting_type: string;
  start_time: string;
  target_end_time: string;
  actual_end_time: string | null;
  is_completed: boolean;
  notes: string | null;
  created_at: string;
}

export type FastingPlan = "16:8" | "18:6" | "20:4" | "custom";

export interface FastingPlanInfo {
  label: string;
  fastingHours: number;
  eatingHours: number;
  description: string;
}

export const FASTING_PLANS: Record<FastingPlan, FastingPlanInfo> = {
  "16:8": {
    label: "16:8",
    fastingHours: 16,
    eatingHours: 8,
    description: "16h fasten, 8h Essensfenster",
  },
  "18:6": {
    label: "18:6",
    fastingHours: 18,
    eatingHours: 6,
    description: "18h fasten, 6h Essensfenster",
  },
  "20:4": {
    label: "20:4 (Warrior)",
    fastingHours: 20,
    eatingHours: 4,
    description: "20h fasten, 4h Essensfenster",
  },
  custom: {
    label: "Custom",
    fastingHours: 0,
    eatingHours: 0,
    description: "Eigene Dauer festlegen",
  },
};

export function useFasting() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentSession, setCurrentSession] = useState<FastingSession | null>(null);
  const [history, setHistory] = useState<FastingSession[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCurrentSession = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("fasting_sessions")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_completed", false)
        .order("start_time", { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      setCurrentSession(data as FastingSession | null);
    } catch (error) {
      console.error("Error fetching current session:", error);
      setCurrentSession(null);
    }
  }, [user]);

  const fetchHistory = useCallback(async (limit = 30) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("fasting_sessions")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_completed", true)
        .order("start_time", { ascending: false })
        .limit(limit);

      if (error) throw error;
      setHistory((data as FastingSession[]) || []);
    } catch (error) {
      console.error("Error fetching history:", error);
    }
  }, [user]);

  const startFasting = async (plan: FastingPlan, customHours?: number) => {
    if (!user) return null;

    const fastingHours = plan === "custom" ? (customHours || 16) : FASTING_PLANS[plan].fastingHours;
    const startTime = new Date();
    const targetEndTime = new Date(startTime.getTime() + fastingHours * 60 * 60 * 1000);

    try {
      const { data, error } = await supabase
        .from("fasting_sessions")
        .insert({
          user_id: user.id,
          fasting_type: plan === "custom" ? `${customHours}h` : plan,
          start_time: startTime.toISOString(),
          target_end_time: targetEndTime.toISOString(),
          is_completed: false,
        })
        .select()
        .single();

      if (error) throw error;

      setCurrentSession(data as FastingSession);
      toast({ title: "Fasten gestartet! 🕐" });
      return data;
    } catch (error) {
      console.error("Error starting fast:", error);
      toast({
        title: "Fehler",
        description: "Fasten konnte nicht gestartet werden.",
        variant: "destructive",
      });
      return null;
    }
  };

  const endFasting = async (early = false) => {
    if (!user || !currentSession) return false;

    try {
      const { error } = await supabase
        .from("fasting_sessions")
        .update({
          actual_end_time: new Date().toISOString(),
          is_completed: true,
        })
        .eq("id", currentSession.id)
        .eq("user_id", user.id);

      if (error) throw error;

      setCurrentSession(null);
      await fetchHistory();
      
      toast({
        title: early ? "Fasten beendet" : "Fasten abgeschlossen! 🎉",
        description: early ? "Du kannst jederzeit neu starten." : "Großartig! Ziel erreicht.",
      });
      return true;
    } catch (error) {
      console.error("Error ending fast:", error);
      return false;
    }
  };

  const cancelFasting = async () => {
    if (!user || !currentSession) return false;

    try {
      const { error } = await supabase
        .from("fasting_sessions")
        .delete()
        .eq("id", currentSession.id)
        .eq("user_id", user.id);

      if (error) throw error;

      setCurrentSession(null);
      toast({ title: "Fasten abgebrochen" });
      return true;
    } catch (error) {
      console.error("Error canceling fast:", error);
      return false;
    }
  };

  // Calculate progress
  const getProgress = () => {
    if (!currentSession) return { percent: 0, elapsed: 0, remaining: 0 };

    const start = new Date(currentSession.start_time).getTime();
    const target = new Date(currentSession.target_end_time).getTime();
    const now = Date.now();
    const total = target - start;
    const elapsed = now - start;
    const remaining = Math.max(0, target - now);
    const percent = Math.min(100, (elapsed / total) * 100);

    return {
      percent,
      elapsed: Math.floor(elapsed / 1000), // seconds
      remaining: Math.floor(remaining / 1000), // seconds
      isComplete: now >= target,
    };
  };

  // Get streak (consecutive completed fasts)
  const getStreak = () => {
    let streak = 0;
    const now = new Date();
    const oneDayMs = 24 * 60 * 60 * 1000;
    let checkDate = new Date(now.getTime() - oneDayMs);

    for (const session of history) {
      const sessionDate = new Date(session.start_time);
      if (
        sessionDate.toDateString() === checkDate.toDateString() ||
        sessionDate.toDateString() === now.toDateString()
      ) {
        streak++;
        checkDate = new Date(checkDate.getTime() - oneDayMs);
      } else if (sessionDate < checkDate) {
        break;
      }
    }

    return streak;
  };

  useEffect(() => {
    const init = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      setLoading(true);
      await Promise.all([fetchCurrentSession(), fetchHistory()]);
      setLoading(false);
    };
    init();
  }, [user, fetchCurrentSession, fetchHistory]);

  return {
    currentSession,
    history,
    loading,
    startFasting,
    endFasting,
    cancelFasting,
    getProgress,
    getStreak,
    refetch: async () => {
      await Promise.all([fetchCurrentSession(), fetchHistory()]);
    },
  };
}
