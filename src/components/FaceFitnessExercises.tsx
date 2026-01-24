import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Play, RotateCcw, Timer, Info, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

// Import exercise images
import mewingImg from "@/assets/face-fitness/mewing.jpg";
import jawlineImg from "@/assets/face-fitness/jawline-exercise.jpg";
import cheekImg from "@/assets/face-fitness/cheek-exercise.jpg";
import neckImg from "@/assets/face-fitness/neck-posture.jpg";
import foreheadImg from "@/assets/face-fitness/forehead-exercise.jpg";
import lipImg from "@/assets/face-fitness/lip-exercise.jpg";

interface Exercise {
  id: string;
  name: string;
  description: string;
  duration: string;
  reps: string;
  image: string;
  benefits: string[];
  instructions: string[];
}

const EXERCISES: Exercise[] = [
  {
    id: "mewing",
    name: "Mewing",
    description: "Korrekte Zungenposition für definierte Gesichtszüge",
    duration: "Ganztägig",
    reps: "Konstant halten",
    image: mewingImg,
    benefits: [
      "Definierte Jawline",
      "Verbesserte Gesichtsstruktur",
      "Bessere Atmung",
      "Reduziertes Doppelkinn"
    ],
    instructions: [
      "Zunge flach gegen den Gaumen pressen",
      "Die gesamte Zunge sollte den Gaumen berühren",
      "Lippen leicht geschlossen halten",
      "Zähne leicht zusammen oder minimal geöffnet",
      "Diese Position den ganzen Tag halten"
    ]
  },
  {
    id: "jawline",
    name: "Jawline Clenches",
    description: "Kräftigung der Kiefermuskulatur für markante Jawline",
    duration: "5 Min",
    reps: "3x20 Wiederholungen",
    image: jawlineImg,
    benefits: [
      "Stärkere Kiefermuskulatur",
      "Definiertere Jawline",
      "Reduziertes Gesichtsfett",
      "Markanteres Profil"
    ],
    instructions: [
      "Zähne zusammenpressen und halten",
      "Kaumuskulatur (Masseter) anspannen",
      "5 Sekunden halten, dann entspannen",
      "20 Wiederholungen pro Satz",
      "3 Sätze täglich"
    ]
  },
  {
    id: "cheek",
    name: "Wangen-Straffung",
    description: "Übung für straffere Wangenpartie",
    duration: "3 Min",
    reps: "2x15 Wiederholungen",
    image: cheekImg,
    benefits: [
      "Straffere Wangen",
      "Definierte Wangenknochen",
      "Jugendlicheres Aussehen",
      "Bessere Durchblutung"
    ],
    instructions: [
      "Wangen nach innen saugen (Fischgesicht)",
      "Position 5 Sekunden halten",
      "Dann Wangen aufblasen und halten",
      "Zwischen beiden Positionen wechseln",
      "15 Wiederholungen pro Satz"
    ]
  },
  {
    id: "neck",
    name: "Chin Tucks",
    description: "Haltungskorrektur für Nacken und Kinn",
    duration: "5 Min",
    reps: "3x10 Wiederholungen",
    image: neckImg,
    benefits: [
      "Bessere Haltung",
      "Reduziertes Doppelkinn",
      "Gestreckte Nackenmuskulatur",
      "Definierter Kieferbereich"
    ],
    instructions: [
      "Aufrecht stehen oder sitzen",
      "Kinn zurückziehen (Doppelkinn machen)",
      "Hinterkopf nach oben strecken",
      "10 Sekunden halten",
      "10 Wiederholungen pro Satz"
    ]
  },
  {
    id: "forehead",
    name: "Stirn-Lifting",
    description: "Straffung der Stirnmuskulatur",
    duration: "3 Min",
    reps: "2x12 Wiederholungen",
    image: foreheadImg,
    benefits: [
      "Straffere Stirn",
      "Weniger Falten",
      "Wacherer Blick",
      "Angehobene Augenbrauen"
    ],
    instructions: [
      "Augenbrauen nach oben ziehen",
      "Augen weit öffnen",
      "Position 5 Sekunden halten",
      "Langsam entspannen",
      "12 Wiederholungen pro Satz"
    ]
  },
  {
    id: "lips",
    name: "Lippen-Übung",
    description: "Kräftigung der Mundpartie",
    duration: "3 Min",
    reps: "2x15 Wiederholungen",
    image: lipImg,
    benefits: [
      "Vollere Lippen",
      "Straffere Mundpartie",
      "Bessere Durchblutung",
      "Definierte Lippenkontur"
    ],
    instructions: [
      "Lippen zu einem 'O' formen",
      "So weit wie möglich nach vorne strecken",
      "5 Sekunden halten",
      "Dann breit lächeln und halten",
      "Zwischen beiden wechseln"
    ]
  }
];

