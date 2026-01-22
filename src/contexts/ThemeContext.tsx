import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useProfile } from "@/hooks/useProfile";

interface ThemeContextType {
  theme: string;
  accentColor: string;
  backgroundStyle: string;
  setTheme: (theme: string) => void;
  setAccentColor: (color: string) => void;
  setBackgroundStyle: (style: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const ACCENT_COLORS = {
  "#00FF88": { primary: "142 100% 50%", primaryForeground: "0 0% 0%" },
  "#00D4FF": { primary: "192 100% 50%", primaryForeground: "0 0% 0%" },
  "#FF6B6B": { primary: "0 100% 71%", primaryForeground: "0 0% 100%" },
  "#FFD93D": { primary: "48 100% 62%", primaryForeground: "0 0% 0%" },
  "#C084FC": { primary: "270 91% 75%", primaryForeground: "0 0% 0%" },
  "#F472B6": { primary: "330 81% 71%", primaryForeground: "0 0% 0%" },
};

const BACKGROUND_STYLES = {
  default: { background: "0 0% 4%", card: "0 0% 7%" },
  charcoal: { background: "0 0% 8%", card: "0 0% 11%" },
  midnight: { background: "220 20% 6%", card: "220 20% 10%" },
  forest: { background: "150 15% 5%", card: "150 15% 8%" },
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { profile, updateProfile } = useProfile();
  const [theme, setThemeState] = useState("dark");
  const [accentColor, setAccentColorState] = useState("#00FF88");
  const [backgroundStyle, setBackgroundStyleState] = useState("default");

  // Load settings from profile
  useEffect(() => {
    if (profile) {
      setThemeState(profile.theme || "dark");
      setAccentColorState(profile.accent_color || "#00FF88");
      setBackgroundStyleState(profile.background_style || "default");
    }
  }, [profile]);

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    
    // Apply theme class
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    // Apply accent color
    const accent = ACCENT_COLORS[accentColor as keyof typeof ACCENT_COLORS] || ACCENT_COLORS["#00FF88"];
    root.style.setProperty("--primary", accent.primary);
    root.style.setProperty("--primary-foreground", accent.primaryForeground);

    // Apply background style
    const bg = BACKGROUND_STYLES[backgroundStyle as keyof typeof BACKGROUND_STYLES] || BACKGROUND_STYLES.default;
    root.style.setProperty("--background", bg.background);
    root.style.setProperty("--card", bg.card);
  }, [theme, accentColor, backgroundStyle]);

  const setTheme = async (newTheme: string) => {
    setThemeState(newTheme);
    if (profile) {
      await updateProfile({ theme: newTheme });
    }
  };

  const setAccentColor = async (color: string) => {
    setAccentColorState(color);
    if (profile) {
      await updateProfile({ accent_color: color });
    }
  };

  const setBackgroundStyle = async (style: string) => {
    setBackgroundStyleState(style);
    if (profile) {
      await updateProfile({ background_style: style });
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        accentColor,
        backgroundStyle,
        setTheme,
        setAccentColor,
        setBackgroundStyle,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
