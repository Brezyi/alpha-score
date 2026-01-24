import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Check, Play, Pause, RotateCcw, Timer, ChevronDown, ChevronUp, Sparkles, Flame, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

// Import exercise videos
import mewingVideo from "@/assets/face-fitness/mewing-video.mp4";
import jawlineVideo from "@/assets/face-fitness/jawline-video.mp4";
import cheekVideo from "@/assets/face-fitness/cheek-video.mp4";
import neckVideo from "@/assets/face-fitness/neck-video.mp4";
import foreheadVideo from "@/assets/face-fitness/forehead-video.mp4";
import lipVideo from "@/assets/face-fitness/lip-video.mp4";

// Import fallback images
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
  video: string;
  benefits: string[];
  instructions: string[];
  difficulty: "easy" | "medium" | "hard";
  targetArea: string;
}

const EXERCISES: Exercise[] = [
  {
    id: "mewing",
    name: "Mewing",
    description: "Korrekte Zungenposition für definierte Gesichtszüge",
    duration: "Ganztägig",
    reps: "Konstant halten",
    image: mewingImg,
    video: mewingVideo,
    difficulty: "easy",
    targetArea: "Kiefer & Gesicht",
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
    video: jawlineVideo,
    difficulty: "medium",
    targetArea: "Kiefer",
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
    video: cheekVideo,
    difficulty: "easy",
    targetArea: "Wangen",
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
    video: neckVideo,
    difficulty: "medium",
    targetArea: "Nacken & Kinn",
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
    video: foreheadVideo,
    difficulty: "easy",
    targetArea: "Stirn",
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
    video: lipVideo,
    difficulty: "easy",
    targetArea: "Lippen & Mund",
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

const difficultyConfig = {
  easy: { label: "Leicht", color: "text-green-400", bg: "bg-green-500/20" },
  medium: { label: "Mittel", color: "text-yellow-400", bg: "bg-yellow-500/20" },
  hard: { label: "Schwer", color: "text-red-400", bg: "bg-red-500/20" }
};

interface FaceFitnessExercisesProps {
  className?: string;
}

export function FaceFitnessExercises({ className }: FaceFitnessExercisesProps) {
  const [completedExercises, setCompletedExercises] = useState<Set<string>>(new Set());
  const [expandedExercise, setExpandedExercise] = useState<string | null>(null);
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({});

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
    setExpandedExercise(prev => {
      if (prev === exerciseId) {
        // Stop video when collapsing
        if (videoRefs.current[exerciseId]) {
          videoRefs.current[exerciseId]!.pause();
          setPlayingVideo(null);
        }
        return null;
      }
      return exerciseId;
    });
  };

  const toggleVideo = (exerciseId: string) => {
    const video = videoRefs.current[exerciseId];
    if (!video) return;

    if (playingVideo === exerciseId) {
      video.pause();
      setPlayingVideo(null);
    } else {
      // Pause any other playing video
      Object.entries(videoRefs.current).forEach(([id, v]) => {
        if (id !== exerciseId && v) v.pause();
      });
      video.play();
      setPlayingVideo(exerciseId);
    }
  };

  const completedCount = completedExercises.size;
  const totalCount = EXERCISES.length;
  const progressPercent = (completedCount / totalCount) * 100;

  return (
    <div className={cn("space-y-6", className)}>
      {/* Premium Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent p-6 border border-primary/20">
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl" />
        
        <div className="relative flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/25">
                <Sparkles className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                  Face Fitness
                </h3>
                <p className="text-sm text-muted-foreground">
                  Tägliches Training für definierte Gesichtszüge
                </p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="text-right">
            <div className="text-3xl font-bold text-primary tabular-nums">
              {completedCount}<span className="text-muted-foreground/50">/{totalCount}</span>
            </div>
            <div className="text-xs text-muted-foreground flex items-center justify-end gap-1">
              <Flame className="w-3 h-3 text-orange-400" />
              Heute erledigt
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4 relative">
          <div className="h-3 bg-background/50 rounded-full overflow-hidden backdrop-blur-sm">
            <motion.div
              className="h-full bg-gradient-to-r from-primary via-primary to-primary/80 rounded-full relative"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.7, ease: "easeOut" }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
            </motion.div>
          </div>
          <div className="flex justify-between mt-1 text-xs text-muted-foreground">
            <span>Start</span>
            <span className="text-primary font-medium">{Math.round(progressPercent)}%</span>
            <span>Ziel</span>
          </div>
        </div>
      </div>

      {/* Exercise Cards Grid */}
      <div className="grid gap-4">
        {EXERCISES.map((exercise, index) => {
          const isCompleted = completedExercises.has(exercise.id);
          const isExpanded = expandedExercise === exercise.id;
          const isPlaying = playingVideo === exercise.id;
          const difficulty = difficultyConfig[exercise.difficulty];

          return (
            <motion.div
              key={exercise.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
            >
              <div
                className={cn(
                  "relative overflow-hidden rounded-2xl transition-all duration-500",
                  "bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-sm",
                  "border",
                  isCompleted 
                    ? "border-primary/50 shadow-lg shadow-primary/10" 
                    : "border-border/50 hover:border-primary/30 hover:shadow-md"
                )}
              >
                {/* Completion Glow */}
                {isCompleted && (
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5 pointer-events-none" />
                )}

                {/* Main Row */}
                <div className="relative flex items-center gap-4 p-4">
                  {/* Video Thumbnail */}
                  <div 
                    className={cn(
                      "relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 cursor-pointer group",
                      "ring-2 ring-border/50 hover:ring-primary/50 transition-all"
                    )}
                    onClick={() => {
                      if (!isExpanded) toggleExpanded(exercise.id);
                    }}
                  >
                    <img
                      src={exercise.image}
                      alt={exercise.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Play className="w-6 h-6 text-white" fill="white" />
                    </div>
                    {isCompleted && (
                      <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute inset-0 bg-primary/90 flex items-center justify-center"
                      >
                        <Check className="w-8 h-8 text-primary-foreground" strokeWidth={3} />
                      </motion.div>
                    )}
                  </div>

                  {/* Exercise Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className={cn(
                        "font-bold text-base transition-colors",
                        isCompleted && "text-primary"
                      )}>
                        {exercise.name}
                      </h4>
                      <span className={cn(
                        "text-[10px] font-medium px-1.5 py-0.5 rounded-full",
                        difficulty.bg, difficulty.color
                      )}>
                        {difficulty.label}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
                      {exercise.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <Timer className="w-3.5 h-3.5 text-primary/70" />
                        {exercise.duration}
                      </span>
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <RotateCcw className="w-3.5 h-3.5 text-primary/70" />
                        {exercise.reps}
                      </span>
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <Target className="w-3.5 h-3.5 text-primary/70" />
                        {exercise.targetArea}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 rounded-full hover:bg-primary/10"
                      onClick={() => toggleExpanded(exercise.id)}
                    >
                      <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <ChevronDown className="w-5 h-5" />
                      </motion.div>
                    </Button>
                    <Button
                      variant={isCompleted ? "default" : "outline"}
                      size="sm"
                      className={cn(
                        "h-9 rounded-full font-medium transition-all",
                        isCompleted && "shadow-lg shadow-primary/25"
                      )}
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
                      transition={{ duration: 0.4, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-5 pt-2 border-t border-border/30">
                        {/* Video Player */}
                        <div className="relative rounded-xl overflow-hidden bg-black/90 mb-5 group">
                          <video
                            ref={(el) => { videoRefs.current[exercise.id] = el; }}
                            src={exercise.video}
                            className="w-full aspect-square object-contain"
                            loop
                            playsInline
                            muted
                            poster={exercise.image}
                            onEnded={() => setPlayingVideo(null)}
                          />
                          
                          {/* Play/Pause Overlay */}
                          <div 
                            className={cn(
                              "absolute inset-0 flex items-center justify-center cursor-pointer transition-opacity",
                              isPlaying ? "opacity-0 hover:opacity-100" : "opacity-100"
                            )}
                            onClick={() => toggleVideo(exercise.id)}
                          >
                            <div className={cn(
                              "w-16 h-16 rounded-full flex items-center justify-center transition-transform hover:scale-110",
                              "bg-primary/90 backdrop-blur-sm shadow-2xl shadow-primary/50"
                            )}>
                              {isPlaying ? (
                                <Pause className="w-7 h-7 text-primary-foreground" fill="currentColor" />
                              ) : (
                                <Play className="w-7 h-7 text-primary-foreground ml-1" fill="currentColor" />
                              )}
                            </div>
                          </div>

                          {/* Video Label */}
                          <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-sm text-xs text-white font-medium">
                            Video-Anleitung
                          </div>
                        </div>

                        {/* Benefits & Instructions Grid */}
                        <div className="grid md:grid-cols-2 gap-5">
                          {/* Benefits */}
                          <div className="space-y-3">
                            <h5 className="text-sm font-bold flex items-center gap-2">
                              <div className="w-6 h-6 rounded-lg bg-primary/20 flex items-center justify-center">
                                <Sparkles className="w-3.5 h-3.5 text-primary" />
                              </div>
                              Vorteile
                            </h5>
                            <ul className="space-y-2">
                              {exercise.benefits.map((benefit, i) => (
                                <motion.li 
                                  key={i} 
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: i * 0.1 }}
                                  className="text-sm text-muted-foreground flex items-center gap-2.5"
                                >
                                  <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                                  {benefit}
                                </motion.li>
                              ))}
                            </ul>
                          </div>

                          {/* Instructions */}
                          <div className="space-y-3">
                            <h5 className="text-sm font-bold flex items-center gap-2">
                              <div className="w-6 h-6 rounded-lg bg-primary/20 flex items-center justify-center">
                                <Target className="w-3.5 h-3.5 text-primary" />
                              </div>
                              Anleitung
                            </h5>
                            <ol className="space-y-2">
                              {exercise.instructions.map((instruction, i) => (
                                <motion.li 
                                  key={i} 
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: i * 0.1 }}
                                  className="text-sm text-muted-foreground flex items-start gap-2.5"
                                >
                                  <span className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 text-xs font-bold text-primary">
                                    {i + 1}
                                  </span>
                                  {instruction}
                                </motion.li>
                              ))}
                            </ol>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Completion Celebration */}
      <AnimatePresence>
        {completedCount === totalCount && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/30 via-primary/20 to-primary/10 border border-primary/30 p-6 text-center"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent animate-shimmer" />
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.2, 1] }}
              transition={{ duration: 0.5 }}
              className="text-5xl mb-3"
            >
              🎉
            </motion.div>
            <h4 className="text-xl font-bold text-primary mb-1">
              Alle Übungen erledigt!
            </h4>
            <p className="text-sm text-muted-foreground">
              Großartig! Komm morgen wieder für deinen nächsten Trainingstag.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => setCompletedExercises(new Set())}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Training zurücksetzen
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
