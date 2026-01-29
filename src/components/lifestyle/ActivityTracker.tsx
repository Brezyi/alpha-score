import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useActivities } from "@/hooks/useActivities";
import { 
  Footprints, 
  Flame, 
  Timer, 
  Plus,
  Trash2,
  Target,
  Loader2
} from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { cn } from "@/lib/utils";

const STEP_GOAL = 10000;
const CALORIE_GOAL = 500;

export function ActivityTracker() {
  const { 
    todayActivities, 
    dailyTotals, 
    activityTypes,
    loading,
    addActivity,
    updateSteps,
    deleteActivity
  } = useActivities();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showStepsDialog, setShowStepsDialog] = useState(false);
  const [stepsInput, setStepsInput] = useState("");
  const [formData, setFormData] = useState({
    activity_type: "running",
    duration_minutes: "",
    distance_km: "",
    notes: ""
  });

  const handleAddActivity = async () => {
    const activityType = activityTypes.find(t => t.value === formData.activity_type);
    const duration = parseInt(formData.duration_minutes) || 0;
    const calories = duration * (activityType?.caloriesPerMin || 5);

    await addActivity({
      entry_date: format(new Date(), "yyyy-MM-dd"),
      activity_type: formData.activity_type,
      duration_minutes: duration,
      distance_km: parseFloat(formData.distance_km) || 0,
      active_calories: calories,
      steps: 0,
      notes: formData.notes || null
    });

    setFormData({ activity_type: "running", duration_minutes: "", distance_km: "", notes: "" });
    setShowAddDialog(false);
  };

  const handleUpdateSteps = async () => {
    const steps = parseInt(stepsInput) || 0;
    await updateSteps(steps);
    setStepsInput("");
    setShowStepsDialog(false);
  };

  const stepPercent = Math.min(100, (dailyTotals.steps / STEP_GOAL) * 100);
  const caloriePercent = Math.min(100, (dailyTotals.calories / CALORIE_GOAL) * 100);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Footprints className="h-5 w-5 text-primary" />
            Aktivitäten
          </CardTitle>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button size="sm" variant="ghost">
                <Plus className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Aktivität hinzufügen</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Aktivität</Label>
                  <Select
                    value={formData.activity_type}
                    onValueChange={(v) => setFormData({ ...formData, activity_type: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {activityTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.icon} {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Dauer (Min)</Label>
                    <Input
                      type="number"
                      placeholder="30"
                      value={formData.duration_minutes}
                      onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Distanz (km)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="5.0"
                      value={formData.distance_km}
                      onChange={(e) => setFormData({ ...formData, distance_km: e.target.value })}
                    />
                  </div>
                </div>
                <Button className="w-full" onClick={handleAddActivity}>
                  Hinzufügen
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Daily Stats */}
        <div className="grid grid-cols-2 gap-4">
          {/* Steps */}
          <Dialog open={showStepsDialog} onOpenChange={setShowStepsDialog}>
            <DialogTrigger asChild>
              <div className="p-3 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <Footprints className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">Schritte</span>
                </div>
                <div className="text-2xl font-bold mb-1">
                  {dailyTotals.steps.toLocaleString()}
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={stepPercent} className="h-1.5 flex-1" />
                  <span className="text-xs text-muted-foreground">
                    {STEP_GOAL.toLocaleString()}
                  </span>
                </div>
              </div>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Schritte eingeben</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Anzahl Schritte</Label>
                  <Input
                    type="number"
                    placeholder="10000"
                    value={stepsInput}
                    onChange={(e) => setStepsInput(e.target.value)}
                  />
                </div>
                <Button className="w-full" onClick={handleUpdateSteps}>
                  Speichern
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Calories */}
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 mb-2">
              <Flame className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium">Kalorien</span>
            </div>
            <div className="text-2xl font-bold mb-1">
              {dailyTotals.calories}
            </div>
            <div className="flex items-center gap-2">
              <Progress value={caloriePercent} className="h-1.5 flex-1" />
              <span className="text-xs text-muted-foreground">
                {CALORIE_GOAL} kcal
              </span>
            </div>
          </div>
        </div>

        {/* Summary Row */}
        <div className="flex gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Timer className="h-3.5 w-3.5" />
            {dailyTotals.duration} Min
          </div>
          <div className="flex items-center gap-1">
            <Target className="h-3.5 w-3.5" />
            {dailyTotals.distance.toFixed(1)} km
          </div>
        </div>

        {/* Activity List */}
        {todayActivities.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Heutige Aktivitäten</Label>
            <div className="space-y-2">
              {todayActivities.filter(a => a.duration_minutes > 0).map((activity) => {
                const type = activityTypes.find(t => t.value === activity.activity_type);
                return (
                  <div
                    key={activity.id}
                    className="flex items-center justify-between p-2 bg-muted/50 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{type?.icon || "🎯"}</span>
                      <div>
                        <p className="text-sm font-medium">{type?.label || activity.activity_type}</p>
                        <p className="text-xs text-muted-foreground">
                          {activity.duration_minutes} Min
                          {activity.distance_km > 0 && ` · ${activity.distance_km} km`}
                          {` · ${activity.active_calories} kcal`}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => deleteActivity(activity.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
