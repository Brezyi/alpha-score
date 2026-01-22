import { useEffect } from "react";
import { useGlobalSettings } from "@/contexts/SystemSettingsContext";

export const useDocumentTitle = (pageTitle?: string) => {
  const { settings } = useGlobalSettings();

  useEffect(() => {
    const appName = settings.app_name || "FaceRank";
    
    if (pageTitle) {
      document.title = `${pageTitle} | ${appName}`;
    } else {
      document.title = appName;
    }
  }, [settings.app_name, pageTitle]);
};
