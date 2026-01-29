import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface WaterLog {
  id: string;
  amount_ml: number;
  logged_at: string;
}

export interface WaterReminder {
  is_enabled: boolean;
  reminder_interval_hours: number;
  start_time: string;
  end_time: string;
  daily_goal_liters: number;
}

export function useWaterTracker() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [todayLogs, setTodayLogs] = useState<WaterLog[]>([]);
  const [todayTotal, setTodayTotal] = useState(0);
  const [reminder, setReminder] = useState<WaterReminder | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchTodayLogs = useCallback(async () => {
    if (!user) return;

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const { data, error } = await supabase
        .from("water_logs")
        .select("*")
        .eq("user_id", user.id)
        .gte("logged_at", today.toISOString())
        .lt("logged_at", tomorrow.toISOString())
        .order("logged_at", { ascending: false });

      if (error) throw error;
      
      setTodayLogs(data || []);
      setTodayTotal((data || []).reduce((sum, log) => sum + log.amount_ml, 0));
    } catch (error) {
      console.error("Error fetching water logs:", error);
    }
  }, [user]);

  const fetchReminder = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("water_reminders")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      
      if (data) {
        setReminder({
          is_enabled: data.is_enabled ?? true,
          reminder_interval_hours: data.reminder_interval_hours ?? 2,
          start_time: data.start_time ?? "08:00",
          end_time: data.end_time ?? "22:00",
          daily_goal_liters: Number(data.daily_goal_liters) ?? 2.5
        });
      }
    } catch (error) {
      console.error("Error fetching water reminder:", error);
    }
  }, [user]);

  const addWater = useCallback(async (amountMl: number) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from("water_logs")
        .insert({
          user_id: user.id,
          amount_ml: amountMl
        });

      if (error) throw error;

      await fetchTodayLogs();
      toast({
        title: `+${amountMl}ml Wasser 💧`
      });
      return true;
    } catch (error) {
      console.error("Error adding water:", error);
      toast({
        title: "Fehler",
        description: "Wasser konnte nicht hinzugefügt werden.",
        variant: "destructive"
      });
      return false;
    }
  }, [user, fetchTodayLogs, toast]);

  const removeLastLog = useCallback(async () => {
    if (!user || todayLogs.length === 0) return false;

    try {
      const { error } = await supabase
        .from("water_logs")
        .delete()
        .eq("id", todayLogs[0].id);

      if (error) throw error;

      await fetchTodayLogs();
      toast({
        title: "Letzter Eintrag entfernt"
      });
      return true;
    } catch (error) {
      console.error("Error removing water log:", error);
      return false;
    }
  }, [user, todayLogs, fetchTodayLogs, toast]);

  const updateReminder = useCallback(async (updates: Partial<WaterReminder>) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from("water_reminders")
        .upsert({
          user_id: user.id,
          ...reminder,
          ...updates,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      await fetchReminder();
      toast({
        title: "Einstellungen gespeichert ✓"
      });
      return true;
    } catch (error) {
      console.error("Error updating reminder:", error);
      return false;
    }
  }, [user, reminder, fetchReminder, toast]);

  useEffect(() => {
    const init = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      await Promise.all([fetchTodayLogs(), fetchReminder()]);
      setLoading(false);
    };

    init();
  }, [user, fetchTodayLogs, fetchReminder]);

  return {
    todayLogs,
    todayTotal,
    todayTotalLiters: todayTotal / 1000,
    reminder,
    loading,
    addWater,
    removeLastLog,
    updateReminder,
    refetch: () => Promise.all([fetchTodayLogs(), fetchReminder()])
  };
}
