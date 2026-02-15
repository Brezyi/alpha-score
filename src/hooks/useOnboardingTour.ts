import { useCallback, useEffect, useState } from "react";
import { useOnboardingTour as useOnboardingTourContext } from "@/components/onboarding/OnboardingTourProvider";
import {
  dashboardTourSteps,
  uploadTourSteps,
  lifestyleTourSteps,
  progressTourSteps,
  filterAvailableSteps,
} from "@/components/onboarding/tourSteps";
import type { TourStep } from "@/components/onboarding/tourSteps";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// ── Shared helpers ───────────────────────────────────────

const LS_PREFIX = "glowmaxxed-tour-completed-";

function isTourCompletedLocal(tourId: string): boolean {
  try {
    return localStorage.getItem(`${LS_PREFIX}${tourId}`) === "true";
  } catch {
    return false;
  }
}

function markTourCompletedLocal(tourId: string) {
  try {
    localStorage.setItem(`${LS_PREFIX}${tourId}`, "true");
  } catch {
    /* ignore */
  }
}

/** Persist completed tour to the user's profile (best-effort). */
async function syncTourToDb(userId: string | undefined, tourId: string) {
  if (!userId) return;
  try {
    // Read current
    const { data } = await supabase
      .from("profiles")
      .select("completed_tours")
      .eq("user_id", userId)
      .single();

    const current: string[] = (data as any)?.completed_tours ?? [];
    if (current.includes(tourId)) return;

    await supabase
      .from("profiles")
      .update({ completed_tours: [...current, tourId] } as any)
      .eq("user_id", userId);
  } catch {
    /* best-effort */
  }
}

/** Load completed tours from DB and hydrate localStorage. */
async function hydrateTourStatusFromDb(userId: string | undefined) {
  if (!userId) return;
  try {
    const { data } = await supabase
      .from("profiles")
      .select("completed_tours")
      .eq("user_id", userId)
      .single();

    const tours: string[] = (data as any)?.completed_tours ?? [];
    tours.forEach((t) => markTourCompletedLocal(t));
  } catch {
    /* best-effort */
  }
}

// ── Generic page tour hook ───────────────────────────────

function usePageTour(tourId: string, allSteps: TourStep[]) {
  const { startTour, isActive } = useOnboardingTourContext();
  const { user } = useAuth();
  const [hasCompleted, setHasCompleted] = useState(() => isTourCompletedLocal(tourId));

  // Hydrate from DB on mount
  useEffect(() => {
    if (user?.id) {
      hydrateTourStatusFromDb(user.id).then(() => {
        setHasCompleted(isTourCompletedLocal(tourId));
      });
    }
  }, [user?.id, tourId]);

  // Mark completed when tour ends
  useEffect(() => {
    if (!isActive && !hasCompleted) {
      const wasStarted = localStorage.getItem("tour-was-started");
      if (wasStarted) {
        markTourCompletedLocal(tourId);
        syncTourToDb(user?.id, tourId);
        localStorage.removeItem("tour-was-started");
        setHasCompleted(true);
      }
    }
  }, [isActive, hasCompleted, tourId, user?.id]);

  useEffect(() => {
    if (isActive) {
      try { localStorage.setItem("tour-was-started", "true"); } catch { /* */ }
    }
  }, [isActive]);

  const autoStartTour = useCallback(() => {
    if (hasCompleted || isActive) return;
    const timer = setTimeout(() => {
      const available = filterAvailableSteps(allSteps);
      if (available.length > 0) startTour(available);
    }, 1500);
    return () => clearTimeout(timer);
  }, [hasCompleted, isActive, startTour, allSteps]);

  const startManualTour = useCallback(() => {
    const available = filterAvailableSteps(allSteps);
    if (available.length > 0) startTour(available);
  }, [startTour, allSteps]);

  const resetTour = useCallback(() => {
    try { localStorage.removeItem(`${LS_PREFIX}${tourId}`); } catch { /* */ }
    setHasCompleted(false);
  }, [tourId]);

  return { autoStartTour, startManualTour, resetTour, hasCompletedTour: hasCompleted, isActive };
}

// ── Exported per-page hooks ──────────────────────────────

export function useDashboardTour() {
  return usePageTour("dashboard", dashboardTourSteps);
}

export function useUploadTour() {
  return usePageTour("upload", uploadTourSteps);
}

export function useLifestyleTour() {
  return usePageTour("lifestyle", lifestyleTourSteps);
}

export function useProgressTour() {
  return usePageTour("progress", progressTourSteps);
}
