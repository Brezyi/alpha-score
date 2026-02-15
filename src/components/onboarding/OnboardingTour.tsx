/**
 * Barrel re-export so existing imports keep working.
 *
 *   import { OnboardingTourProvider, useOnboardingTour } from "@/components/onboarding/OnboardingTour";
 *   import { dashboardTourSteps } from "@/components/onboarding/OnboardingTour";
 */

export { OnboardingTourProvider, useOnboardingTour } from "./OnboardingTourProvider";
export {
  dashboardTourSteps,
  uploadTourSteps,
  lifestyleTourSteps,
  progressTourSteps,
  filterAvailableSteps,
} from "./tourSteps";
export type { TourStep } from "./tourSteps";
