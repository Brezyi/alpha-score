import { useState, useEffect } from "react";
import { Capacitor } from "@capacitor/core";

export const useNativePlatform = () => {
  const [isNative, setIsNative] = useState(false);
  const [platform, setPlatform] = useState<"web" | "ios" | "android">("web");

  useEffect(() => {
    const checkPlatform = () => {
      const native = Capacitor.isNativePlatform();
      setIsNative(native);
      
      if (native) {
        const p = Capacitor.getPlatform();
        setPlatform(p === "ios" ? "ios" : p === "android" ? "android" : "web");
      } else {
        setPlatform("web");
      }
    };

    checkPlatform();
  }, []);

  return { isNative, platform, isAndroid: platform === "android", isIOS: platform === "ios" };
};
