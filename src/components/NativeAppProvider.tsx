import { createContext, useContext, ReactNode } from "react";
import { useNativeApp, useHaptics } from "@/hooks/useNativeApp";

interface NativeAppContextType {
  isNative: boolean;
  platform: "ios" | "android" | "web";
  isIOS: boolean;
  isAndroid: boolean;
  keyboardVisible: boolean;
  keyboardHeight: number;
  triggerHaptic: (type?: "light" | "medium" | "heavy" | "selection") => Promise<void>;
}

const NativeAppContext = createContext<NativeAppContextType | null>(null);

export function NativeAppProvider({ children }: { children: ReactNode }) {
  const nativeApp = useNativeApp();
  const { triggerHaptic } = useHaptics();

  return (
    <NativeAppContext.Provider value={{ ...nativeApp, triggerHaptic }}>
      {children}
    </NativeAppContext.Provider>
  );
}

export function useNativeAppContext() {
  const context = useContext(NativeAppContext);
  if (!context) {
    // Return default values if not in provider (for SSR or testing)
    return {
      isNative: false,
      platform: "web" as const,
      isIOS: false,
      isAndroid: false,
      keyboardVisible: false,
      keyboardHeight: 0,
      triggerHaptic: async () => {},
    };
  }
  return context;
}
