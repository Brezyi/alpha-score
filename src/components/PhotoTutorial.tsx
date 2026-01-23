import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Check, 
  X, 
  ChevronLeft, 
  ChevronRight,
  Camera,
  Sun,
  User,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import tutorialFrontGood from "@/assets/tutorial-front-good.jpg";
import tutorialSideGood from "@/assets/tutorial-side-good.jpg";
import tutorialBodyGood from "@/assets/tutorial-body-good.jpg";
import tutorialBadSunglasses from "@/assets/tutorial-bad-sunglasses.jpg";
import tutorialBadLighting from "@/assets/tutorial-bad-lighting.jpg";

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  image: string;
  isGood: boolean;
  tips: string[];
}

const tutorialSteps: TutorialStep[] = [
  {
    id: "front",
    title: "Frontalfoto",
    description: "Blicke direkt in die Kamera mit neutralem Gesichtsausdruck",
    image: tutorialFrontGood,
    isGood: true,
    tips: [
      "Kamera auf Augenhöhe halten",
      "Natürliches Tageslicht nutzen",
      "Neutraler Ausdruck, nicht lächeln",
      "Haare aus dem Gesicht"
    ]
  },
  {
    id: "side",
    title: "Seitenprofil",
    description: "90° Profil-Ansicht für Kieferlinien-Analyse",
    image: tutorialSideGood,
    isGood: true,
    tips: [
      "Exakt 90° zur Seite schauen",
      "Kinn leicht angehoben",
      "Ohr sollte sichtbar sein",
      "Gleiche Beleuchtung wie frontal"
    ]
  },
  {
    id: "body",
    title: "Körperfoto",
    description: "Ganzkörperaufnahme für vollständige Analyse",
    image: tutorialBodyGood,
    isGood: true,
    tips: [
      "Gesamten Körper im Bild",
      "Aufrechte, natürliche Haltung",
      "Arme locker an der Seite",
      "Kamera auf Brusthöhe"
    ]
  },
  {
    id: "bad-accessories",
    title: "Keine Accessoires",
    description: "Diese Fotos können nicht analysiert werden",
    image: tutorialBadSunglasses,
    isGood: false,
    tips: [
      "Keine Sonnenbrillen/Masken",
      "Keine starken Filter",
      "Keine Gruppenfotos",
      "Keine unscharfen Bilder"
    ]
  },
  {
    id: "bad-lighting",
    title: "Schlechte Beleuchtung",
    description: "Vermeide harte Schatten und dunkle Aufnahmen",
    image: tutorialBadLighting,
    isGood: false,
    tips: [
      "Kein direktes Sonnenlicht",
      "Keine harten Schatten",
      "Nicht zu dunkel",
      "Gleichmäßiges Licht bevorzugen"
    ]
  }
];

interface PhotoTutorialProps {
  onComplete?: () => void;
  className?: string;
}

export function PhotoTutorial({ onComplete, className }: PhotoTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isExpanded, setIsExpanded] = useState(true);

  const step = tutorialSteps[currentStep];
  const isLastStep = currentStep === tutorialSteps.length - 1;
  const isFirstStep = currentStep === 0;

  const handleNext = () => {
    if (isLastStep) {
      setIsExpanded(false);
      onComplete?.();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirstStep) {
      setCurrentStep(prev => prev - 1);
    }
  };

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className={cn(
          "w-full p-3 rounded-xl bg-primary/10 border border-primary/20 flex items-center gap-3 hover:bg-primary/15 transition-colors text-left",
          className
        )}
      >
        <Camera className="w-5 h-5 text-primary flex-shrink-0" />
        <span className="text-sm font-medium">Tutorial anzeigen</span>
        <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
      </button>
    );
  }

  return (
    <Card className={cn("overflow-hidden border-primary/20", className)}>
      <CardContent className="p-0">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-primary/10 to-primary/5 border-b border-primary/10">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-primary" />
              <span className="font-semibold">Foto-Tutorial</span>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Ausblenden
            </button>
          </div>
          
          {/* Progress dots */}
          <div className="flex items-center gap-2">
            {tutorialSteps.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  index === currentStep 
                    ? "bg-primary w-6" 
                    : "bg-primary/30 w-1.5 hover:bg-primary/50"
                )}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="flex gap-4">
            {/* Image */}
            <div className="relative flex-shrink-0">
              <div className={cn(
                "w-24 h-32 rounded-lg overflow-hidden border-2",
                step.isGood ? "border-primary" : "border-destructive"
              )}>
                <img 
                  src={step.image} 
                  alt={step.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className={cn(
                "absolute -bottom-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center",
                step.isGood ? "bg-primary" : "bg-destructive"
              )}>
                {step.isGood ? (
                  <Check className="w-4 h-4 text-primary-foreground" />
                ) : (
                  <X className="w-4 h-4 text-destructive-foreground" />
                )}
              </div>
            </div>

            {/* Text content */}
            <div className="flex-1 min-w-0">
              <h3 className={cn(
                "font-bold text-lg mb-1",
                step.isGood ? "text-foreground" : "text-destructive"
              )}>
                {step.title}
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                {step.description}
              </p>

              {/* Tips */}
              <div className="space-y-1.5">
                {step.tips.map((tip, index) => (
                  <div key={index} className="flex items-start gap-2 text-xs">
                    {step.isGood ? (
                      <Check className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
                    ) : (
                      <X className="w-3.5 h-3.5 text-destructive flex-shrink-0 mt-0.5" />
                    )}
                    <span className="text-muted-foreground">{tip}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="p-4 pt-0 flex items-center justify-between gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePrev}
            disabled={isFirstStep}
            className="gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
            Zurück
          </Button>

          <span className="text-xs text-muted-foreground">
            {currentStep + 1} / {tutorialSteps.length}
          </span>

          <Button
            variant={isLastStep ? "default" : "ghost"}
            size="sm"
            onClick={handleNext}
            className="gap-1"
          >
            {isLastStep ? (
              <>
                <Sparkles className="w-4 h-4" />
                Verstanden
              </>
            ) : (
              <>
                Weiter
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
