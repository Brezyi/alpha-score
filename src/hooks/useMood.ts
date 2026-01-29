import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export interface MoodEntry {
  id: string;
  user_id: string;
  entry_date: string;
  mood_score: number | null;
  energy_level: number | null;
  stress_level: number | null;
  symptoms: string[];
  notes: string | null;
  created_at: string;
}

const SYMPTOMS_LIST = [
  "Kopfschmerzen",
  "Müdigkeit",
  "Stress",
  "Schlafprobleme",
  "Konzentrationsschwäche",
  "Appetitlosigkeit",
  "Übelkeit",
  "Muskelschmerzen",
  "Angespanntheit",
  "Motivationslosigkeit"
];

export function useMood() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [todayEntry, setTodayEntry] = useState<MoodEntry | null>(null);
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const today = format(new Date(), "yyyy-MM-dd");

  const fetchTodayEntry = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("mood_entries")
        .select("*")
        .eq("user_id", user.id)
        .eq("entry_date", today)
        .maybeSingle();

      if (error) throw error;
      setTodayEntry(data);
    } catch (error) {
      console.error("Error fetching today's mood entry:", error);
    }
  }, [user, today]);

  const fetchEntries = useCallback(async (limit = 30) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("mood_entries")
        .select("*")
        .eq("user_id", user.id)
        .order("entry_date", { ascending: false })
        .limit(limit);

      if (error) throw error;
      setEntries(data || []);
    } catch (error) {
      console.error("Error fetching mood entries:", error);
    }
  }, [user]);

  const saveMoodEntry = async (updates: Partial<MoodEntry>) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from("mood_entries")
        .upsert({
          user_id: user.id,
          entry_date: today,
          ...updates
        }, { onConflict: "user_id,entry_date" });

      if (error) throw error;
      
      await fetchTodayEntry();
      toast({ title: "Stimmung gespeichert ✓" });
      return true;
    } catch (error) {
      console.error("Error saving mood:", error);
      toast({
        title: "Fehler",
        description: "Stimmung konnte nicht gespeichert werden.",
        variant: "destructive"
      });
      return false;
    }
  };

  const toggleSymptom = async (symptom: string) => {
    const currentSymptoms = todayEntry?.symptoms || [];
    const newSymptoms = currentSymptoms.includes(symptom)
      ? currentSymptoms.filter(s => s !== symptom)
      : [...currentSymptoms, symptom];
    
    return saveMoodEntry({ symptoms: newSymptoms });
  };

  useEffect(() => {
    const init = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      await Promise.all([fetchTodayEntry(), fetchEntries()]);
      setLoading(false);
    };

    init();
  }, [user, fetchTodayEntry, fetchEntries]);

  return {
    todayEntry,
    entries,
    loading,
    symptomsList: SYMPTOMS_LIST,
    saveMoodEntry,
    toggleSymptom,
    refetch: async () => {
      await Promise.all([fetchTodayEntry(), fetchEntries()]);
    }
  };
}
