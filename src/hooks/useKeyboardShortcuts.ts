import { useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  action: () => void;
  description: string;
}

/**
 * Hook for global keyboard shortcuts
 * Use sparingly to avoid conflicts with browser defaults
 */
export function useKeyboardShortcuts(shortcuts: ShortcutConfig[], enabled = true) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;
      
      // Don't trigger shortcuts when typing in inputs
      const target = event.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      for (const shortcut of shortcuts) {
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatch = shortcut.ctrl ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey;
        const altMatch = shortcut.alt ? event.altKey : !event.altKey;
        const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;

        if (keyMatch && ctrlMatch && altMatch && shiftMatch) {
          event.preventDefault();
          shortcut.action();
          break;
        }
      }
    },
    [shortcuts, enabled]
  );

  useEffect(() => {
    if (enabled) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [handleKeyDown, enabled]);
}

/**
 * Pre-configured navigation shortcuts for the dashboard
 */
export function useDashboardShortcuts() {
  const navigate = useNavigate();

  const shortcuts: ShortcutConfig[] = [
    {
      key: "n",
      description: "Neue Analyse starten",
      action: () => navigate("/upload"),
    },
    {
      key: "p",
      description: "Plan öffnen",
      action: () => navigate("/plan"),
    },
    {
      key: "c",
      description: "Coach öffnen",
      action: () => navigate("/coach"),
    },
    {
      key: "d",
      description: "Dashboard öffnen",
      action: () => navigate("/dashboard"),
    },
    {
      key: "?",
      shift: true,
      description: "Hilfe anzeigen",
      action: () => {
        // Could open a help modal
        console.log("Help shortcut triggered");
      },
    },
  ];

  useKeyboardShortcuts(shortcuts);

  return shortcuts;
}
