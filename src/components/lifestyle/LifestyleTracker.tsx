import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

interface LifestyleTrackerProps {
  className?: string;
  compact?: boolean;
}

export function LifestyleTracker({ className, compact = false }: LifestyleTrackerProps) {
  const { todayEntry, loading, updateTodayEntry } = useLifestyle();
  const [waterLiters, setWaterLiters] = useState(2);
  const [exerciseMinutes, setExerciseMinutes] = useState(0);
  const [saving, setSaving] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Update local state when todayEntry changes
  useEffect(() => {
    if (todayEntry && !initialized) {
      setWaterLiters(todayEntry.water_liters || 2);
      setExerciseMinutes(todayEntry.exercise_minutes || 0);
      setInitialized(true);
    }
  }, [todayEntry, initialized]);

  const handleSave = async () => {
    setSaving(true);
    await updateTodayEntry({
      water_liters: waterLiters,
      exercise_minutes: exerciseMinutes
    });
    setSaving(false);
  };

  const hasChanges = 
    waterLiters !== (todayEntry?.water_liters || 0) ||
    exerciseMinutes !== (todayEntry?.exercise_minutes || 0);

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
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Activity className="w-5 h-5 text-primary" />
          Heute
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
            onValueChange={([v]) => setWaterLiters(v)}
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
            onValueChange={([v]) => setExerciseMinutes(v)}
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
      </CardContent>
    </Card>
  );
}
