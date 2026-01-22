import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface SystemSettings {
  app_name: string;
  maintenance_mode: boolean;
  auto_confirm_email: boolean;
  max_upload_size_mb: number;
  streak_reminder_enabled: boolean;
  analytics_enabled: boolean;
  ai_analysis_intensity: "light" | "standard" | "deep";
  default_theme: "dark" | "light";
  accent_color: string;
}

interface SettingsRow {
  key: string;
  value: unknown;
  description: string | null;
  category: string;
  updated_at: string;
}

const defaultSettings: SystemSettings = {
  app_name: "FaceRank",
  maintenance_mode: false,
  auto_confirm_email: true,
  max_upload_size_mb: 10,
  streak_reminder_enabled: true,
  analytics_enabled: true,
  ai_analysis_intensity: "standard",
  default_theme: "dark",
  accent_color: "#00FF88",
};

export function useSystemSettings() {
  const [settings, setSettings] = useState<SystemSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("system_settings")
        .select("*");

      if (error) throw error;

      if (data && data.length > 0) {
        const parsed: Record<string, unknown> = {};
        (data as SettingsRow[]).forEach((row) => {
          parsed[row.key] = row.value;
        });
        setSettings({
          app_name: (parsed.app_name as string) ?? defaultSettings.app_name,
          maintenance_mode: (parsed.maintenance_mode as boolean) ?? defaultSettings.maintenance_mode,
          auto_confirm_email: (parsed.auto_confirm_email as boolean) ?? defaultSettings.auto_confirm_email,
          max_upload_size_mb: (parsed.max_upload_size_mb as number) ?? defaultSettings.max_upload_size_mb,
          streak_reminder_enabled: (parsed.streak_reminder_enabled as boolean) ?? defaultSettings.streak_reminder_enabled,
          analytics_enabled: (parsed.analytics_enabled as boolean) ?? defaultSettings.analytics_enabled,
          ai_analysis_intensity: (parsed.ai_analysis_intensity as SystemSettings["ai_analysis_intensity"]) ?? defaultSettings.ai_analysis_intensity,
          default_theme: (parsed.default_theme as SystemSettings["default_theme"]) ?? defaultSettings.default_theme,
          accent_color: (parsed.accent_color as string) ?? defaultSettings.accent_color,
        });
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast({
        title: "Fehler beim Laden",
        description: "Einstellungen konnten nicht geladen werden.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSetting = useCallback(
    async <K extends keyof SystemSettings>(key: K, value: SystemSettings[K]) => {
      setSaving(true);
      try {
        const { error } = await supabase
          .from("system_settings")
          .update({ value: value as unknown })
          .eq("key", key);

        if (error) throw error;

        setSettings((prev) => ({ ...prev, [key]: value }));
        
        toast({
          title: "Gespeichert",
          description: `Einstellung "${key}" wurde aktualisiert.`,
        });
      } catch (error) {
        console.error("Error updating setting:", error);
        toast({
          title: "Fehler beim Speichern",
          description: "Die Einstellung konnte nicht gespeichert werden.",
          variant: "destructive",
        });
      } finally {
        setSaving(false);
      }
    },
    [toast]
  );

  const updateMultipleSettings = useCallback(
    async (updates: Partial<SystemSettings>) => {
      setSaving(true);
      try {
        const promises = Object.entries(updates).map(([key, value]) =>
          supabase
            .from("system_settings")
            .update({ value: value as unknown })
            .eq("key", key)
        );

        const results = await Promise.all(promises);
        const errors = results.filter((r) => r.error);

        if (errors.length > 0) {
          throw new Error("Some settings failed to save");
        }

        setSettings((prev) => ({ ...prev, ...updates }));
        
        toast({
          title: "Alle Einstellungen gespeichert",
          description: "Die Änderungen wurden erfolgreich übernommen.",
        });
      } catch (error) {
        console.error("Error updating settings:", error);
        toast({
          title: "Fehler beim Speichern",
          description: "Einige Einstellungen konnten nicht gespeichert werden.",
          variant: "destructive",
        });
      } finally {
        setSaving(false);
      }
    },
    [toast]
  );

  return {
    settings,
    loading,
    saving,
    updateSetting,
    updateMultipleSettings,
    refetch: fetchSettings,
  };
}
