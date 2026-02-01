import { useState, useCallback, useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { useToast } from "@/hooks/use-toast";
import type { HealthPlugin, HealthPermission, QueryLatestSampleResponse } from "@flomentumsolutions/capacitor-health-extended";

// Types for Health Data
export interface HealthSummary {
  steps: number;
  activeMinutes: number;
  sleepHours: number;
  sleepQuality?: number;
  heartRate?: number;
  calories?: number;
}

/**
 * Hook to access Apple Health / Google Health Connect data via Capacitor
 */
export function useHealthData() {
  const { toast } = useToast();
  const [isAvailable, setIsAvailable] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(false);
  const [healthPlugin, setHealthPlugin] = useState<HealthPlugin | null>(null);

  const isNative = Capacitor.isNativePlatform();
  const platform = Capacitor.getPlatform();

  // Initialize plugin on native platforms
  useEffect(() => {
    const initPlugin = async () => {
      if (!isNative) {
        setIsAvailable(false);
        return;
      }

      try {
        const { Health } = await import(
          "@flomentumsolutions/capacitor-health-extended"
        );
        setHealthPlugin(Health);

        const result = await Health.isHealthAvailable();
        setIsAvailable(result.available);
      } catch (error) {
        console.error("Health plugin not available:", error);
        setIsAvailable(false);
      }
    };

    initPlugin();
  }, [isNative]);

  /**
   * Request authorization to read health data
   */
  const requestAuthorization = useCallback(async (): Promise<boolean> => {
    if (!healthPlugin || !isAvailable) {
      toast({
        title: "Nicht verfügbar",
        description: platform === "ios" 
          ? "Apple Health ist auf diesem Gerät nicht verfügbar."
          : "Google Health Connect ist auf diesem Gerät nicht verfügbar.",
        variant: "destructive",
      });
      return false;
    }

    try {
      setLoading(true);

      // Request read permissions for common health data types
      const permissions: HealthPermission[] = [
        "READ_STEPS",
        "READ_SLEEP",
        "READ_EXERCISE_TIME",
        "READ_ACTIVE_CALORIES",
        "READ_HEART_RATE",
      ];

      await healthPlugin.requestHealthPermissions({ permissions });
      setIsAuthorized(true);

      toast({
        title: "Zugriff gewährt ✓",
        description: platform === "ios" 
          ? "Apple Health wurde verbunden."
          : "Google Health Connect wurde verbunden.",
      });

      return true;
    } catch (error) {
      console.error("Authorization error:", error);
      toast({
        title: "Zugriff verweigert",
        description: "Bitte erteile die Berechtigung in den Einstellungen.",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [healthPlugin, isAvailable, platform, toast]);

  /**
   * Get today's health summary
   */
  const getTodaySummary = useCallback(async (): Promise<HealthSummary | null> => {
    if (!healthPlugin || !isAuthorized) {
      return null;
    }

    try {
      setLoading(true);

      // Query latest samples in parallel (including calories)
      const [stepsResult, sleepResult, exerciseResult, caloriesResult] = await Promise.all([
        healthPlugin.queryLatestSample({ dataType: "steps" }).catch(() => null),
        healthPlugin.queryLatestSample({ dataType: "sleep" }).catch(() => null),
        healthPlugin.queryLatestSample({ dataType: "exercise-time" }).catch(() => null),
        healthPlugin.queryLatestSample({ dataType: "active-calories" }).catch(() => null),
      ]);

      const steps = (stepsResult as QueryLatestSampleResponse | null)?.value || 0;
      const sleepHours = (sleepResult as QueryLatestSampleResponse | null)?.value 
        ? ((sleepResult as QueryLatestSampleResponse).value! / 60) 
        : 0; // Convert minutes to hours
      const activeMinutes = (exerciseResult as QueryLatestSampleResponse | null)?.value || 0;
      const calories = (caloriesResult as QueryLatestSampleResponse | null)?.value || 0;

      return {
        steps: Math.round(steps),
        activeMinutes: Math.round(activeMinutes),
        sleepHours: Math.round(sleepHours * 10) / 10,
        calories: Math.round(calories),
      };
    } catch (error) {
      console.error("Error getting today's summary:", error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [healthPlugin, isAuthorized]);

  /**
   * Get weekly aggregated health data
   */
  const getWeeklySummary = useCallback(
    async (): Promise<{ date: string; steps: number }[]> => {
      if (!healthPlugin || !isAuthorized) {
        return [];
      }

      try {
        setLoading(true);
        
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(startOfWeek.getDate() - 6);
        startOfWeek.setHours(0, 0, 0, 0);

        const result = await healthPlugin.queryAggregated({
          dataType: "steps",
          startDate: startOfWeek.toISOString(),
          endDate: now.toISOString(),
          bucket: "day",
        });

        return result.aggregatedData.map((d) => ({
          date: d.startDate,
          steps: Math.round(d.value),
        }));
      } catch (error) {
        console.error("Error getting weekly summary:", error);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [healthPlugin, isAuthorized]
  );

  return {
    isNative,
    isAvailable,
    isAuthorized,
    loading,
    platform,
    requestAuthorization,
    getTodaySummary,
    getWeeklySummary,
  };
}
