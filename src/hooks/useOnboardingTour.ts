import { useCallback, useEffect, useState } from "react";
import { useOnboardingTour as useOnboardingTourContext, dashboardTourSteps } from "@/components/onboarding/OnboardingTour";

const TOUR_COMPLETED_KEY = "glowmaxxed-dashboard-tour-completed";

export function useDashboardTour() {
  const { startTour, isActive, endTour } = useOnboardingTourContext();
  const [hasCompletedTour, setHasCompletedTour] = useState(() => {
    try {
      return localStorage.getItem(TOUR_COMPLETED_KEY) === "true";
    } catch {
      return false;
    }
  });

  // Start tour automatically for new users after a delay
  const autoStartTour = useCallback(() => {
    if (hasCompletedTour || isActive) return;
    
    // Wait for DOM to be ready
    const timer = setTimeout(() => {
      // Only keep steps that actually exist on the current dashboard.
      // This prevents mismatches like "Level & XP" highlighting unrelated cards
      // and avoids dead steps (e.g. discover-link on desktop).
      const availableSteps = dashboardTourSteps.filter((step) => {
        try {
          return !!document.querySelector(step.target);
        } catch {
          return false;
        }
      });

      startTour(availableSteps.length > 0 ? availableSteps : dashboardTourSteps);
    }, 1500);

    return () => clearTimeout(timer);
  }, [hasCompletedTour, isActive, startTour]);

  // Mark tour as completed when it ends
  useEffect(() => {
    if (!isActive && !hasCompletedTour) {
      // Check if tour was actually started before
      const wasStarted = localStorage.getItem("tour-was-started");
      if (wasStarted) {
        try {
          localStorage.setItem(TOUR_COMPLETED_KEY, "true");
          localStorage.removeItem("tour-was-started");
          setHasCompletedTour(true);
        } catch {
          // Ignore localStorage errors
        }
      }
    }
  }, [isActive, hasCompletedTour]);

  // Mark tour as started when it begins
  useEffect(() => {
    if (isActive) {
      try {
        localStorage.setItem("tour-was-started", "true");
      } catch {
        // Ignore localStorage errors
      }
    }
  }, [isActive]);

  const startManualTour = useCallback(() => {
    const availableSteps = dashboardTourSteps.filter((step) => {
      try {
        return !!document.querySelector(step.target);
      } catch {
        return false;
      }
    });

    startTour(availableSteps.length > 0 ? availableSteps : dashboardTourSteps);
  }, [startTour]);

  const resetTour = useCallback(() => {
    try {
      localStorage.removeItem(TOUR_COMPLETED_KEY);
      setHasCompletedTour(false);
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  return {
    autoStartTour,
    startManualTour,
    resetTour,
    hasCompletedTour,
    isActive,
  };
}
