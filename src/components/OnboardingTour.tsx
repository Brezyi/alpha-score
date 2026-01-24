import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  target?: string; // CSS selector for element to highlight
  position?: "top" | "bottom" | "left" | "right";
}

interface OnboardingTourProps {
  steps: OnboardingStep[];
  storageKey: string;
  children?: ReactNode;
}

const OnboardingContext = createContext<{
  startTour: () => void;
  skipTour: () => void;
  isActive: boolean;
}>({
  startTour: () => {},
  skipTour: () => {},
  isActive: false,
});

export function useOnboardingTour() {
  return useContext(OnboardingContext);
}

export function OnboardingTourProvider({
  steps,
  storageKey,
  children,
}: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [hasSeenTour, setHasSeenTour] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(`onboarding-${storageKey}`) === "completed";
    }
    return false;
  });

  const startTour = () => {
    setCurrentStep(0);
    setIsActive(true);
  };

  const skipTour = () => {
    setIsActive(false);
    localStorage.setItem(`onboarding-${storageKey}`, "completed");
    setHasSeenTour(true);
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      skipTour();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  // Auto-start tour for new users
  useEffect(() => {
    if (!hasSeenTour && steps.length > 0) {
      // Delay slightly to let the page render
      const timer = setTimeout(() => {
        startTour();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [hasSeenTour, steps.length]);

  const step = steps[currentStep];

  return (
    <OnboardingContext.Provider value={{ startTour, skipTour, isActive }}>
      {children}
      
      <Dialog open={isActive} onOpenChange={(open) => !open && skipTour()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{step?.title}</span>
              <span className="text-xs text-muted-foreground font-normal">
                {currentStep + 1} / {steps.length}
              </span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <p className="text-muted-foreground leading-relaxed">
              {step?.description}
            </p>
          </div>

          {/* Progress dots */}
          <div className="flex items-center justify-center gap-1.5 mb-4">
            {steps.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentStep
                    ? "bg-primary w-4"
                    : index < currentStep
                    ? "bg-primary/50"
                    : "bg-muted"
                }`}
              />
            ))}
          </div>

          <div className="flex items-center justify-between gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={skipTour}
              className="text-muted-foreground"
            >
              Überspringen
            </Button>
            
            <div className="flex items-center gap-2">
              {currentStep > 0 && (
                <Button variant="outline" size="sm" onClick={prevStep}>
                  Zurück
                </Button>
              )}
              <Button size="sm" onClick={nextStep}>
                {currentStep === steps.length - 1 ? "Fertig" : "Weiter"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </OnboardingContext.Provider>
  );
}
