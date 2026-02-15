import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  Target, Dumbbell, Sparkles, Heart, Brain,
  ArrowRight, ArrowLeft, Check
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";

interface OnboardingWizardProps {
  open: boolean;
  onComplete: (goals: string[]) => void;
}

const GOALS = [
  { id: "looks", icon: Sparkles, label: "Aussehen optimieren", desc: "KI-Analyse & personalisierter Plan" },
  { id: "fitness", icon: Dumbbell, label: "Fitter werden", desc: "Training, Ernährung & Body Tracking" },
  { id: "skin", icon: Heart, label: "Hautbild verbessern", desc: "Skincare-Routinen & Produktempfehlungen" },
  { id: "confidence", icon: Brain, label: "Selbstbewusstsein stärken", desc: "Fortschritt messen & Motivation" },
] as const;

const TIPS = [
  {
    title: "Lade 3 Fotos hoch",
    desc: "Frontal, Seite und Körper – für die genaueste Analyse.",
    icon: "📸",
  },
  {
    title: "Folge deinem Plan",
    desc: "Die KI erstellt Prioritäten basierend auf deinen Stärken & Schwächen.",
    icon: "📋",
  },
  {
    title: "Tracke täglich",
    desc: "Wasser, Schlaf und Ernährung – kleine Gewohnheiten, große Wirkung.",
    icon: "📊",
  },
];

export function OnboardingWizard({ open, onComplete }: OnboardingWizardProps) {
  const [step, setStep] = useState(0);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);

  const toggleGoal = (id: string) => {
    setSelectedGoals((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  };

  const handleComplete = () => {
    onComplete(selectedGoals.length > 0 ? selectedGoals : ["looks"]);
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-lg" hideCloseButton>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            {step === 0 ? "Was sind deine Ziele?" : "Quick-Start Tipps"}
          </DialogTitle>
          <DialogDescription>
            {step === 0
              ? "Wähle, was dir wichtig ist – wir passen alles darauf an."
              : "So holst du das Maximum aus der App."}
          </DialogDescription>
        </DialogHeader>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 py-2">
          {[0, 1].map((s) => (
            <div
              key={s}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                s === step ? "w-8 bg-primary" : "w-2 bg-muted-foreground/30"
              )}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 0 ? (
            <motion.div
              key="goals"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-3 py-2"
            >
              {GOALS.map((goal) => {
                const Icon = goal.icon;
                const selected = selectedGoals.includes(goal.id);
                return (
                  <button
                    key={goal.id}
                    onClick={() => toggleGoal(goal.id)}
                    className={cn(
                      "w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left",
                      selected
                        ? "border-primary bg-primary/10 shadow-sm"
                        : "border-border bg-card hover:border-primary/30"
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                      selected ? "bg-primary/20" : "bg-muted"
                    )}>
                      <Icon className={cn("w-5 h-5", selected ? "text-primary" : "text-muted-foreground")} />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{goal.label}</p>
                      <p className="text-xs text-muted-foreground">{goal.desc}</p>
                    </div>
                    {selected && (
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 text-primary-foreground" />
                      </div>
                    )}
                  </button>
                );
              })}

              <Button
                onClick={() => setStep(1)}
                disabled={selectedGoals.length === 0}
                className="w-full mt-4 gap-2"
                size="lg"
              >
                Weiter
                <ArrowRight className="w-4 h-4" />
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="tips"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4 py-2"
            >
              {TIPS.map((tip, i) => (
                <div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-muted/40 border border-border/50">
                  <span className="text-2xl">{tip.icon}</span>
                  <div>
                    <p className="font-medium text-sm">{tip.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{tip.desc}</p>
                  </div>
                </div>
              ))}

              <div className="flex gap-2 mt-4">
                <Button variant="ghost" onClick={() => setStep(0)} className="gap-1">
                  <ArrowLeft className="w-4 h-4" />Zurück
                </Button>
                <Button onClick={handleComplete} className="flex-1 gap-2" size="lg">
                  App starten
                  <Sparkles className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
