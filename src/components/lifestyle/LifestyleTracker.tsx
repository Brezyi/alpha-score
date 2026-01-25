import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useLifestyle } from "@/hooks/useLifestyle";
import { 
  Moon, 
  Droplets, 
  Dumbbell, 
  Check, 
  Loader2,
  TrendingUp,
  Calendar
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface LifestyleTrackerProps {
  className?: string;
  compact?: boolean;
}

export function LifestyleTracker({ className, compact = false }: LifestyleTrackerProps) {
  const { todayEntry, entries, loading, updateTodayEntry } = useLifestyle();
  const [sleepHours, setSleepHours] = useState(todayEntry?.sleep_hours || 7);
  const [waterLiters, setWaterLiters] = useState(todayEntry?.water_liters || 2);
  const [exerciseMinutes, setExerciseMinutes] = useState(todayEntry?.exercise_minutes || 0);
  const [saving, setSaving] = useState(false);

  // Update local state when todayEntry changes
  useState(() => {
    if (todayEntry) {
      setSleepHours(todayEntry.sleep_hours || 7);
      setWaterLiters(todayEntry.water_liters || 2);
      setExerciseMinutes(todayEntry.exercise_minutes || 0);
    }
  });

  const handleSave = async () => {
    setSaving(true);
    await updateTodayEntry({
      sleep_hours: sleepHours,
      water_liters: waterLiters,
      exercise_minutes: exerciseMinutes
    });
    setSaving(false);
  };

  const hasChanges = 
    sleepHours !== (todayEntry?.sleep_hours || 0) ||
    waterLiters !== (todayEntry?.water_liters || 0) ||
    exerciseMinutes !== (todayEntry?.exercise_minutes || 0);

  // Calculate weekly averages
  const last7Days = entries.slice(0, 7);
  const avgSleep = last7Days.length > 0 
    ? (last7Days.reduce((acc, e) => acc + (e.sleep_hours || 0), 0) / last7Days.length).toFixed(1)
    : "0";
  const avgWater = last7Days.length > 0
    ? (last7Days.reduce((acc, e) => acc + (e.water_liters || 0), 0) / last7Days.length).toFixed(1)
    : "0";
  const avgExercise = last7Days.length > 0
    ? Math.round(last7Days.reduce((acc, e) => acc + (e.exercise_minutes || 0), 0) / last7Days.length)
    : 0;

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
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            Heute
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-1">
                <Moon className="w-5 h-5 text-blue-400" />
              </div>
              <div className="text-lg font-bold">{todayEntry?.sleep_hours || "-"}h</div>
              <div className="text-xs text-muted-foreground">Schlaf</div>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center mx-auto mb-1">
                <Droplets className="w-5 h-5 text-cyan-400" />
              </div>
              <div className="text-lg font-bold">{todayEntry?.water_liters || "-"}L</div>
              <div className="text-xs text-muted-foreground">Wasser</div>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center mx-auto mb-1">
                <Dumbbell className="w-5 h-5 text-orange-400" />
              </div>
              <div className="text-lg font-bold">{todayEntry?.exercise_minutes || "-"}m</div>
              <div className="text-xs text-muted-foreground">Training</div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          Lifestyle Tracker
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Sleep */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2">
              <Moon className="w-4 h-4 text-blue-400" />
              Schlaf
            </Label>
            <span className="text-sm font-medium">{sleepHours}h</span>
          </div>
          <Slider
            value={[sleepHours]}
            onValueChange={([v]) => setSleepHours(v)}
            min={0}
            max={12}
            step={0.5}
            className="py-2"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0h</span>
            <span className="text-blue-400">⌀ {avgSleep}h (7 Tage)</span>
            <span>12h</span>
          </div>
        </div>

        {/* Water */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2">
              <Droplets className="w-4 h-4 text-cyan-400" />
              Wasser
            </Label>
            <span className="text-sm font-medium">{waterLiters}L</span>
          </div>
          <Slider
            value={[waterLiters]}
            onValueChange={([v]) => setWaterLiters(v)}
            min={0}
            max={5}
            step={0.25}
            className="py-2"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0L</span>
            <span className="text-cyan-400">⌀ {avgWater}L (7 Tage)</span>
            <span>5L</span>
          </div>
        </div>

        {/* Exercise */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2">
              <Dumbbell className="w-4 h-4 text-orange-400" />
              Training
            </Label>
            <span className="text-sm font-medium">{exerciseMinutes} Min</span>
          </div>
          <Slider
            value={[exerciseMinutes]}
            onValueChange={([v]) => setExerciseMinutes(v)}
            min={0}
            max={180}
            step={5}
            className="py-2"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0 Min</span>
            <span className="text-orange-400">⌀ {avgExercise} Min (7 Tage)</span>
            <span>3h</span>
          </div>
        </div>

        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button 
            onClick={handleSave} 
            className="w-full"
            disabled={saving || !hasChanges}
          >
            {saving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Check className="w-4 h-4 mr-2" />
            )}
            {todayEntry ? "Aktualisieren" : "Speichern"}
          </Button>
        </motion.div>
      </CardContent>
    </Card>
  );
}
