import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface SystemSettings {
  app_name: string;
  app_logo_url: string;
  favicon_url: string;
  maintenance_mode: boolean;
  auto_confirm_email: boolean;
  max_upload_size_mb: number;
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
  app_name: "GLOMAXXED AI",
  app_logo_url: "",
  favicon_url: "",
  maintenance_mode: false,
  auto_confirm_email: true,
  max_upload_size_mb: 10,
  analytics_enabled: true,
  ai_analysis_intensity: "standard",
  default_theme: "dark",
  accent_color: "#00FF88",
};

// Parse value from JSONB - handles both raw values and JSON strings
const parseSettingValue = (value: unknown): unknown => {
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
  return value;
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
          parsed[row.key] = parseSettingValue(row.value);
        });

        setSettings({
          app_name: typeof parsed.app_name === "string" ? parsed.app_name : defaultSettings.app_name,
          app_logo_url: typeof parsed.app_logo_url === "string" ? parsed.app_logo_url : defaultSettings.app_logo_url,
          favicon_url: typeof parsed.favicon_url === "string" ? parsed.favicon_url : defaultSettings.favicon_url,
          maintenance_mode: typeof parsed.maintenance_mode === "boolean" ? parsed.maintenance_mode : defaultSettings.maintenance_mode,
          auto_confirm_email: typeof parsed.auto_confirm_email === "boolean" ? parsed.auto_confirm_email : defaultSettings.auto_confirm_email,
          max_upload_size_mb: typeof parsed.max_upload_size_mb === "number" ? parsed.max_upload_size_mb : defaultSettings.max_upload_size_mb,
          analytics_enabled: typeof parsed.analytics_enabled === "boolean" ? parsed.analytics_enabled : defaultSettings.analytics_enabled,
          ai_analysis_intensity: ["light", "standard", "deep"].includes(parsed.ai_analysis_intensity as string)
            ? (parsed.ai_analysis_intensity as SystemSettings["ai_analysis_intensity"])
            : defaultSettings.ai_analysis_intensity,
          default_theme: ["dark", "light"].includes(parsed.default_theme as string)
            ? (parsed.default_theme as SystemSettings["default_theme"])
            : defaultSettings.default_theme,
          accent_color: typeof parsed.accent_color === "string" ? parsed.accent_color : defaultSettings.accent_color,
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
        // Store values properly as JSON in the JSONB column
        const jsonValue = typeof value === "string" ? JSON.stringify(value) : value;
        
        const { error } = await supabase
          .from("system_settings")
          .update({ value: jsonValue })
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
        const promises = Object.entries(updates).map(([key, value]) => {
          // Store values properly as JSON in the JSONB column
          const jsonValue = typeof value === "string" ? JSON.stringify(value) : value;
          
          return supabase
            .from("system_settings")
            .update({ value: jsonValue })
            .eq("key", key);
        });

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
