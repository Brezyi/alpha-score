import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export interface LifestyleEntry {
  id: string;
  user_id: string;
  entry_date: string;
  sleep_hours: number | null;
  water_liters: number | null;
  exercise_minutes: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface SupplementLog {
  id: string;
  user_id: string;
  supplement_id: string | null;
  dosage: string | null;
  notes: string | null;
  taken_at: string;
  supplement?: {
    id: string;
    name: string;
    category: string | null;
    default_dosage: string | null;
  };
}

export interface Supplement {
  id: string;
  name: string;
  category: string | null;
  description: string | null;
  default_dosage: string | null;
  is_system: boolean;
  created_by: string | null;
}

export function useLifestyle() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [todayEntry, setTodayEntry] = useState<LifestyleEntry | null>(null);
  const [entries, setEntries] = useState<LifestyleEntry[]>([]);
  const [supplements, setSupplements] = useState<Supplement[]>([]);
  const [todaySupplements, setTodaySupplements] = useState<SupplementLog[]>([]);
  const [loading, setLoading] = useState(true);

  const today = format(new Date(), "yyyy-MM-dd");

  const fetchTodayEntry = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("lifestyle_entries")
        .select("*")
        .eq("user_id", user.id)
        .eq("entry_date", today)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      setTodayEntry(data);
    } catch (error) {
      console.error("Error fetching today's entry:", error);
    }
  }, [user, today]);

  const fetchEntries = useCallback(async (limit = 30) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("lifestyle_entries")
        .select("*")
        .eq("user_id", user.id)
        .order("entry_date", { ascending: false })
        .limit(limit);

      if (error) throw error;
      setEntries(data || []);
    } catch (error) {
      console.error("Error fetching entries:", error);
    }
  }, [user]);

  const fetchSupplements = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("supplements")
        .select("*")
        .or(`is_system.eq.true,created_by.eq.${user.id}`)
        .order("name");

      if (error) throw error;
      setSupplements(data || []);
    } catch (error) {
      console.error("Error fetching supplements:", error);
    }
  }, [user]);

  const fetchTodaySupplements = useCallback(async () => {
    if (!user) return;

    try {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      const { data, error } = await supabase
        .from("supplement_logs")
        .select(`
          *,
          supplement:supplements(id, name, category, default_dosage)
        `)
        .eq("user_id", user.id)
        .gte("taken_at", startOfDay.toISOString())
        .lte("taken_at", endOfDay.toISOString())
        .order("taken_at", { ascending: false });

      if (error) throw error;
      setTodaySupplements(data || []);
    } catch (error) {
      console.error("Error fetching today's supplements:", error);
    }
  }, [user]);

  const updateTodayEntry = async (updates: Partial<LifestyleEntry>) => {
    if (!user) return false;

    try {
      if (todayEntry) {
        const { error } = await supabase
          .from("lifestyle_entries")
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq("id", todayEntry.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("lifestyle_entries")
          .insert({
            user_id: user.id,
            entry_date: today,
            ...updates
          });

        if (error) throw error;
      }

      await fetchTodayEntry();
      toast({
        title: "Gespeichert ✓"
      });
      return true;
    } catch (error) {
      console.error("Error updating entry:", error);
      toast({
        title: "Fehler",
        description: "Eintrag konnte nicht gespeichert werden.",
        variant: "destructive"
      });
      return false;
    }
  };

  const logSupplement = async (supplementId: string, dosage?: string, notes?: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from("supplement_logs")
        .insert({
          user_id: user.id,
          supplement_id: supplementId,
          dosage,
          notes,
          taken_at: new Date().toISOString()
        });

      if (error) throw error;
      
      await fetchTodaySupplements();
      toast({
        title: "Supplement protokolliert ✓"
      });
      return true;
    } catch (error) {
      console.error("Error logging supplement:", error);
      toast({
        title: "Fehler",
        description: "Supplement konnte nicht protokolliert werden.",
        variant: "destructive"
      });
      return false;
    }
  };

  const deleteSupplementLog = async (logId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from("supplement_logs")
        .delete()
        .eq("id", logId)
        .eq("user_id", user.id);

      if (error) throw error;
      
      await fetchTodaySupplements();
      toast({
        title: "Eintrag gelöscht ✓"
      });
      return true;
    } catch (error) {
      console.error("Error deleting supplement log:", error);
      toast({
        title: "Fehler",
        description: "Eintrag konnte nicht gelöscht werden.",
        variant: "destructive"
      });
      return false;
    }
  };

  const createCustomSupplement = async (name: string, category?: string, defaultDosage?: string) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from("supplements")
        .insert({
          name,
          category: category || "custom",
          default_dosage: defaultDosage,
          is_system: false,
          created_by: user.id
        })
        .select()
        .single();

      if (error) throw error;
      
      await fetchSupplements();
      toast({
        title: `${name} hinzugefügt ✓`
      });
      return data;
    } catch (error) {
      console.error("Error creating supplement:", error);
      toast({
        title: "Fehler",
        description: "Supplement konnte nicht erstellt werden.",
        variant: "destructive"
      });
      return null;
    }
  };

  useEffect(() => {
    const init = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      await Promise.all([
        fetchTodayEntry(),
        fetchEntries(),
        fetchSupplements(),
        fetchTodaySupplements()
      ]);
      setLoading(false);
    };

    init();
  }, [user, fetchTodayEntry, fetchEntries, fetchSupplements, fetchTodaySupplements]);

  return {
    todayEntry,
    entries,
    supplements,
    todaySupplements,
    loading,
    updateTodayEntry,
    logSupplement,
    deleteSupplementLog,
    createCustomSupplement,
    refetch: async () => {
      await Promise.all([
        fetchTodayEntry(),
        fetchEntries(),
        fetchSupplements(),
        fetchTodaySupplements()
      ]);
    }
  };
}
