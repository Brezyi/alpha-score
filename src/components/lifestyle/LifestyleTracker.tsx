import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useLifestyle } from "@/hooks/useLifestyle";
import { 
  Droplets, 
  Dumbbell, 
  Check,
  Loader2,
  Activity,
  Moon,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { startOfWeek, addDays, isSameDay, isToday, isBefore } from "date-fns";

interface LifestyleTrackerProps {
  className?: string;
  compact?: boolean;
}

const DAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

interface DayStatus {
  date: Date;
  label: string;
  sleep: number | null;
  water: number | null;
  exercise: number | null;
  isToday: boolean;
  isPast: boolean;
  sleepGoalMet: boolean;
  waterGoalMet: boolean;
  exerciseGoalMet: boolean;
  allGoalsMet: boolean;
}

export function LifestyleTracker({ className, compact = false }: LifestyleTrackerProps) {
  const { todayEntry, entries, loading, updateTodayEntry } = useLifestyle();
  const [sleepHours, setSleepHours] = useState(7);
  const [waterLiters, setWaterLiters] = useState(2);
  const [exerciseMinutes, setExerciseMinutes] = useState(0);
  const [saving, setSaving] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate week days with their status
  const weekDays = useMemo((): DayStatus[] => {
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    
    return DAYS.map((label, index) => {
      const date = addDays(weekStart, index);
      const entry = entries.find(e => isSameDay(new Date(e.entry_date), date));
      
      const sleep = entry?.sleep_hours ?? null;
      const water = entry?.water_liters ?? null;
      const exercise = entry?.exercise_minutes ?? null;
      
      const sleepGoalMet = sleep !== null && sleep >= 7;
      const waterGoalMet = water !== null && water >= 2;
      const exerciseGoalMet = exercise !== null && exercise >= 30;
      
      return {
        date,
        label,
        sleep,
        water,
        exercise,
        isToday: isToday(date),
        isPast: isBefore(date, today) && !isToday(date),
        sleepGoalMet,
        waterGoalMet,
        exerciseGoalMet,
        allGoalsMet: sleepGoalMet && waterGoalMet && exerciseGoalMet,
      };
    });
  }, [entries]);

  // Calculate weekly stats
  const weeklyStats = useMemo(() => {
    const daysWithAllGoals = weekDays.filter(d => d.allGoalsMet).length;
    const daysWithSleep = weekDays.filter(d => d.sleepGoalMet).length;
    const daysWithWater = weekDays.filter(d => d.waterGoalMet).length;
    const daysWithExercise = weekDays.filter(d => d.exerciseGoalMet).length;
    
    return {
      perfectDays: daysWithAllGoals,
      sleepDays: daysWithSleep,
      waterDays: daysWithWater,
      exerciseDays: daysWithExercise,
    };
  }, [weekDays]);

  // Update local state when todayEntry changes
  useEffect(() => {
    if (todayEntry && !initialized) {
      setSleepHours(todayEntry.sleep_hours ?? 7);
      setWaterLiters(todayEntry.water_liters ?? 2);
      setExerciseMinutes(todayEntry.exercise_minutes ?? 0);
      setInitialized(true);
    }
  }, [todayEntry, initialized]);

  // Auto-save with debounce
  const autoSave = useCallback(async (sleep: number, water: number, exercise: number) => {
    if (!initialized) return;
    
    setSaving(true);
    const success = await updateTodayEntry({
      sleep_hours: sleep,
      water_liters: water,
      exercise_minutes: exercise
    });
    setSaving(false);
    
    if (success) {
      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 2000);
    }
  }, [updateTodayEntry, initialized]);

  const handleValueChange = (type: 'sleep' | 'water' | 'exercise', value: number) => {
    if (type === 'sleep') setSleepHours(value);
    if (type === 'water') setWaterLiters(value);
    if (type === 'exercise') setExerciseMinutes(value);
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      const newSleep = type === 'sleep' ? value : sleepHours;
      const newWater = type === 'water' ? value : waterLiters;
      const newExercise = type === 'exercise' ? value : exerciseMinutes;
      autoSave(newSleep, newWater, newExercise);
    }, 800);
  };

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
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <div className="w-9 h-9 rounded-full bg-indigo-500/20 flex items-center justify-center mx-auto mb-1">
                <Moon className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="text-sm font-bold">{todayEntry?.sleep_hours ?? "-"}h</div>
              <div className="text-[10px] text-muted-foreground">Schlaf</div>
            </div>
            <div className="text-center">
              <div className="w-9 h-9 rounded-full bg-cyan-500/20 flex items-center justify-center mx-auto mb-1">
                <Droplets className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-sm font-bold">{todayEntry?.water_liters ?? "-"}L</div>
              <div className="text-[10px] text-muted-foreground">Wasser</div>
            </div>
            <div className="text-center">
              <div className="w-9 h-9 rounded-full bg-orange-500/20 flex items-center justify-center mx-auto mb-1">
                <Dumbbell className="w-4 h-4 text-orange-400" />
              </div>
              <div className="text-sm font-bold">{todayEntry?.exercise_minutes ?? "-"}m</div>
              <div className="text-[10px] text-muted-foreground">Training</div>
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
          Lifestyle Tracker
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
        {/* Weekly Overview */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Diese Woche</span>
            <span className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Moon className="w-3 h-3 text-indigo-400" />
                {weeklyStats.sleepDays}/7
              </span>
              <span className="flex items-center gap-1">
                <Droplets className="w-3 h-3 text-cyan-400" />
                {weeklyStats.waterDays}/7
              </span>
              <span className="flex items-center gap-1">
                <Dumbbell className="w-3 h-3 text-orange-400" />
                {weeklyStats.exerciseDays}/7
              </span>
            </span>
          </div>
          
          {/* Week Grid */}
          <div className="grid grid-cols-7 gap-1.5">
            {weekDays.map((day) => {
              const goalsCount = [day.sleepGoalMet, day.waterGoalMet, day.exerciseGoalMet].filter(Boolean).length;
              const hasAnyData = day.sleep !== null || day.water !== null || day.exercise !== null;
              
              return (
                <div key={day.label} className="text-center">
                  <div className={cn(
                    "text-[10px] font-medium mb-1",
                    day.isToday ? "text-primary font-bold" : "text-muted-foreground"
                  )}>
                    {day.label}
                  </div>
                  <div className={cn(
                    "aspect-square rounded-lg p-1 flex flex-col items-center justify-center gap-0.5 transition-all",
                    day.isToday && "ring-2 ring-primary ring-offset-1 ring-offset-background",
                    day.allGoalsMet && "bg-green-500/10",
                    !day.isPast && !day.isToday && "opacity-40"
                  )}>
                    {/* Sleep */}
                    <div className={cn(
                      "w-4 h-4 rounded flex items-center justify-center",
                      day.sleepGoalMet 
                        ? "bg-indigo-500/30" 
                        : hasAnyData || day.isPast || day.isToday
                          ? "bg-muted/80"
                          : "bg-muted/30"
                    )}>
                      {day.sleep !== null ? (
                        day.sleepGoalMet ? (
                          <Check className="w-2.5 h-2.5 text-indigo-400" />
                        ) : (
                          <X className="w-2.5 h-2.5 text-muted-foreground/60" />
                        )
                      ) : (day.isPast || day.isToday) ? (
                        <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                      ) : null}
                    </div>
                    {/* Water */}
                    <div className={cn(
                      "w-4 h-4 rounded flex items-center justify-center",
                      day.waterGoalMet 
                        ? "bg-cyan-500/30" 
                        : hasAnyData || day.isPast || day.isToday
                          ? "bg-muted/80"
                          : "bg-muted/30"
                    )}>
                      {day.water !== null ? (
                        day.waterGoalMet ? (
                          <Check className="w-2.5 h-2.5 text-cyan-400" />
                        ) : (
                          <X className="w-2.5 h-2.5 text-muted-foreground/60" />
                        )
                      ) : (day.isPast || day.isToday) ? (
                        <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                      ) : null}
                    </div>
                    {/* Exercise */}
                    <div className={cn(
                      "w-4 h-4 rounded flex items-center justify-center",
                      day.exerciseGoalMet 
                        ? "bg-orange-500/30" 
                        : hasAnyData || day.isPast || day.isToday
                          ? "bg-muted/80"
                          : "bg-muted/30"
                    )}>
                      {day.exercise !== null ? (
                        day.exerciseGoalMet ? (
                          <Check className="w-2.5 h-2.5 text-orange-400" />
                        ) : (
                          <X className="w-2.5 h-2.5 text-muted-foreground/60" />
                        )
                      ) : (day.isPast || day.isToday) ? (
                        <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Legend */}
          <div className="flex items-center justify-center gap-4 text-[10px] text-muted-foreground pt-1">
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-indigo-500/30" />
              ≥7h Schlaf
            </span>
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-cyan-500/30" />
              ≥2L Wasser
            </span>
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-orange-500/30" />
              ≥30min
            </span>
          </div>
        </div>

        <div className="h-px bg-border" />

        {/* Today's Input */}
        <div className="space-y-4">
          <div className="text-sm font-medium text-center text-muted-foreground">Heute eintragen</div>
          
          {/* Sleep */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2 text-sm">
                <Moon className="w-4 h-4 text-indigo-400" />
                Schlaf
              </Label>
              <span className="text-sm font-bold">{sleepHours}h</span>
            </div>
            <Slider
              value={[sleepHours]}
              onValueChange={([v]) => handleValueChange('sleep', v)}
              min={0}
              max={12}
              step={0.5}
              className="py-1"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>0h</span>
              <span className={cn(
                sleepHours >= 7 ? "text-green-400" : sleepHours >= 6 ? "text-amber-400" : "text-red-400"
              )}>
                {sleepHours >= 7 ? "✓ Optimal" : sleepHours >= 6 ? "OK" : "Zu wenig"}
              </span>
              <span>12h</span>
            </div>
          </div>

          {/* Water */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2 text-sm">
                <Droplets className="w-4 h-4 text-cyan-400" />
                Wasser
              </Label>
              <span className="text-sm font-bold">{waterLiters}L</span>
            </div>
            <Slider
              value={[waterLiters]}
              onValueChange={([v]) => handleValueChange('water', v)}
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
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2 text-sm">
                <Dumbbell className="w-4 h-4 text-orange-400" />
                Training
              </Label>
              <span className="text-sm font-bold">{exerciseMinutes} Min</span>
            </div>
            <Slider
              value={[exerciseMinutes]}
              onValueChange={([v]) => handleValueChange('exercise', v)}
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
        </div>
      </CardContent>
    </Card>
  );
}
