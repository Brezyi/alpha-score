import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { 
  Droplets, 
  Dumbbell, 
  Check,
  Loader2,
  Activity,
  Moon,
  Sun,
  Star,
  X,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Utensils,
  Sparkles,
  Pill
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { startOfWeek, addDays, isSameDay, isToday, isBefore, format, subDays, addWeeks, subWeeks, endOfWeek } from "date-fns";
import { de } from "date-fns/locale";

interface LifestyleTrackerProps {
  className?: string;
  compact?: boolean;
  onDateChange?: (date: Date) => void;
}

const DAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

interface DayStatus {
  date: Date;
  label: string;
  sleep: number | null;
  water: number | null;
  exercise: number | null;
  sleepQuality: number | null;
  sunscreenApplied: boolean;
  nutritionQuality: number | null;
  skincareCompleted: boolean;
  supplementsTaken: boolean;
  isToday: boolean;
  isPast: boolean;
  sleepGoalMet: boolean;
  waterGoalMet: boolean;
  exerciseGoalMet: boolean;
  allGoalsMet: boolean;
}

interface LifestyleEntry {
  id?: string;
  entry_date: string;
  sleep_hours: number | null;
  sleep_bedtime: string | null;
  sleep_waketime: string | null;
  sleep_quality: number | null;
  water_liters: number | null;
  exercise_minutes: number | null;
  sunscreen_applied: boolean;
  nutrition_quality: number | null;
  skincare_routine_completed: boolean;
  supplements_taken: boolean;
}

export function LifestyleTracker({ className, compact = false, onDateChange }: LifestyleTrackerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [entries, setEntries] = useState<LifestyleEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  
  // Week and day navigation state
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  // Form state for selected day
  const [sleepHours, setSleepHours] = useState(7);
  const [bedtime, setBedtime] = useState("23:00");
  const [waketime, setWaketime] = useState("07:00");
  const [sleepQuality, setSleepQuality] = useState(3);
  const [waterLiters, setWaterLiters] = useState(2);
  const [exerciseMinutes, setExerciseMinutes] = useState(0);
  
  // New habit states
  const [sunscreenApplied, setSunscreenApplied] = useState(false);
  const [nutritionQuality, setNutritionQuality] = useState(3);
  const [skincareCompleted, setSkincareCompleted] = useState(false);
  const [supplementsTaken, setSupplementsTaken] = useState(false);
  
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch entries
  const fetchEntries = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("lifestyle_entries")
        .select("id, entry_date, sleep_hours, sleep_bedtime, sleep_waketime, sleep_quality, water_liters, exercise_minutes, sunscreen_applied, nutrition_quality, skincare_routine_completed, supplements_taken")
        .eq("user_id", user.id)
        .order("entry_date", { ascending: false })
        .limit(30);
      
      if (error) throw error;
      setEntries(data || []);
    } catch (error) {
      console.error("Error fetching entries:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  // Calculate sleep duration from times
  const calculateSleepFromTimes = useCallback((bed: string, wake: string): number => {
    if (!bed || !wake) return 0;
    
    const [bedH, bedM] = bed.split(":").map(Number);
    const [wakeH, wakeM] = wake.split(":").map(Number);
    
    let bedMinutes = bedH * 60 + bedM;
    let wakeMinutes = wakeH * 60 + wakeM;
    
    if (wakeMinutes < bedMinutes) {
      wakeMinutes += 24 * 60;
    }
    
    const durationMinutes = wakeMinutes - bedMinutes;
    return Math.round((durationMinutes / 60) * 10) / 10;
  }, []);

  // Load entry data when selected date changes
  useEffect(() => {
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    const entry = entries.find(e => e.entry_date === dateStr);
    
    if (entry) {
      setSleepHours(entry.sleep_hours ?? 7);
      setBedtime(entry.sleep_bedtime ?? "23:00");
      setWaketime(entry.sleep_waketime ?? "07:00");
      setSleepQuality(entry.sleep_quality ?? 3);
      setWaterLiters(entry.water_liters ?? 2);
      setExerciseMinutes(entry.exercise_minutes ?? 0);
      setSunscreenApplied(entry.sunscreen_applied ?? false);
      setNutritionQuality(entry.nutrition_quality ?? 3);
      setSkincareCompleted(entry.skincare_routine_completed ?? false);
      setSupplementsTaken(entry.supplements_taken ?? false);
    } else {
      // Reset to defaults for new entry
      setSleepHours(7);
      setBedtime("23:00");
      setWaketime("07:00");
      setSleepQuality(3);
      setWaterLiters(2);
      setExerciseMinutes(0);
      setSunscreenApplied(false);
      setNutritionQuality(3);
      setSkincareCompleted(false);
      setSupplementsTaken(false);
    }
  }, [selectedDate, entries]);

  // Update sleep hours when times change
  useEffect(() => {
    const calculated = calculateSleepFromTimes(bedtime, waketime);
    setSleepHours(calculated);
  }, [bedtime, waketime, calculateSleepFromTimes]);

  // Calculate week days with their status
  const weekDays = useMemo((): DayStatus[] => {
    const today = new Date();
    
    return DAYS.map((label, index) => {
      const date = addDays(currentWeekStart, index);
      const dateStr = format(date, "yyyy-MM-dd");
      const entry = entries.find(e => e.entry_date === dateStr);
      
      const sleep = entry?.sleep_hours ?? null;
      const water = entry?.water_liters ?? null;
      const exercise = entry?.exercise_minutes ?? null;
      const quality = entry?.sleep_quality ?? null;
      
      const sleepGoalMet = sleep !== null && sleep >= 7;
      const waterGoalMet = water !== null && water >= 2;
      const exerciseGoalMet = exercise !== null && exercise >= 30;
      
      const isPast = isBefore(date, today) && !isToday(date);
      const isFuture = isBefore(today, date);
      
      return {
        date,
        label,
        sleep,
        water,
        exercise,
        sleepQuality: quality,
        sunscreenApplied: entry?.sunscreen_applied ?? false,
        nutritionQuality: entry?.nutrition_quality ?? null,
        skincareCompleted: entry?.skincare_routine_completed ?? false,
        supplementsTaken: entry?.supplements_taken ?? false,
        isToday: isToday(date),
        isPast,
        sleepGoalMet,
        waterGoalMet,
        exerciseGoalMet,
        allGoalsMet: sleepGoalMet && waterGoalMet && exerciseGoalMet,
      };
    });
  }, [entries, currentWeekStart]);

  // Calculate weekly stats
  const weeklyStats = useMemo(() => {
    const daysWithSleep = weekDays.filter(d => d.sleepGoalMet).length;
    const daysWithWater = weekDays.filter(d => d.waterGoalMet).length;
    const daysWithExercise = weekDays.filter(d => d.exerciseGoalMet).length;
    
    return {
      sleepDays: daysWithSleep,
      waterDays: daysWithWater,
      exerciseDays: daysWithExercise,
    };
  }, [weekDays]);

  // Save entry
  const saveEntry = useCallback(async () => {
    if (!user) return;
    
    setSaving(true);
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    
    try {
      const { error } = await supabase
        .from("lifestyle_entries")
        .upsert({
          user_id: user.id,
          entry_date: dateStr,
          sleep_hours: sleepHours,
          sleep_bedtime: bedtime,
          sleep_waketime: waketime,
          sleep_quality: sleepQuality,
          sunscreen_applied: sunscreenApplied,
          nutrition_quality: nutritionQuality,
          skincare_routine_completed: skincareCompleted,
          supplements_taken: supplementsTaken,
          water_liters: waterLiters,
          exercise_minutes: exerciseMinutes
        }, { onConflict: "user_id,entry_date" });
      
      if (error) throw error;
      
      await fetchEntries();
      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 2000);
    } catch (error) {
      console.error("Error saving:", error);
      toast({
        title: "Fehler beim Speichern",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  }, [user, selectedDate, sleepHours, bedtime, waketime, sleepQuality, waterLiters, exerciseMinutes, sunscreenApplied, nutritionQuality, skincareCompleted, supplementsTaken, fetchEntries, toast]);

  // Debounced auto-save
  const handleValueChange = useCallback((type: string, value: number | string | boolean) => {
    switch (type) {
      case 'bedtime':
        setBedtime(value as string);
        break;
      case 'waketime':
        setWaketime(value as string);
        break;
      case 'quality':
        setSleepQuality(value as number);
        break;
      case 'water':
        setWaterLiters(value as number);
        break;
      case 'exercise':
        setExerciseMinutes(value as number);
        break;
      case 'sunscreen':
        setSunscreenApplied(value as boolean);
        break;
      case 'nutrition':
        setNutritionQuality(value as number);
        break;
      case 'skincare':
        setSkincareCompleted(value as boolean);
        break;
      case 'supplements':
        setSupplementsTaken(value as boolean);
        break;
    }
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      saveEntry();
    }, 1000);
  }, [saveEntry]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Check if selected date can be edited (today or past 7 days)
  const canEdit = useMemo(() => {
    const today = new Date();
    const sevenDaysAgo = subDays(today, 7);
    return !isBefore(selectedDate, sevenDaysAgo) && !isBefore(today, selectedDate);
  }, [selectedDate]);

  // Select day
  const handleDaySelect = (date: Date) => {
    const today = new Date();
    if (!isBefore(today, date)) {
      setSelectedDate(date);
      onDateChange?.(date);
    }
  };

  // Navigate days
  const goToPreviousDay = () => {
    const newDate = subDays(selectedDate, 1);
    const sevenDaysAgo = subDays(new Date(), 7);
    if (!isBefore(newDate, sevenDaysAgo)) {
      setSelectedDate(newDate);
    }
  };

  const goToNextDay = () => {
    const newDate = addDays(selectedDate, 1);
    const today = new Date();
    if (!isBefore(today, newDate)) {
      setSelectedDate(newDate);
    }
  };

  // Navigate weeks
  const goToPreviousWeek = () => {
    const newWeekStart = subWeeks(currentWeekStart, 1);
    setCurrentWeekStart(newWeekStart);
  };

  const goToNextWeek = () => {
    const today = new Date();
    const thisWeekStart = startOfWeek(today, { weekStartsOn: 1 });
    // Only allow navigating to current week or past weeks
    if (isBefore(currentWeekStart, thisWeekStart)) {
      const newWeekStart = addWeeks(currentWeekStart, 1);
      setCurrentWeekStart(newWeekStart);
    }
  };

  // Check if we're on the current week
  const isCurrentWeek = useMemo(() => {
    const today = new Date();
    const thisWeekStart = startOfWeek(today, { weekStartsOn: 1 });
    return isSameDay(currentWeekStart, thisWeekStart);
  }, [currentWeekStart]);

  // Format week label
  const weekLabel = useMemo(() => {
    const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 });
    if (isCurrentWeek) {
      return "Diese Woche";
    }
    return `${format(currentWeekStart, "dd. MMM", { locale: de })} - ${format(weekEnd, "dd. MMM", { locale: de })}`;
  }, [currentWeekStart, isCurrentWeek]);

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
              <div className="text-sm font-bold">{entries.find(e => e.entry_date === format(new Date(), "yyyy-MM-dd"))?.sleep_hours ?? "-"}h</div>
              <div className="text-[10px] text-muted-foreground">Schlaf</div>
            </div>
            <div className="text-center">
              <div className="w-9 h-9 rounded-full bg-cyan-500/20 flex items-center justify-center mx-auto mb-1">
                <Droplets className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-sm font-bold">{entries.find(e => e.entry_date === format(new Date(), "yyyy-MM-dd"))?.water_liters ?? "-"}L</div>
              <div className="text-[10px] text-muted-foreground">Wasser</div>
            </div>
            <div className="text-center">
              <div className="w-9 h-9 rounded-full bg-orange-500/20 flex items-center justify-center mx-auto mb-1">
                <Dumbbell className="w-4 h-4 text-orange-400" />
              </div>
              <div className="text-sm font-bold">{entries.find(e => e.entry_date === format(new Date(), "yyyy-MM-dd"))?.exercise_minutes ?? "-"}m</div>
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
          {/* Week Navigation */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={goToPreviousWeek}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm font-medium min-w-[140px] text-center">
                {weekLabel}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={goToNextWeek}
                disabled={isCurrentWeek}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            <span className="flex items-center gap-3 text-xs text-muted-foreground">
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
          
          {/* Week Grid - Clickable */}
          <div className="grid grid-cols-7 gap-1.5">
            {weekDays.map((day) => {
              const isSelected = isSameDay(day.date, selectedDate);
              const canSelect = day.isPast || day.isToday;
              
              return (
                <button
                  key={day.label}
                  onClick={() => canSelect && handleDaySelect(day.date)}
                  disabled={!canSelect}
                  className={cn(
                    "text-center transition-all",
                    canSelect && "cursor-pointer hover:opacity-80",
                    !canSelect && "opacity-40 cursor-not-allowed"
                  )}
                >
                  <div className={cn(
                    "text-[10px] font-medium mb-1",
                    day.isToday ? "text-primary font-bold" : "text-muted-foreground"
                  )}>
                    {day.label}
                  </div>
                  <div className={cn(
                    "aspect-square rounded-lg p-1 flex flex-col items-center justify-center gap-0.5 transition-all",
                    isSelected && "ring-2 ring-primary ring-offset-1 ring-offset-background",
                    day.allGoalsMet && "bg-green-500/10"
                  )}>
                    {/* Sleep */}
                    <div className={cn(
                      "w-4 h-4 rounded flex items-center justify-center",
                      day.sleepGoalMet 
                        ? "bg-indigo-500/30" 
                        : (day.isPast || day.isToday)
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
                        : (day.isPast || day.isToday)
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
                        : (day.isPast || day.isToday)
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
                </button>
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

        {/* Day Selector Header */}
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8"
            onClick={goToPreviousDay}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="text-center">
            <div className="text-sm font-medium">
              {isToday(selectedDate) ? "Heute" : format(selectedDate, "EEEE", { locale: de })}
            </div>
            <div className="text-xs text-muted-foreground">
              {format(selectedDate, "d. MMMM", { locale: de })}
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8"
            onClick={goToNextDay}
            disabled={isToday(selectedDate)}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {canEdit ? (
          <div className="space-y-5">
            {/* Sleep Section */}
            <div className="space-y-3 p-3 rounded-lg bg-indigo-500/5 border border-indigo-500/10">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Moon className="w-4 h-4 text-indigo-400" />
                Schlaf
                <span className="ml-auto text-lg font-bold">{sleepHours}h</span>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs flex items-center gap-1">
                    <Moon className="w-3 h-3 text-indigo-400" />
                    Eingeschlafen
                  </Label>
                  <Input
                    type="time"
                    value={bedtime}
                    onChange={(e) => handleValueChange('bedtime', e.target.value)}
                    className="text-center h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs flex items-center gap-1">
                    <Sun className="w-3 h-3 text-amber-400" />
                    Aufgewacht
                  </Label>
                  <Input
                    type="time"
                    value={waketime}
                    onChange={(e) => handleValueChange('waketime', e.target.value)}
                    className="text-center h-9"
                  />
                </div>
              </div>
              
              {/* Sleep Quality */}
              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1">
                  <Star className="w-3 h-3 text-amber-400" />
                  Qualität
                </Label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      onClick={() => handleValueChange('quality', rating)}
                      className={cn(
                        "flex-1 py-1.5 rounded-md transition-all",
                        sleepQuality >= rating 
                          ? "bg-amber-500/20 border-amber-500/50 border" 
                          : "bg-muted border border-transparent hover:border-muted-foreground/30"
                      )}
                    >
                      <Star 
                        className={cn(
                          "w-3.5 h-3.5 mx-auto",
                          sleepQuality >= rating ? "text-amber-400 fill-amber-400" : "text-muted-foreground"
                        )} 
                      />
                    </button>
                  ))}
                </div>
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

            {/* New Habits Section */}
            <div className="pt-2 border-t border-border space-y-4">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tägliche Habits</h4>
              
              {/* Sunscreen Toggle */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-amber-500/5 border border-amber-500/10">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-medium">Sonnenschutz aufgetragen</span>
                </div>
                <Switch 
                  checked={sunscreenApplied} 
                  onCheckedChange={(v) => handleValueChange('sunscreen', v)} 
                />
              </div>

              {/* Skincare Toggle */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-pink-500/5 border border-pink-500/10">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-pink-500" />
                  <span className="text-sm font-medium">Skincare-Routine erledigt</span>
                </div>
                <Switch 
                  checked={skincareCompleted} 
                  onCheckedChange={(v) => handleValueChange('skincare', v)} 
                />
              </div>

              {/* Supplements Toggle */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/5 border border-green-500/10">
                <div className="flex items-center gap-2">
                  <Pill className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-medium">Supplements genommen</span>
                </div>
                <Switch 
                  checked={supplementsTaken} 
                  onCheckedChange={(v) => handleValueChange('supplements', v)} 
                />
              </div>

              {/* Nutrition Quality */}
              <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Utensils className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm font-medium">Ernährungsqualität</span>
                  </div>
                  <span className="text-sm font-bold">{nutritionQuality}/5</span>
                </div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      onClick={() => handleValueChange('nutrition', rating)}
                      className={cn(
                        "flex-1 py-1.5 rounded-md transition-all text-xs font-medium",
                        nutritionQuality >= rating 
                          ? "bg-emerald-500/20 border-emerald-500/50 border text-emerald-500" 
                          : "bg-muted border border-transparent hover:border-muted-foreground/30 text-muted-foreground"
                      )}
                    >
                      {rating}
                    </button>
                  ))}
                </div>
                <div className="text-[10px] text-muted-foreground text-center">
                  {nutritionQuality <= 2 ? "Viel Junk Food" : nutritionQuality === 3 ? "Gemischt" : nutritionQuality === 4 ? "Überwiegend gesund" : "Perfekt!"}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center text-sm text-muted-foreground py-4">
            Du kannst nur die letzten 7 Tage bearbeiten.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