interface FaceFitnessExercisesProps {
  className?: string;
}

export function FaceFitnessExercises({ className }: FaceFitnessExercisesProps) {
  const [completedExercises, setCompletedExercises] = useState<Set<string>>(new Set());
  const [expandedExercise, setExpandedExercise] = useState<string | null>(null);
  const [activeTimer, setActiveTimer] = useState<string | null>(null);

  const toggleComplete = (exerciseId: string) => {
    setCompletedExercises(prev => {
      const next = new Set(prev);
      if (next.has(exerciseId)) {
        next.delete(exerciseId);
      } else {
        next.add(exerciseId);
      }
      return next;
    });
  };

  const toggleExpanded = (exerciseId: string) => {
    setExpandedExercise(prev => prev === exerciseId ? null : exerciseId);
  };

  const completedCount = completedExercises.size;
  const totalCount = EXERCISES.length;
  const progressPercent = (completedCount / totalCount) * 100;

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header with Progress */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold flex items-center gap-2">
            <span className="text-2xl">💪</span>
            Face Fitness
          </h3>
          <p className="text-sm text-muted-foreground">
            Tägliche Übungen für definierte Gesichtszüge
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-primary">
            {completedCount}/{totalCount}
          </div>
          <div className="text-xs text-muted-foreground">Heute erledigt</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative h-2 bg-muted rounded-full overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0 bg-primary rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>

      {/* Exercise Cards */}
      <div className="grid gap-4">
        {EXERCISES.map((exercise, index) => {
          const isCompleted = completedExercises.has(exercise.id);
          const isExpanded = expandedExercise === exercise.id;

          return (
            <motion.div
              key={exercise.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card
                className={cn(
                  "overflow-hidden transition-all duration-300 border",
                  isCompleted 
                    ? "border-primary/50 bg-primary/5" 
                    : "border-border hover:border-primary/30"
                )}
              >
                {/* Main Row */}
                <div className="flex items-center gap-4 p-4">
                  {/* Exercise Image */}
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-muted">
                    <img
                      src={exercise.image}
                      alt={exercise.name}
                      className="w-full h-full object-cover"
                    />
                    {isCompleted && (
                      <div className="absolute inset-0 bg-primary/80 flex items-center justify-center">
                        <Check className="w-6 h-6 text-primary-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Exercise Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className={cn(
                      "font-semibold transition-colors",
                      isCompleted && "text-primary"
                    )}>
                      {exercise.name}
                    </h4>
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {exercise.description}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Timer className="w-3 h-3" />
                        {exercise.duration}
                      </span>
                      <span className="flex items-center gap-1">
                        <RotateCcw className="w-3 h-3" />
                        {exercise.reps}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => toggleExpanded(exercise.id)}
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      variant={isCompleted ? "default" : "outline"}
                      size="sm"
                      className="h-8"
                      onClick={() => toggleComplete(exercise.id)}
                    >
                      {isCompleted ? (
                        <>
                          <Check className="w-4 h-4 mr-1" />
                          Erledigt
                        </>
                      ) : (
                        "Fertig"
                      )}
                    </Button>
                  </div>
                </div>

                {/* Expanded Details */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 pt-0 border-t border-border/50">
                        <div className="grid md:grid-cols-2 gap-4 mt-4">
                          {/* Benefits */}
                          <div>
                            <h5 className="text-sm font-semibold mb-2 flex items-center gap-1">
                              <span className="text-primary">✨</span> Vorteile
                            </h5>
                            <ul className="space-y-1">
                              {exercise.benefits.map((benefit, i) => (
                                <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                  {benefit}
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Instructions */}
                          <div>
                            <h5 className="text-sm font-semibold mb-2 flex items-center gap-1">
                              <span className="text-primary">📋</span> Anleitung
                            </h5>
                            <ol className="space-y-1">
                              {exercise.instructions.map((instruction, i) => (
                                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                  <span className="text-primary font-medium text-xs mt-0.5">{i + 1}.</span>
                                  {instruction}
                                </li>
                              ))}
                            </ol>
                          </div>
                        </div>

                        {/* Large Image Preview */}
                        <div className="mt-4 rounded-xl overflow-hidden bg-muted">
                          <img
                            src={exercise.image}
                            alt={exercise.name}
                            className="w-full h-48 object-contain"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Completion Message */}
      <AnimatePresence>
        {completedCount === totalCount && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="text-center py-6"
          >
            <div className="text-4xl mb-2">🎉</div>
            <h4 className="text-lg font-bold text-primary">Alle Übungen erledigt!</h4>
            <p className="text-sm text-muted-foreground">
              Großartig! Komm morgen wieder für deinen nächsten Trainingstag.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}