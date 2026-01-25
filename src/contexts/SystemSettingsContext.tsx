import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

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
  app_name: "GLOWMAXXED AI",
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

interface SystemSettingsContextType {
  settings: SystemSettings;
  loading: boolean;
  refetch: () => Promise<void>;
}

const SystemSettingsContext = createContext<SystemSettingsContextType>({
  settings: defaultSettings,
  loading: true,
  refetch: async () => {},
});

export const useGlobalSettings = () => {
  const context = useContext(SystemSettingsContext);
  if (!context) {
    throw new Error("useGlobalSettings must be used within a SystemSettingsProvider");
  }
  return context;
};

// Parse value from JSONB - handles both raw values and JSON strings
const parseSettingValue = (value: unknown): unknown => {
  // Handle string values that might be JSON or boolean strings
  if (typeof value === "string") {
    // Handle boolean strings explicitly
    if (value === "true") return true;
    if (value === "false") return false;
    
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
  return value;
};

export const SystemSettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<SystemSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("system_settings")
        .select("*");

      if (error) {
        console.error("[SystemSettings] Error fetching:", error);
        return;
      }

      if (data && data.length > 0) {
        const parsed: Record<string, unknown> = {};
        (data as SettingsRow[]).forEach((row) => {
          parsed[row.key] = parseSettingValue(row.value);
        });

        const newSettings: SystemSettings = {
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
        };

        console.log("[SystemSettings] Loaded:", newSettings);
        setSettings(newSettings);
      }
    } catch (error) {
      console.error("[SystemSettings] Fetch error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();

    // Subscribe to realtime changes
    const channel = supabase
      .channel("system_settings_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "system_settings",
        },
        (payload) => {
          console.log("[SystemSettings] Realtime update:", payload);
          // Refetch all settings on any change
          fetchSettings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchSettings]);

  return (
    <SystemSettingsContext.Provider value={{ settings, loading, refetch: fetchSettings }}>
      {children}
    </SystemSettingsContext.Provider>
  );
};
