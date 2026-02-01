import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useHealthData, HealthSummary } from "@/hooks/useHealthData";
import { useActivities } from "@/hooks/useActivities";
import { 
  Footprints, 
  Flame, 
  Smartphone,
  Apple,
  Heart,
  RefreshCw,
  Plus,
  Target,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Zap
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from "recharts";

// Goals
const STEP_GOAL = 10000;
const CALORIE_GOAL = 500;

interface StepsCaloriesTrackerProps {
  selectedDate?: Date;
}

export function StepsCaloriesTracker({ selectedDate }: StepsCaloriesTrackerProps) {
  const {
    isNative,
    isAvailable,
    isAuthorized,
    loading: healthLoading,
    platform,
    requestAuthorization,
    getTodaySummary,
    getWeeklySummary,
  } = useHealthData();

  const { dailyTotals, updateSteps } = useActivities();

  const [healthSummary, setHealthSummary] = useState<HealthSummary | null>(null);
  const [weeklyData, setWeeklyData] = useState<{ date: string; steps: number }[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showManualDialog, setShowManualDialog] = useState(false);
  const [manualSteps, setManualSteps] = useState("");
  const [manualCalories, setManualCalories] = useState("");

  // Determine data source
  const useHealthApp = isNative && isAuthorized;

  // Current values (from health app or manual)
  const currentSteps = useHealthApp ? (healthSummary?.steps || 0) : dailyTotals.steps;
  const currentCalories = useHealthApp ? (healthSummary?.calories || 0) : dailyTotals.calories;

  // Load health data when authorized
  useEffect(() => {
    if (useHealthApp) {
      loadHealthData();
    }
  }, [useHealthApp]);

  const loadHealthData = async () => {
    setRefreshing(true);
    try {
      const [summary, weekly] = await Promise.all([
        getTodaySummary(),
        getWeeklySummary(),
      ]);
      setHealthSummary(summary);
      setWeeklyData(weekly);
    } finally {
      setRefreshing(false);
    }
  };

  const handleManualSave = async () => {
    const steps = parseInt(manualSteps) || 0;
    if (steps > 0) {
      await updateSteps(steps);
    }
    setManualSteps("");
    setManualCalories("");
    setShowManualDialog(false);
  };

  const stepPercent = Math.min(100, (currentSteps / STEP_GOAL) * 100);
  const caloriePercent = Math.min(100, (currentCalories / CALORIE_GOAL) * 100);

  // Format weekly data for chart
  const chartData = weeklyData.map((d, index) => {
    const date = new Date(d.date);
    const dayNames = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
    return {
      day: dayNames[date.getDay()],
      steps: d.steps,
      isToday: index === weeklyData.length - 1,
    };
  });

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Footprints className="h-5 w-5 text-primary" />
            Schritte & Kalorien
          </CardTitle>
          <div className="flex items-center gap-1">
            {useHealthApp && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={loadHealthData}
                disabled={refreshing}
              >
                <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
              </Button>
            )}
            {!useHealthApp && (
              <Dialog open={showManualDialog} onOpenChange={setShowManualDialog}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Plus className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Daten eingeben</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Schritte</Label>
                      <Input
                        type="number"
                        placeholder="z.B. 8500"
                        value={manualSteps}
                        onChange={(e) => setManualSteps(e.target.value)}
                      />
                    </div>
                    <Button className="w-full" onClick={handleManualSave}>
                      Speichern
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Connection Status for Native */}
        {isNative && !isAuthorized && isAvailable && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 rounded-lg bg-primary/10 border border-primary/20"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-primary/20">
                {platform === "ios" ? (
                  <Apple className="h-4 w-4 text-primary" />
                ) : (
                  <Heart className="h-4 w-4 text-primary" />
                )}
              </div>
              <div className="flex-1 space-y-2">
                <p className="text-sm font-medium">
                  Mit {platform === "ios" ? "Apple Health" : "Health Connect"} verbinden
                </p>
                <p className="text-xs text-muted-foreground">
                  Importiere automatisch Schritte und verbrannte Kalorien von deiner Sport-App.
                </p>
                <Button
                  size="sm"
                  onClick={requestAuthorization}
                  disabled={healthLoading}
                  className="mt-2"
                >
                  {healthLoading ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Smartphone className="h-4 w-4 mr-2" />
                  )}
                  Verbinden
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Data Source Indicator */}
        {useHealthApp && (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs gap-1">
              {platform === "ios" ? (
                <Apple className="h-3 w-3" />
              ) : (
                <Heart className="h-3 w-3" />
              )}
              {platform === "ios" ? "Apple Health" : "Health Connect"}
              <CheckCircle2 className="h-3 w-3 text-green-500" />
            </Badge>
          </div>
        )}

        {/* Main Stats */}
        <div className="grid grid-cols-2 gap-4">
          {/* Steps Card */}
          <motion.div
            className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-blue-500/20">
                <Footprints className="h-4 w-4 text-blue-500" />
              </div>
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Schritte</span>
            </div>
            <div className="text-2xl font-bold mb-2">
              {currentSteps.toLocaleString("de-DE")}
            </div>
            <div className="space-y-1">
              <Progress value={stepPercent} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{Math.round(stepPercent)}%</span>
                <span className="flex items-center gap-1">
                  <Target className="h-3 w-3" />
                  {STEP_GOAL.toLocaleString("de-DE")}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Calories Card */}
          <motion.div
            className="p-4 rounded-xl bg-gradient-to-br from-orange-500/10 to-red-500/5 border border-orange-500/20"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-orange-500/20">
                <Flame className="h-4 w-4 text-orange-500" />
              </div>
              <span className="text-sm font-medium text-orange-700 dark:text-orange-300">Kalorien</span>
            </div>
            <div className="text-2xl font-bold mb-2">
              {currentCalories.toLocaleString("de-DE")}
              <span className="text-sm font-normal text-muted-foreground ml-1">kcal</span>
            </div>
            <div className="space-y-1">
              <Progress value={caloriePercent} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{Math.round(caloriePercent)}%</span>
                <span className="flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  {CALORIE_GOAL} kcal
                </span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Weekly Chart (only when health app connected) */}
        {useHealthApp && chartData.length > 0 && (
          <div className="pt-2">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Wochenverlauf</span>
            </div>
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barCategoryGap="20%">
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  />
                  <Tooltip
                    formatter={(value: number) => [`${value.toLocaleString("de-DE")} Schritte`]}
                    labelFormatter={(label) => label}
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="steps" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.isToday ? "hsl(var(--primary))" : "hsl(var(--muted))"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Tips */}
        {!useHealthApp && !isNative && (
          <div className="p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <p>
                <span className="font-medium">Tipp:</span> Nutze die App auf deinem Smartphone, 
                um automatisch Daten von Apple Health oder Google Health Connect zu importieren.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
