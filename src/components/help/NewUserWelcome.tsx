import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Sparkles, X, ArrowRight, Camera, Target, TrendingUp, Zap, Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface NewUserWelcomeProps {
  onStartTour: () => void;
  onDismiss: () => void;
}

const STEPS = [
  {
    icon: Camera,
    title: "Analyse",
    description: "KI-Bewertung",
    gradient: "from-blue-500 to-cyan-400",
  },
  {
    icon: TrendingUp,
    title: "Score",
    description: "Dein Potential",
    gradient: "from-primary to-emerald-400",
  },
  {
    icon: Target,
    title: "Plan",
    description: "Dein Weg",
    gradient: "from-amber-500 to-orange-400",
  },
];

export function NewUserWelcome({ onStartTour, onDismiss }: NewUserWelcomeProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 800);
    return () => clearTimeout(timer);
  }, []);

  // Auto-cycle through steps
  useEffect(() => {
    if (!isVisible) return;
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % STEPS.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [isVisible]);

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
        <>
          {/* Backdrop blur for emphasis */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/40 backdrop-blur-sm z-40 sm:hidden"
            onClick={handleDismiss}
          />
          
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className={cn(
              "fixed z-50",
              "bottom-24 left-4 right-4",
              "sm:bottom-8 sm:left-auto sm:right-8 sm:max-w-sm"
            )}
          >
            <div className="relative bg-card/95 backdrop-blur-xl border border-border/50 rounded-3xl shadow-2xl shadow-primary/10 overflow-hidden">
              {/* Animated gradient background */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5" />
              <motion.div
                animate={{ 
                  background: [
                    "radial-gradient(circle at 0% 0%, hsl(var(--primary) / 0.15) 0%, transparent 50%)",
                    "radial-gradient(circle at 100% 100%, hsl(var(--primary) / 0.15) 0%, transparent 50%)",
                    "radial-gradient(circle at 0% 0%, hsl(var(--primary) / 0.15) 0%, transparent 50%)",
                  ]
                }}
                transition={{ duration: 5, repeat: Infinity }}
                className="absolute inset-0"
              />

              {/* Header */}
              <div className="relative p-5 pb-4">
                <button
                  onClick={handleDismiss}
                  className="absolute top-4 right-4 p-2 rounded-xl hover:bg-muted/50 transition-colors"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
                
                <div className="flex items-start gap-4">
                  <motion.div 
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", delay: 0.2 }}
                    className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-xl shadow-primary/30"
                  >
                    <Sparkles className="w-7 h-7 text-primary-foreground" />
                  </motion.div>
                  <div className="flex-1 pt-1">
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <h3 className="font-bold text-xl flex items-center gap-2">
                        Willkommen! 
                        <motion.span
                          animate={{ rotate: [0, 14, -8, 14, -4, 10, 0] }}
                          transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 1 }}
                        >
                          👋
                        </motion.span>
                      </h3>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        Entdecke dein volles Potential
                      </p>
                    </motion.div>
                  </div>
                </div>
              </div>

              {/* Steps */}
              <div className="relative px-5 pb-4">
                <div className="flex gap-2">
                  {STEPS.map((step, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 + index * 0.1 }}
                      className={cn(
                        "flex-1 p-3 rounded-2xl text-center transition-all duration-300",
                        currentStep === index 
                          ? "bg-primary/10 border-2 border-primary/30 scale-105" 
                          : "bg-muted/30 border-2 border-transparent"
                      )}
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center",
                        "bg-gradient-to-br shadow-md",
                        step.gradient
                      )}>
                        <step.icon className="w-5 h-5 text-white" />
                      </div>
                      <p className="text-xs font-bold">{step.title}</p>
                      <p className="text-[10px] text-muted-foreground">{step.description}</p>
                    </motion.div>
                  ))}
                </div>

                {/* Progress dots */}
                <div className="flex justify-center gap-1.5 mt-3">
                  {STEPS.map((_, index) => (
                    <motion.div
                      key={index}
                      className={cn(
                        "h-1.5 rounded-full transition-all duration-300",
                        currentStep === index 
                          ? "w-6 bg-primary" 
                          : "w-1.5 bg-muted-foreground/30"
                      )}
                    />
                  ))}
                </div>
              </div>

              {/* Buttons */}
              <div className="relative px-5 pb-5">
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="lg"
                    onClick={handleDismiss}
                    className="flex-1 text-muted-foreground hover:text-foreground"
                  >
                    Später
                  </Button>
                  <Button
                    size="lg"
                    onClick={handleStartTour}
                    className="flex-1 gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/20"
                  >
                    <Zap className="w-4 h-4" />
                    Tour starten
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Decorative stars */}
              <motion.div
                animate={{ 
                  opacity: [0.3, 0.6, 0.3],
                  scale: [1, 1.2, 1],
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute top-3 right-16"
              >
                <Star className="w-3 h-3 text-primary/40 fill-primary/40" />
              </motion.div>
              <motion.div
                animate={{ 
                  opacity: [0.2, 0.5, 0.2],
                  scale: [1, 1.1, 1],
                }}
                transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
                className="absolute top-8 right-20"
              >
                <Star className="w-2 h-2 text-primary/30 fill-primary/30" />
              </motion.div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
