import { useEffect } from "react";
import { useGlobalSettings } from "@/contexts/SystemSettingsContext";

/**
 * A component that updates the document title based on the app name from system settings.
 * Place this inside SystemSettingsProvider to ensure settings are available.
 */
export const DocumentTitleUpdater = () => {
  const { settings } = useGlobalSettings();

  useEffect(() => {
    const appName = settings.app_name || "GLOMAXXED AI";
    document.title = appName;
  }, [settings.app_name]);

  return null;
};
