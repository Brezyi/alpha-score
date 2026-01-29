import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Moon, 
  Droplets, 
  Pill, 
  Plus, 
  Minus,
  CheckCircle2,
  AlertTriangle,
  BedDouble,
  Clock
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { HealthConnectCard } from "@/components/lifestyle/HealthConnectCard";

interface LifestyleEntry {
  sleep_hours: number | null;
  sleep_quality: number | null;
  water_liters: number | null;
  exercise_minutes: number | null;
  sleep_bedtime: string | null;
  sleep_waketime: string | null;
}

interface MobileLifestyleContentProps {
  todayEntry: LifestyleEntry | null;
  onUpdateSleep: (hours: number) => void;
  onUpdateWater: (liters: number) => void;
  onOpenSleepTracker: () => void;
  onOpenSupplements: () => void;
}

export const MobileLifestyleContent = ({
  todayEntry,
  onUpdateSleep,
  onUpdateWater,
  onOpenSleepTracker,
  onOpenSupplements
}: MobileLifestyleContentProps) => {
  const handleWaterAdjust = async (delta: number) => {
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch {}
    const currentWater = todayEntry?.water_liters || 0;
    const newWater = Math.max(0, Math.min(5, currentWater + delta));
    onUpdateWater(newWater);
  };

  const sleepHours = todayEntry?.sleep_hours || 0;
  const waterLiters = todayEntry?.water_liters || 0;

  // Health status
  const sleepStatus = sleepHours >= 7 ? "good" : sleepHours >= 5 ? "warning" : "bad";
  const waterStatus = waterLiters >= 2 ? "good" : waterLiters >= 1 ? "warning" : "bad";

  return (
    <div className="px-4 py-6 space-y-6">
      {/* Health Connect Card - Native only */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <HealthConnectCard />
      </motion.div>

      {/* Today's Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Heute</h2>
          <span className="text-sm text-muted-foreground">
            {format(new Date(), "EEEE, dd. MMM", { locale: de })}
          </span>
        </div>

        {/* Quick Status Cards */}
        <div className="grid grid-cols-2 gap-3">
          {/* Sleep Status */}
          <Card 
            className={cn(
              "p-4 cursor-pointer active:scale-[0.98] transition-all",
              sleepStatus === "good" && "border-green-500/30 bg-green-500/5",
              sleepStatus === "warning" && "border-amber-500/30 bg-amber-500/5",
              sleepStatus === "bad" && "border-red-500/30 bg-red-500/5"
            )}
            onClick={onOpenSleepTracker}
          >
            <div className="flex items-center gap-2 mb-3">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center",
                sleepStatus === "good" && "bg-green-500/20",
                sleepStatus === "warning" && "bg-amber-500/20",
                sleepStatus === "bad" && "bg-red-500/20"
              )}>
                <Moon className={cn(
                  "w-4 h-4",
                  sleepStatus === "good" && "text-green-500",
                  sleepStatus === "warning" && "text-amber-500",
                  sleepStatus === "bad" && "text-red-500"
                )} />
              </div>
              <span className="text-xs text-muted-foreground">Schlaf</span>
            </div>
            <div className="text-2xl font-bold mb-1">
              {sleepHours > 0 ? `${sleepHours}h` : "-"}
            </div>
            <div className="text-xs text-muted-foreground">
              {sleepStatus === "good" ? "Gut erholt" : 
               sleepStatus === "warning" ? "Etwas wenig" : 
               sleepHours > 0 ? "Zu wenig" : "Nicht getrackt"}
            </div>
          </Card>

          {/* Water Status */}
          <Card className={cn(
            "p-4",
            waterStatus === "good" && "border-cyan-500/30 bg-cyan-500/5",
            waterStatus === "warning" && "border-amber-500/30 bg-amber-500/5",
            waterStatus === "bad" && "border-border"
          )}>
            <div className="flex items-center gap-2 mb-3">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center",
                waterStatus === "good" && "bg-cyan-500/20",
                waterStatus === "warning" && "bg-amber-500/20",
                waterStatus === "bad" && "bg-muted"
              )}>
                <Droplets className={cn(
                  "w-4 h-4",
                  waterStatus === "good" && "text-cyan-500",
                  waterStatus === "warning" && "text-amber-500",
                  waterStatus === "bad" && "text-muted-foreground"
                )} />
              </div>
              <span className="text-xs text-muted-foreground">Wasser</span>
            </div>
            <div className="text-2xl font-bold mb-1">
              {waterLiters > 0 ? `${waterLiters}L` : "-"}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={(e) => { e.stopPropagation(); handleWaterAdjust(-0.25); }}
                className="w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center active:scale-95"
                disabled={waterLiters <= 0}
              >
                <Minus className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleWaterAdjust(0.25); }}
                className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center active:scale-95"
                disabled={waterLiters >= 5}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </Card>
        </div>
      </motion.div>

      {/* Health Alert */}
      {(sleepStatus !== "good" || waterStatus !== "good") && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-4 border-amber-500/30 bg-amber-500/5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-500">Tipp</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {sleepStatus !== "good" && "Mehr Schlaf hilft bei Hautregeneration. "}
                  {waterStatus !== "good" && "Trinke mindestens 2L für bessere Haut."}
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Success State */}
      {sleepStatus === "good" && waterStatus === "good" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-4 border-green-500/30 bg-green-500/5">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm font-medium text-green-500">Super gemacht!</p>
                <p className="text-xs text-muted-foreground">
                  Du hast genug geschlafen und getrunken.
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-3"
      >
        <h3 className="text-sm font-medium text-muted-foreground">Tracking</h3>
        
        {/* Sleep Tracker */}
        <Card 
          className="p-4 cursor-pointer active:scale-[0.98] transition-all"
          onClick={onOpenSleepTracker}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center">
              <BedDouble className="w-6 h-6 text-indigo-500" />
            </div>
            <div className="flex-1">
              <p className="font-medium">Schlaf tracken</p>
              <p className="text-xs text-muted-foreground">
                {todayEntry?.sleep_bedtime 
                  ? `Letzte Schlafzeit: ${todayEntry.sleep_bedtime}`
                  : "Schlafzeiten eingeben"
                }
              </p>
            </div>
          </div>
        </Card>

        {/* Supplements */}
        <Card 
          className="p-4 cursor-pointer active:scale-[0.98] transition-all"
          onClick={onOpenSupplements}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <Pill className="w-6 h-6 text-emerald-500" />
            </div>
            <div className="flex-1">
              <p className="font-medium">Supplements</p>
              <p className="text-xs text-muted-foreground">
                Vitamin D, Omega-3 und mehr tracken
              </p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Water Goal Visual */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">Wasserziel</span>
            <span className="text-sm text-muted-foreground">{waterLiters}/2.5L</span>
          </div>
          
          {/* Water Drops Visual */}
          <div className="flex justify-between gap-1">
            {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.25, 2.5].map((target) => (
              <div
                key={target}
                className={cn(
                  "flex-1 h-8 rounded-full transition-colors",
                  waterLiters >= target ? "bg-cyan-500" : "bg-muted"
                )}
              />
            ))}
          </div>
          
          <div className="flex justify-center gap-3 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleWaterAdjust(-0.25)}
              disabled={waterLiters <= 0}
            >
              <Minus className="w-4 h-4" />
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => handleWaterAdjust(0.25)}
              disabled={waterLiters >= 5}
            >
              <Plus className="w-4 h-4 mr-1" />
              0.25L
            </Button>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};
