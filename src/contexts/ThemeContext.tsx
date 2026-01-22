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

const BACKGROUND_STYLES_DARK = {
  default: { background: "0 0% 4%", card: "0 0% 7%", foreground: "0 0% 98%", mutedForeground: "0 0% 64%" },
  charcoal: { background: "0 0% 8%", card: "0 0% 11%", foreground: "0 0% 98%", mutedForeground: "0 0% 64%" },
  midnight: { background: "220 20% 6%", card: "220 20% 10%", foreground: "0 0% 98%", mutedForeground: "220 10% 60%" },
  forest: { background: "150 15% 5%", card: "150 15% 8%", foreground: "0 0% 98%", mutedForeground: "150 10% 60%" },
};

const BACKGROUND_STYLES_LIGHT = {
  default: { background: "0 0% 100%", card: "0 0% 98%", foreground: "0 0% 4%", mutedForeground: "0 0% 45%" },
  charcoal: { background: "0 0% 96%", card: "0 0% 100%", foreground: "0 0% 4%", mutedForeground: "0 0% 45%" },
  midnight: { background: "220 20% 98%", card: "220 20% 100%", foreground: "220 20% 10%", mutedForeground: "220 10% 45%" },
  forest: { background: "150 15% 97%", card: "150 15% 100%", foreground: "150 15% 8%", mutedForeground: "150 10% 45%" },
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
    const isDark = theme === "dark";
    if (isDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    // Apply accent color
    const accent = ACCENT_COLORS[accentColor as keyof typeof ACCENT_COLORS] || ACCENT_COLORS["#00FF88"];
    root.style.setProperty("--primary", accent.primary);
    root.style.setProperty("--primary-foreground", accent.primaryForeground);

    // Apply background style based on theme
    const bgStyles = isDark ? BACKGROUND_STYLES_DARK : BACKGROUND_STYLES_LIGHT;
    const bg = bgStyles[backgroundStyle as keyof typeof bgStyles] || bgStyles.default;
    root.style.setProperty("--background", bg.background);
    root.style.setProperty("--card", bg.card);
    root.style.setProperty("--foreground", bg.foreground);
    root.style.setProperty("--muted-foreground", bg.mutedForeground);
    
    // Additional light/dark specific styles
    if (isDark) {
      root.style.setProperty("--border", "0 0% 15%");
      root.style.setProperty("--muted", "0 0% 15%");
      root.style.setProperty("--popover", bg.card);
      root.style.setProperty("--popover-foreground", bg.foreground);
    } else {
      root.style.setProperty("--border", "0 0% 90%");
      root.style.setProperty("--muted", "0 0% 96%");
      root.style.setProperty("--popover", bg.card);
      root.style.setProperty("--popover-foreground", bg.foreground);
    }
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
