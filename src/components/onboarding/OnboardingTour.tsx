import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, ChevronLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TourStep {
  id: string;
  target: string; // CSS selector or element ID
  title: string;
  description: string;
  position?: "top" | "bottom" | "left" | "right";
  spotlightPadding?: number;
}

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

interface OnboardingTourProviderProps {
  children: ReactNode;
}

export function OnboardingTourProvider({ children }: OnboardingTourProviderProps) {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<TourStep[]>([]);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const startTour = useCallback((tourSteps: TourStep[]) => {
    setSteps(tourSteps);
    setCurrentStep(0);
    setIsActive(true);
  }, []);

  const endTour = useCallback(() => {
    setIsActive(false);
    setCurrentStep(0);
    setSteps([]);
    setTargetRect(null);
  }, []);

  const nextStep = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      endTour();
    }
  }, [currentStep, steps.length, endTour]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const skipTour = useCallback(() => {
    // Mark as completed in localStorage
    localStorage.setItem("onboarding-completed", "true");
    endTour();
  }, [endTour]);

  // Update target rect when step changes
  useEffect(() => {
    if (!isActive || steps.length === 0) return;

    const currentStepData = steps[currentStep];
    if (!currentStepData) return;

    const findTarget = () => {
      const target = document.querySelector(currentStepData.target);
      if (target) {
        const rect = target.getBoundingClientRect();
        setTargetRect(rect);
        
        // Scroll target into view if needed
        target.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    };

    // Small delay to allow DOM to settle
    const timer = setTimeout(findTarget, 100);
    
    // Update on resize
    window.addEventListener("resize", findTarget);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", findTarget);
    };
  }, [isActive, currentStep, steps]);

  const currentStepData = steps[currentStep];
  const padding = currentStepData?.spotlightPadding ?? 8;

  // Calculate tooltip position
  const getTooltipPosition = () => {
    if (!targetRect) return { top: "50%", left: "50%" };

    const position = currentStepData?.position || "bottom";
    const tooltipWidth = 300;
    const tooltipHeight = 150;
    const gap = 12;

    let top = 0;
    let left = 0;

    switch (position) {
      case "top":
        top = targetRect.top - tooltipHeight - gap;
        left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
        break;
      case "bottom":
        top = targetRect.bottom + gap;
        left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
        break;
      case "left":
        top = targetRect.top + targetRect.height / 2 - tooltipHeight / 2;
        left = targetRect.left - tooltipWidth - gap;
        break;
      case "right":
        top = targetRect.top + targetRect.height / 2 - tooltipHeight / 2;
        left = targetRect.right + gap;
        break;
    }

    // Keep within viewport
    top = Math.max(16, Math.min(top, window.innerHeight - tooltipHeight - 16));
    left = Math.max(16, Math.min(left, window.innerWidth - tooltipWidth - 16));

    return { top: `${top}px`, left: `${left}px` };
  };

  return (
    <OnboardingTourContext.Provider value={{
      isActive,
      currentStep,
      steps,
      startTour,
      endTour,
      nextStep,
      prevStep,
      skipTour,
    }}>
      {children}

      <AnimatePresence>
        {isActive && currentStepData && (
          <>
            {/* Overlay with spotlight cutout */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9998] pointer-events-auto"
              onClick={skipTour}
              style={{
                background: targetRect
                  ? `radial-gradient(ellipse ${targetRect.width + padding * 2}px ${targetRect.height + padding * 2}px at ${targetRect.left + targetRect.width / 2}px ${targetRect.top + targetRect.height / 2}px, transparent 0%, rgba(0, 0, 0, 0.8) 100%)`
                  : "rgba(0, 0, 0, 0.8)",
              }}
            />

            {/* Spotlight border */}
            {targetRect && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="fixed z-[9999] border-2 border-primary rounded-xl pointer-events-none"
                style={{
                  top: targetRect.top - padding,
                  left: targetRect.left - padding,
                  width: targetRect.width + padding * 2,
                  height: targetRect.height + padding * 2,
                  boxShadow: "0 0 0 4px hsl(var(--primary) / 0.2), 0 0 20px hsl(var(--primary) / 0.3)",
                }}
              />
            )}

            {/* Tooltip */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="fixed z-[10000] w-[300px] p-4 bg-card border border-border rounded-2xl shadow-xl"
              style={getTooltipPosition()}
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {currentStep + 1} / {steps.length}
                  </span>
                </div>
                <button
                  onClick={skipTour}
                  className="p-1 hover:bg-muted rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              {/* Content */}
              <h4 className="font-bold text-lg mb-2">{currentStepData.title}</h4>
              <p className="text-sm text-muted-foreground mb-4">
                {currentStepData.description}
              </p>

              {/* Navigation */}
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={prevStep}
                  disabled={currentStep === 0}
                  className={cn(currentStep === 0 && "invisible")}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Zurück
                </Button>

                <Button
                  size="sm"
                  onClick={nextStep}
                  className="gap-1"
                >
                  {currentStep === steps.length - 1 ? "Fertig" : "Weiter"}
                  {currentStep < steps.length - 1 && (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </Button>
              </div>

              {/* Skip link */}
              <button
                onClick={skipTour}
                className="w-full text-center text-xs text-muted-foreground mt-3 hover:text-foreground transition-colors"
              >
                Tour überspringen
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </OnboardingTourContext.Provider>
  );
}

// Pre-defined tour steps for different pages
export const dashboardTourSteps: TourStep[] = [
  {
    id: "welcome",
    target: "[data-tour='score-card']",
    title: "Dein Looks Score",
    description: "Hier siehst du deinen aktuellen Score und deine Entwicklung über Zeit.",
    position: "bottom",
  },
  {
    id: "quick-actions",
    target: "[data-tour='quick-actions']",
    title: "Schnellzugriff",
    description: "Starte eine neue Analyse, tracke deinen Lifestyle oder chatte mit dem AI Coach.",
    position: "top",
  },
  {
    id: "gamification",
    target: "[data-tour='gamification']",
    title: "Dein Fortschritt",
    description: "Sammle XP, schließe Challenges ab und schalte Achievements frei.",
    position: "top",
  },
];

export const uploadTourSteps: TourStep[] = [
  {
    id: "upload-area",
    target: "[data-tour='upload-area']",
    title: "Fotos hochladen",
    description: "Lade 3 Fotos hoch: frontal, seitlich und ganzkörper für die beste Analyse.",
    position: "bottom",
  },
  {
    id: "guidelines",
    target: "[data-tour='photo-guidelines']",
    title: "Foto-Tipps",
    description: "Befolge diese Tipps für die genaueste Analyse.",
    position: "left",
  },
];
