import { useEffect } from "react";
import { useGlobalSettings } from "@/contexts/SystemSettingsContext";

/**
 * A component that dynamically updates the favicon based on the system settings.
 * Place this inside SystemSettingsProvider to ensure settings are available.
 */
export const FaviconUpdater = () => {
  const { settings } = useGlobalSettings();

  useEffect(() => {
    const faviconUrl = settings.favicon_url;
    
    // Get existing favicon link element or create one
    let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement | null;
    
    if (faviconUrl) {
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.head.appendChild(link);
      }
      link.href = faviconUrl;
    } else {
      // Reset to default favicon
      if (link) {
        link.href = "/favicon.ico";
      }
    }
  }, [settings.favicon_url]);

  return null;
};
