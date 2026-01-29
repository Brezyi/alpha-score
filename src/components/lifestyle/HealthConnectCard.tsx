import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useHealthData, HealthSummary } from "@/hooks/useHealthData";
import { 
  Heart, 
  Footprints, 
  Moon, 
  Activity, 
  RefreshCw, 
  Smartphone,
  Apple,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function HealthConnectCard() {
  const {
    isNative,
    isAvailable,
    isAuthorized,
    loading,
    platform,
    requestAuthorization,
    getTodaySummary,
  } = useHealthData();

  const [summary, setSummary] = useState<HealthSummary | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Goals
  const STEP_GOAL = 10000;
  const ACTIVE_MINUTES_GOAL = 30;
  const SLEEP_GOAL = 8;

  // Fetch health data when authorized
  useEffect(() => {
    if (isAuthorized) {
      loadHealthData();
    }
  }, [isAuthorized]);

  const loadHealthData = async () => {
    setRefreshing(true);
    const data = await getTodaySummary();
    setSummary(data);
    setRefreshing(false);
  };

  // Don't render if not on native platform
  if (!isNative) {
    return null;
  }

  // Health not available on this device
  if (!isAvailable) {
    return (
      <Card className="border-border/50 bg-card/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            {platform === "ios" ? (
              <Apple className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Heart className="h-4 w-4 text-muted-foreground" />
            )}
            {platform === "ios" ? "Apple Health" : "Health Connect"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <AlertCircle className="h-4 w-4" />
            <span>
              {platform === "ios" 
                ? "Apple Health ist auf diesem Gerät nicht verfügbar."
                : "Installiere Google Health Connect, um Gesundheitsdaten zu synchronisieren."}
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Not authorized yet
  if (!isAuthorized) {
    return (
      <Card className="border-border/50 bg-gradient-to-br from-card to-card/80">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            {platform === "ios" ? (
              <Apple className="h-4 w-4 text-primary" />
            ) : (
              <Heart className="h-4 w-4 text-green-500" />
            )}
            {platform === "ios" ? "Apple Health" : "Health Connect"}
            <Badge variant="outline" className="text-xs">Neu</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Verbinde {platform === "ios" ? "Apple Health" : "Google Health Connect"}, 
            um Schlaf- und Aktivitätsdaten automatisch zu importieren.
          </p>
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Footprints className="h-3 w-3" /> Schritte
            </span>
            <span className="flex items-center gap-1">
              <Moon className="h-3 w-3" /> Schlaf
            </span>
            <span className="flex items-center gap-1">
              <Activity className="h-3 w-3" /> Aktivität
            </span>
          </div>
          <Button 
            onClick={requestAuthorization} 
            disabled={loading}
            className="w-full"
            size="sm"
          >
            {loading ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Smartphone className="h-4 w-4 mr-2" />
            )}
            Verbinden
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Show health summary
  return (
    <Card className="border-border/50 bg-gradient-to-br from-card to-card/80">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            {platform === "ios" ? (
              <Apple className="h-4 w-4 text-primary" />
            ) : (
              <Heart className="h-4 w-4 text-green-500" />
            )}
            {platform === "ios" ? "Apple Health" : "Health Connect"}
            <CheckCircle2 className="h-3 w-3 text-green-500" />
          </CardTitle>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7"
            onClick={loadHealthData}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <AnimatePresence mode="wait">
          {summary ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Steps */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <Footprints className="h-4 w-4 text-blue-500" />
                    Schritte
                  </span>
                  <span className="font-medium">
                    {summary.steps.toLocaleString("de-DE")} 
                    <span className="text-muted-foreground text-xs ml-1">
                      / {STEP_GOAL.toLocaleString("de-DE")}
                    </span>
                  </span>
                </div>
                <Progress 
                  value={Math.min((summary.steps / STEP_GOAL) * 100, 100)} 
                  className="h-2"
                />
              </div>

              {/* Active Minutes */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-orange-500" />
                    Aktivität
                  </span>
                  <span className="font-medium">
                    {summary.activeMinutes} min
                    <span className="text-muted-foreground text-xs ml-1">
                      / {ACTIVE_MINUTES_GOAL} min
                    </span>
                  </span>
                </div>
                <Progress 
                  value={Math.min((summary.activeMinutes / ACTIVE_MINUTES_GOAL) * 100, 100)} 
                  className="h-2"
                />
              </div>

              {/* Sleep */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <Moon className="h-4 w-4 text-indigo-500" />
                    Schlaf (letzte Nacht)
                  </span>
                  <span className="font-medium">
                    {summary.sleepHours}h
                    <span className="text-muted-foreground text-xs ml-1">
                      / {SLEEP_GOAL}h
                    </span>
                  </span>
                </div>
                <Progress 
                  value={Math.min((summary.sleepHours / SLEEP_GOAL) * 100, 100)} 
                  className="h-2"
                />
              </div>
            </motion.div>
          ) : (
            <div className="flex items-center justify-center py-4">
              <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
