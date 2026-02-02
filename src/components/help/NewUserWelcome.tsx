import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Sparkles, X, ArrowRight, Camera, Target, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface NewUserWelcomeProps {
  onStartTour: () => void;
  onDismiss: () => void;
}

const STEPS = [
  {
    icon: Camera,
    title: "Fotos hochladen",
    description: "Die KI analysiert deine Proportionen",
  },
  {
    icon: TrendingUp,
    title: "Score erhalten",
    description: "Sieh dein Potential",
  },
  {
    icon: Target,
    title: "Plan umsetzen",
    description: "Sichtbare Verbesserungen",
  },
];

export function NewUserWelcome({ onStartTour, onDismiss }: NewUserWelcomeProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Small delay before showing
    const timer = setTimeout(() => setIsVisible(true), 500);
    return () => clearTimeout(timer);
  }, []);

  const handleStartTour = () => {
    setIsVisible(false);
    setTimeout(onStartTour, 300);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(onDismiss, 300);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className={cn(
            "fixed bottom-24 sm:bottom-8 left-4 right-4 sm:left-auto sm:right-8 z-50",
            "sm:max-w-sm"
          )}
        >
          <div className="bg-card border border-border rounded-2xl shadow-xl overflow-hidden">
            {/* Header */}
            <div className="relative bg-gradient-to-r from-primary/20 to-primary/10 p-4">
              <button
                onClick={handleDismiss}
                className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-background/50 transition-colors"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Willkommen! 👋</h3>
                  <p className="text-xs text-muted-foreground">
                    Lass uns dir zeigen, wie alles funktioniert
                  </p>
                </div>
              </div>
            </div>

            {/* Steps Preview */}
            <div className="p-4 space-y-3">
              <div className="flex gap-2">
                {STEPS.map((step, index) => (
                  <div
                    key={index}
                    className="flex-1 p-2.5 rounded-xl bg-muted/50 text-center"
                  >
                    <step.icon className="w-5 h-5 mx-auto mb-1.5 text-primary" />
                    <p className="text-[10px] font-medium leading-tight">
                      {step.title}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDismiss}
                  className="flex-1 text-muted-foreground"
                >
                  Später
                </Button>
                <Button
                  size="sm"
                  onClick={handleStartTour}
                  className="flex-1 gap-1.5"
                >
                  Tour starten
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
