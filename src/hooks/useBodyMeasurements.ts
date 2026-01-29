import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export interface BodyMeasurement {
  id: string;
  user_id: string;
  measured_at: string;
  weight_kg: number | null;
  body_fat_percent: number | null;
  waist_cm: number | null;
  hip_cm: number | null;
  chest_cm: number | null;
  arm_cm: number | null;
  thigh_cm: number | null;
  notes: string | null;
  created_at: string;
}

export type MeasurementField = 
  | "weight_kg" 
  | "body_fat_percent" 
  | "waist_cm" 
  | "hip_cm" 
  | "chest_cm" 
  | "arm_cm" 
  | "thigh_cm";

export function useBodyMeasurements() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>([]);
  const [loading, setLoading] = useState(true);

  const today = format(new Date(), "yyyy-MM-dd");

  const fetchMeasurements = useCallback(async (limit = 90) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("body_measurements")
        .select("*")
        .eq("user_id", user.id)
        .order("measured_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      setMeasurements((data as BodyMeasurement[]) || []);
    } catch (error) {
      console.error("Error fetching measurements:", error);
    }
  }, [user]);

  const saveMeasurement = async (
    data: Partial<Omit<BodyMeasurement, "id" | "user_id" | "created_at">>,
    date?: string
  ) => {
    if (!user) return null;

    const measureDate = date || today;

    try {
      // Try to update existing record for this date
      const { data: existing } = await supabase
        .from("body_measurements")
        .select("id")
        .eq("user_id", user.id)
        .eq("measured_at", measureDate)
        .single();

      if (existing) {
        // Update
        const { data: updated, error } = await supabase
          .from("body_measurements")
          .update(data)
          .eq("id", existing.id)
          .select()
          .single();

        if (error) throw error;
        await fetchMeasurements();
        toast({ title: "Messung aktualisiert ✓" });
        return updated;
      } else {
        // Insert
        const { data: inserted, error } = await supabase
          .from("body_measurements")
          .insert({
            user_id: user.id,
            measured_at: measureDate,
            ...data,
          })
          .select()
          .single();

        if (error) throw error;
        await fetchMeasurements();
        toast({ title: "Messung gespeichert ✓" });
        return inserted;
      }
    } catch (error) {
      console.error("Error saving measurement:", error);
      toast({
        title: "Fehler",
        description: "Messung konnte nicht gespeichert werden.",
        variant: "destructive",
      });
      return null;
    }
  };

  const deleteMeasurement = async (id: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from("body_measurements")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;
      await fetchMeasurements();
      toast({ title: "Messung gelöscht ✓" });
      return true;
    } catch (error) {
      console.error("Error deleting measurement:", error);
      return false;
    }
  };

  // Get latest measurement
  const getLatest = () => measurements[0] || null;

  // Get trend data for a specific field
  const getTrend = (field: MeasurementField, days = 30) => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    return measurements
      .filter((m) => new Date(m.measured_at) >= cutoff && m[field] !== null)
      .map((m) => ({
        date: m.measured_at,
        value: m[field] as number,
      }))
      .reverse();
  };

  // Calculate change from first to last measurement
  const getChange = (field: MeasurementField) => {
    const data = getTrend(field, 90);
    if (data.length < 2) return null;

    const first = data[0].value;
    const last = data[data.length - 1].value;
    const change = last - first;
    const percentChange = ((change / first) * 100).toFixed(1);

    return {
      absolute: change,
      percent: parseFloat(percentChange),
      direction: change > 0 ? "up" : change < 0 ? "down" : "stable",
    };
  };

  // Get waist-to-hip ratio
  const getWaistHipRatio = () => {
    const latest = getLatest();
    if (!latest?.waist_cm || !latest?.hip_cm) return null;
    return (latest.waist_cm / latest.hip_cm).toFixed(2);
  };

  useEffect(() => {
    const init = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      setLoading(true);
      await fetchMeasurements();
      setLoading(false);
    };
    init();
  }, [user, fetchMeasurements]);

  return {
    measurements,
    loading,
    saveMeasurement,
    deleteMeasurement,
    getLatest,
    getTrend,
    getChange,
    getWaistHipRatio,
    refetch: fetchMeasurements,
  };
}
