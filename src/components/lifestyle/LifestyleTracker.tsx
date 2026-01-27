import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useLifestyle } from "@/hooks/useLifestyle";
import { 
  Droplets, 
  Dumbbell, 
  Check,
  Loader2,
  Activity
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface LifestyleTrackerProps {
  className?: string;
  compact?: boolean;
}

export function LifestyleTracker({ className, compact = false }: LifestyleTrackerProps) {
  const { todayEntry, loading, updateTodayEntry } = useLifestyle();
  const [waterLiters, setWaterLiters] = useState(2);
  const [exerciseMinutes, setExerciseMinutes] = useState(0);
  const [saving, setSaving] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Update local state when todayEntry changes
  useEffect(() => {
    if (todayEntry && !initialized) {
      setWaterLiters(todayEntry.water_liters ?? 2);
      setExerciseMinutes(todayEntry.exercise_minutes ?? 0);
      setInitialized(true);
    }
  }, [todayEntry, initialized]);

  // Auto-save with debounce
  const autoSave = useCallback(async (water: number, exercise: number) => {
    if (!initialized) return;
    
    setSaving(true);
    const success = await updateTodayEntry({
      water_liters: water,
      exercise_minutes: exercise
    });
    setSaving(false);
    
    if (success) {
      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 2000);
    }
  }, [updateTodayEntry, initialized]);

  const handleWaterChange = (value: number) => {
    setWaterLiters(value);
    
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    // Set new debounced save
    saveTimeoutRef.current = setTimeout(() => {
      autoSave(value, exerciseMinutes);
    }, 800);
  };

  const handleExerciseChange = (value: number) => {
    setExerciseMinutes(value);
    
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    // Set new debounced save
    saveTimeoutRef.current = setTimeout(() => {
      autoSave(waterLiters, value);
    }, 800);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  if (loading) {
    return (
      <Card className={cn("", className)}>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <Card className={cn("", className)}>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center mx-auto mb-1">
                <Droplets className="w-5 h-5 text-cyan-400" />
              </div>
              <div className="text-lg font-bold">{todayEntry?.water_liters ?? "-"}L</div>
              <div className="text-xs text-muted-foreground">Wasser</div>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center mx-auto mb-1">
                <Dumbbell className="w-5 h-5 text-orange-400" />
              </div>
              <div className="text-lg font-bold">{todayEntry?.exercise_minutes ?? "-"}m</div>
              <div className="text-xs text-muted-foreground">Training</div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Activity className="w-5 h-5 text-primary" />
          Heute
          <AnimatePresence>
            {saving && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="ml-auto"
              >
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              </motion.span>
            )}
            {showSaved && !saving && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="ml-auto flex items-center gap-1 text-xs text-green-500 font-normal"
              >
                <Check className="w-3 h-3" />
                Gespeichert
              </motion.span>
            )}
          </AnimatePresence>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Water */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2 text-sm">
              <Droplets className="w-4 h-4 text-cyan-400" />
              Wasser
            </Label>
            <span className="text-sm font-bold">{waterLiters}L</span>
          </div>
          <Slider
            value={[waterLiters]}
            onValueChange={([v]) => handleWaterChange(v)}
            min={0}
            max={5}
            step={0.25}
            className="py-1"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>0L</span>
            <span className={cn(
              waterLiters >= 2 ? "text-green-400" : waterLiters >= 1.5 ? "text-amber-400" : "text-red-400"
            )}>
              {waterLiters >= 2 ? "✓ Optimal" : waterLiters >= 1.5 ? "OK" : "Zu wenig"}
            </span>
            <span>5L</span>
          </div>
        </div>

        {/* Exercise */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2 text-sm">
              <Dumbbell className="w-4 h-4 text-orange-400" />
              Training
            </Label>
            <span className="text-sm font-bold">{exerciseMinutes} Min</span>
          </div>
          <Slider
            value={[exerciseMinutes]}
            onValueChange={([v]) => handleExerciseChange(v)}
            min={0}
            max={120}
            step={5}
            className="py-1"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>0</span>
            <span className={cn(
              exerciseMinutes >= 30 ? "text-green-400" : exerciseMinutes > 0 ? "text-amber-400" : "text-muted-foreground"
            )}>
              {exerciseMinutes >= 30 ? "✓ Super!" : exerciseMinutes > 0 ? "Weiter so" : ""}
            </span>
            <span>2h</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
