import { useState, useCallback, createContext, useContext, ReactNode } from "react";
import { TourOverlay } from "./TourOverlay";
import type { TourStep } from "./tourSteps";

interface OnboardingTourContextType {
  isActive: boolean;
  currentStep: number;
  steps: TourStep[];
  startTour: (steps: TourStep[]) => void;
  endTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  skipTour: () => void;
}

const OnboardingTourContext = createContext<OnboardingTourContextType | null>(null);

export function useOnboardingTour() {
  const context = useContext(OnboardingTourContext);
  if (!context) {
    throw new Error("useOnboardingTour must be used within OnboardingTourProvider");
  }
  return context;
}

export function OnboardingTourProvider({ children }: { children: ReactNode }) {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<TourStep[]>([]);

  const startTour = useCallback((tourSteps: TourStep[]) => {
    if (tourSteps.length === 0) return; // #2 – don't start with empty steps
    setSteps(tourSteps);
    setCurrentStep(0);
    setIsActive(true);
  }, []);

  const endTour = useCallback(() => {
    setIsActive(false);
    setCurrentStep(0);
    setSteps([]);
  }, []);

  const nextStep = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      endTour();
    }
  }, [currentStep, steps.length, endTour]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) setCurrentStep((prev) => prev - 1);
  }, [currentStep]);

  const skipTour = useCallback(() => {
    localStorage.setItem("onboarding-completed", "true");
    endTour();
  }, [endTour]);

  return (
    <OnboardingTourContext.Provider
      value={{ isActive, currentStep, steps, startTour, endTour, nextStep, prevStep, skipTour }}
    >
      {children}

      {isActive && steps.length > 0 && (
        <TourOverlay
          steps={steps}
          currentStep={currentStep}
          onNext={nextStep}
          onPrev={prevStep}
          onSkip={skipTour}
        />
      )}
    </OnboardingTourContext.Provider>
  );
}
