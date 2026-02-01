import { useState, useEffect, useCallback } from "react";

type HintKey = 
  | "dashboard_tour"
  | "lifestyle_tabs"
  | "gamification_xp"
  | "coach_intro"
  | "friends_partner"
  | "progress_timeline"
  | "discover_page";

interface UseFirstTimeHintsReturn {
  shouldShowHint: (key: HintKey) => boolean;
  markHintSeen: (key: HintKey) => void;
  resetHint: (key: HintKey) => void;
  resetAllHints: () => void;
}

const STORAGE_KEY = "glowmaxxed-hints-seen";

export function useFirstTimeHints(): UseFirstTimeHintsReturn {
  const [seenHints, setSeenHints] = useState<Set<HintKey>>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...seenHints]));
  }, [seenHints]);

  const shouldShowHint = useCallback((key: HintKey) => {
    return !seenHints.has(key);
  }, [seenHints]);

  const markHintSeen = useCallback((key: HintKey) => {
    setSeenHints(prev => new Set([...prev, key]));
  }, []);

  const resetHint = useCallback((key: HintKey) => {
    setSeenHints(prev => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  }, []);

  const resetAllHints = useCallback(() => {
    setSeenHints(new Set());
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return {
    shouldShowHint,
    markHintSeen,
    resetHint,
    resetAllHints,
  };
}
