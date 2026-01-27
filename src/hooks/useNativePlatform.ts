import { useState, useEffect, useContext, createContext } from "react";
import { Capacitor } from "@capacitor/core";

// Create a simple context for mobile preview mode that can be used without the provider
// This allows the hook to work even before the provider is mounted
let globalMobilePreview = false;
let globalSetMobilePreview: ((value: boolean) => void) | null = null;

export const setGlobalMobilePreview = (value: boolean) => {
  globalMobilePreview = value;
  if (globalSetMobilePreview) {
    globalSetMobilePreview(value);
  }
};

export const getGlobalMobilePreview = () => globalMobilePreview;

export const useNativePlatform = () => {
  const [isNative] = useState(() => Capacitor.isNativePlatform());
  const [platform] = useState<"web" | "ios" | "android">(() => {
    if (Capacitor.isNativePlatform()) {
      const p = Capacitor.getPlatform();
      return p === "ios" ? "ios" : p === "android" ? "android" : "web";
    }
    return "web";
  });
  const [isMobilePreview, setIsMobilePreview] = useState(globalMobilePreview);

  useEffect(() => {
    globalSetMobilePreview = setIsMobilePreview;
    return () => {
      globalSetMobilePreview = null;
    };
  }, []);

  const shouldUseMobileLayout = isNative || isMobilePreview;

  return { 
    isNative, 
    platform, 
    isAndroid: platform === "android", 
    isIOS: platform === "ios",
    isMobilePreview,
    shouldUseMobileLayout,
    setMobilePreview: (value: boolean) => {
      globalMobilePreview = value;
      setIsMobilePreview(value);
    },
    toggleMobilePreview: () => {
      const newValue = !globalMobilePreview;
      globalMobilePreview = newValue;
      setIsMobilePreview(newValue);
    }
  };
};
