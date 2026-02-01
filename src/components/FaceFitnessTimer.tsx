import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useFaceFitness } from "@/hooks/useFaceFitness";
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Check,
  Volume2,
  VolumeX
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface FaceFitnessTimerProps {
  exerciseKey: string;
  exerciseName: string;
  defaultDuration?: number; // in seconds
  onComplete?: () => void;
  className?: string;
}

export function FaceFitnessTimer({ 
  exerciseKey, 
  exerciseName,
  defaultDuration = 300, // 5 minutes default
  onComplete,
  className 
}: FaceFitnessTimerProps) {
  const { logSession } = useFaceFitness();
  const [timeRemaining, setTimeRemaining] = useState(defaultDuration);
  const [isRunning, setIsRunning] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const elapsedBeforePauseRef = useRef(0);

  const playSound = useCallback((type: "tick" | "complete") => {
    if (!soundEnabled) return;
    
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      if (type === "complete") {
        // Victory sound - ascending notes
        oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
        oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1); // E5
        oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2); // G5
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
      } else {
        // Tick sound
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
      }
    } catch {
      // Audio not supported on this device
    }
  }, [soundEnabled]);

  const handleComplete = useCallback(async () => {
    setIsRunning(false);
    setIsCompleted(true);
    playSound("complete");
    
    const totalElapsed = elapsedBeforePauseRef.current + 
      (startTimeRef.current ? Math.floor((Date.now() - startTimeRef.current) / 1000) : 0);
    
    await logSession(exerciseKey, Math.max(totalElapsed, defaultDuration - timeRemaining));
    onComplete?.();
  }, [exerciseKey, defaultDuration, timeRemaining, logSession, onComplete, playSound]);

  useEffect(() => {
    if (isRunning && timeRemaining > 0) {
      startTimeRef.current = Date.now();
      
      intervalRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleComplete();
            return 0;
          }
          // Play tick sound at 10, 5, 4, 3, 2, 1 seconds
          if ([10, 5, 4, 3, 2, 1].includes(prev - 1)) {
            playSound("tick");
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, handleComplete, playSound]);

  const toggleTimer = () => {
    if (isRunning) {
      // Pause
      elapsedBeforePauseRef.current += startTimeRef.current 
        ? Math.floor((Date.now() - startTimeRef.current) / 1000) 
        : 0;
      startTimeRef.current = null;
    }
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeRemaining(defaultDuration);
    setIsCompleted(false);
    elapsedBeforePauseRef.current = 0;
    startTimeRef.current = null;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const progress = ((defaultDuration - timeRemaining) / defaultDuration) * 100;
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-6">
        <div className="text-center">
          {/* Timer Display */}
          <div className="relative w-32 h-32 mx-auto mb-4">
            {/* Background Circle */}
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="45"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-muted"
              />
              {/* Progress Circle */}
              <motion.circle
                cx="64"
                cy="64"
                r="45"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
                className={cn(
                  "transition-all duration-300",
                  isCompleted ? "text-success" : "text-primary"
                )}
                style={{
                  strokeDasharray: circumference,
                  strokeDashoffset,
                }}
              />
            </svg>
            
            {/* Time Text */}
            <div className="absolute inset-0 flex items-center justify-center">
              <AnimatePresence mode="wait">
                {isCompleted ? (
                  <motion.div
                    key="complete"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="text-success"
                  >
                    <Check className="w-12 h-12" strokeWidth={3} />
                  </motion.div>
                ) : (
                  <motion.span
                    key="time"
                    className={cn(
                      "text-2xl font-mono font-bold",
                      timeRemaining <= 10 && isRunning && "text-primary animate-pulse"
                    )}
                  >
                    {formatTime(timeRemaining)}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Exercise Name */}
          <h3 className="font-bold mb-1">{exerciseName}</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {isCompleted ? "Abgeschlossen!" : isRunning ? "Läuft..." : "Bereit"}
          </p>

          {/* Controls */}
          <div className="flex items-center justify-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full"
              onClick={() => setSoundEnabled(!soundEnabled)}
            >
              {soundEnabled ? (
                <Volume2 className="w-5 h-5" />
              ) : (
                <VolumeX className="w-5 h-5 text-muted-foreground" />
              )}
            </Button>

            {!isCompleted && (
              <Button
                size="lg"
                className={cn(
                  "h-14 w-14 rounded-full",
                  isRunning && "bg-warning hover:bg-warning/90"
                )}
                onClick={toggleTimer}
              >
                {isRunning ? (
                  <Pause className="w-6 h-6" />
                ) : (
                  <Play className="w-6 h-6 ml-0.5" />
                )}
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full"
              onClick={resetTimer}
            >
              <RotateCcw className="w-5 h-5" />
            </Button>
          </div>

          {/* Quick Time Presets */}
          {!isRunning && !isCompleted && (
            <div className="flex justify-center gap-2 mt-4">
              {[60, 180, 300, 600].map((seconds) => (
                <Button
                  key={seconds}
                  variant={timeRemaining === seconds ? "default" : "outline"}
                  size="sm"
                  className="text-xs"
                  onClick={() => setTimeRemaining(seconds)}
                >
                  {seconds < 60 ? `${seconds}s` : `${seconds / 60}m`}
                </Button>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
