import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { StatusBar, Style } from "@capacitor/status-bar";
import { Keyboard } from "@capacitor/keyboard";
import { App } from "@capacitor/app";
import { SplashScreen } from "@capacitor/splash-screen";

/**
 * Hook that handles native app initialization and platform-specific features.
 * Manages status bar, keyboard, app lifecycle, and splash screen.
 */
export function useNativeApp() {
  const [isNative, setIsNative] = useState(false);
  const [platform, setPlatform] = useState<"ios" | "android" | "web">("web");
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const isNativePlatform = Capacitor.isNativePlatform();
    setIsNative(isNativePlatform);
    setPlatform(Capacitor.getPlatform() as "ios" | "android" | "web");

    if (!isNativePlatform) return;

    // Initialize native features
    const initNative = async () => {
      try {
        // Configure Status Bar
        await StatusBar.setStyle({ style: Style.Dark });
        
        if (Capacitor.getPlatform() === "android") {
          await StatusBar.setBackgroundColor({ color: "#0B0B0B" });
        }

        // Hide splash screen after app is ready
        await SplashScreen.hide();
      } catch (error) {
        console.error("Error initializing native features:", error);
      }
    };

    initNative();

    // Keyboard listeners
    const showListener = Keyboard.addListener("keyboardWillShow", (info) => {
      setKeyboardVisible(true);
      setKeyboardHeight(info.keyboardHeight);
      document.body.style.setProperty("--keyboard-height", `${info.keyboardHeight}px`);
    });

    const hideListener = Keyboard.addListener("keyboardWillHide", () => {
      setKeyboardVisible(false);
      setKeyboardHeight(0);
      document.body.style.setProperty("--keyboard-height", "0px");
    });

    // App lifecycle listeners
    const stateListener = App.addListener("appStateChange", ({ isActive }) => {
      if (isActive) {
        // App came to foreground
        console.log("App became active");
      } else {
        // App went to background
        console.log("App went to background");
      }
    });

    // Handle back button on Android
    const backListener = App.addListener("backButton", ({ canGoBack }) => {
      if (canGoBack) {
        window.history.back();
      } else {
        // Optionally exit app or show confirmation
        App.exitApp();
      }
    });

    return () => {
      showListener.then((l) => l.remove());
      hideListener.then((l) => l.remove());
      stateListener.then((l) => l.remove());
      backListener.then((l) => l.remove());
    };
  }, []);

  return {
    isNative,
    platform,
    keyboardVisible,
    keyboardHeight,
    isIOS: platform === "ios",
    isAndroid: platform === "android",
  };
}

/**
 * Hook to trigger haptic feedback on native platforms
 */
export function useHaptics() {
  const triggerHaptic = async (
    type: "light" | "medium" | "heavy" | "selection" = "light"
  ) => {
    if (!Capacitor.isNativePlatform()) return;

    try {
      const { Haptics, ImpactStyle, NotificationType } = await import(
        "@capacitor/haptics"
      );

      switch (type) {
        case "light":
          await Haptics.impact({ style: ImpactStyle.Light });
          break;
        case "medium":
          await Haptics.impact({ style: ImpactStyle.Medium });
          break;
        case "heavy":
          await Haptics.impact({ style: ImpactStyle.Heavy });
          break;
        case "selection":
          await Haptics.selectionStart();
          await Haptics.selectionEnd();
          break;
      }
    } catch (error) {
      // Haptics not available
    }
  };

  return { triggerHaptic };
}
