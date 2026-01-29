import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useFasting, FASTING_PLANS, FastingPlan } from "@/hooks/useFasting";
import { Timer, Play, Square, Flame, Trophy, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export function FastingTimer() {
  const {
    currentSession,
    loading,
    startFasting,
    endFasting,
    cancelFasting,
    getProgress,
    getStreak,
  } = useFasting();

  const [selectedPlan, setSelectedPlan] = useState<FastingPlan>("16:8");
  const [progress, setProgress] = useState(getProgress());
  const streak = getStreak();

  // Update progress every second
  useEffect(() => {
    if (!currentSession) return;

    const interval = setInterval(() => {
      setProgress(getProgress());
    }, 1000);

    return () => clearInterval(interval);
  }, [currentSession, getProgress]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleStart = async () => {
    await startFasting(selectedPlan);
    setProgress(getProgress());
  };

  const handleEnd = async () => {
    await endFasting(progress.percent < 100);
  };

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="h-48" />
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Timer className="h-5 w-5 text-primary" />
            Intermittent Fasting
          </CardTitle>
          {streak > 0 && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Flame className="h-3 w-3 text-orange-500" />
              {streak} Tage
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <AnimatePresence mode="wait">
          {currentSession ? (
            <motion.div
              key="active"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {/* Timer Display */}
              <div className="text-center py-4">
                <div className="text-sm text-muted-foreground mb-1">
                  {progress.isComplete ? "Ziel erreicht! 🎉" : "Verbleibend"}
                </div>
                <div className={cn(
                  "text-4xl font-bold font-mono",
                  progress.isComplete && "text-green-500"
                )}>
                  {formatTime(progress.remaining)}
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  {currentSession.fasting_type} Fasten
                </div>
              </div>

              {/* Progress Ring */}
              <div className="relative">
                <Progress 
                  value={progress.percent} 
                  className={cn(
                    "h-3 transition-all",
                    progress.isComplete && "[&>div]:bg-green-500"
                  )}
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>{Math.round(progress.percent)}%</span>
                  <span>{formatTime(progress.elapsed)} vergangen</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  variant={progress.isComplete ? "default" : "outline"}
                  className="flex-1"
                  onClick={handleEnd}
                >
                  <Square className="h-4 w-4 mr-2" />
                  {progress.isComplete ? "Abschließen" : "Beenden"}
                </Button>
                {!progress.isComplete && (
                  <Button variant="ghost" size="icon" onClick={cancelFasting}>
                    ✕
                  </Button>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="inactive"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {/* Plan Selection */}
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(FASTING_PLANS) as FastingPlan[])
                  .filter((p) => p !== "custom")
                  .map((plan) => (
                    <button
                      key={plan}
                      onClick={() => setSelectedPlan(plan)}
                      className={cn(
                        "p-3 rounded-lg border text-center transition-all",
                        selectedPlan === plan
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <div className="font-bold">{FASTING_PLANS[plan].label}</div>
                      <div className="text-xs text-muted-foreground">
                        {FASTING_PLANS[plan].fastingHours}h fasten
                      </div>
                    </button>
                  ))}
              </div>

              {/* Info */}
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <Clock className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {FASTING_PLANS[selectedPlan].description}
                </p>
              </div>

              {/* Start Button */}
              <Button className="w-full" size="lg" onClick={handleStart}>
                <Play className="h-5 w-5 mr-2" />
                Fasten starten
              </Button>

              {/* Stats */}
              {streak > 0 && (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Trophy className="h-4 w-4 text-yellow-500" />
                  <span>Längste Serie: {streak} Tage</span>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
