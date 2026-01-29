import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Moon, TrendingUp, TrendingDown, Minus, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface LifestyleEntry {
  entry_date: string;
  sleep_hours: number | null;
  sleep_quality: number | null;
}

interface Analysis {
  created_at: string;
  looks_score: number | null;
}

interface SleepScoreCorrelationProps {
  lifestyleEntries: LifestyleEntry[];
  analyses: Analysis[];
  className?: string;
}

export function SleepScoreCorrelation({ 
  lifestyleEntries, 
  analyses,
  className 
}: SleepScoreCorrelationProps) {
  const correlation = useMemo(() => {
    if (lifestyleEntries.length < 7 || analyses.length < 2) {
      return null;
    }

    // Calculate average sleep quality when score improved vs declined
    const analysesWithPrevious = analyses.slice(0, -1).map((analysis, index) => {
      const prevAnalysis = analyses[index + 1];
      const scoreChange = (analysis.looks_score || 0) - (prevAnalysis?.looks_score || 0);
      
      // Get sleep data for the 7 days before this analysis
      const analysisDate = new Date(analysis.created_at);
      const weekBefore = new Date(analysisDate);
      weekBefore.setDate(weekBefore.getDate() - 7);
      
      const relevantSleepEntries = lifestyleEntries.filter(entry => {
        const entryDate = new Date(entry.entry_date);
        return entryDate >= weekBefore && entryDate < analysisDate;
      });

      const avgSleepHours = relevantSleepEntries.length > 0
        ? relevantSleepEntries.reduce((sum, e) => sum + (e.sleep_hours || 0), 0) / relevantSleepEntries.length
        : null;

      const avgSleepQuality = relevantSleepEntries.length > 0
        ? relevantSleepEntries.reduce((sum, e) => sum + (e.sleep_quality || 0), 0) / relevantSleepEntries.length
        : null;

      return {
        scoreChange,
        avgSleepHours,
        avgSleepQuality,
        hasData: relevantSleepEntries.length > 3
      };
    });

    const withData = analysesWithPrevious.filter(a => a.hasData);
    if (withData.length < 2) return null;

    const improved = withData.filter(a => a.scoreChange > 0);
    const declined = withData.filter(a => a.scoreChange < 0);

    const avgSleepWhenImproved = improved.length > 0
      ? improved.reduce((sum, a) => sum + (a.avgSleepHours || 0), 0) / improved.length
      : null;

    const avgSleepWhenDeclined = declined.length > 0
      ? declined.reduce((sum, a) => sum + (a.avgSleepHours || 0), 0) / declined.length
      : null;

    const avgQualityWhenImproved = improved.length > 0
      ? improved.reduce((sum, a) => sum + (a.avgSleepQuality || 0), 0) / improved.length
      : null;

    const avgQualityWhenDeclined = declined.length > 0
      ? declined.reduce((sum, a) => sum + (a.avgSleepQuality || 0), 0) / declined.length
      : null;

    // Calculate overall stats
    const totalSleepAvg = lifestyleEntries.reduce((sum, e) => sum + (e.sleep_hours || 0), 0) / lifestyleEntries.length;
    const totalQualityAvg = lifestyleEntries.reduce((sum, e) => sum + (e.sleep_quality || 0), 0) / lifestyleEntries.length;

    // Determine correlation strength
    const sleepDiff = (avgSleepWhenImproved || 0) - (avgSleepWhenDeclined || 0);
    let correlationStrength: "strong" | "moderate" | "weak" | "none" = "none";
    
    if (sleepDiff > 1) correlationStrength = "strong";
    else if (sleepDiff > 0.5) correlationStrength = "moderate";
    else if (sleepDiff > 0) correlationStrength = "weak";

    return {
      avgSleepWhenImproved,
      avgSleepWhenDeclined,
      avgQualityWhenImproved,
      avgQualityWhenDeclined,
      totalSleepAvg,
      totalQualityAvg,
      correlationStrength,
      improvedCount: improved.length,
      declinedCount: declined.length,
      sleepDiff
    };
  }, [lifestyleEntries, analyses]);

  if (!correlation) {
    return (
      <Card className={cn("p-4", className)}>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Moon className="w-4 h-4" />
          <span className="text-sm">Mehr Daten nötig für Schlaf-Score-Korrelation</span>
        </div>
      </Card>
    );
  }

  const strengthColors = {
    strong: "text-green-500 bg-green-500/10",
    moderate: "text-yellow-500 bg-yellow-500/10",
    weak: "text-orange-500 bg-orange-500/10",
    none: "text-muted-foreground bg-muted"
  };

  const strengthLabels = {
    strong: "Starke Korrelation",
    moderate: "Mittlere Korrelation",
    weak: "Schwache Korrelation",
    none: "Keine Korrelation"
  };

  return (
    <Card className={cn("p-5", className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
            <Moon className="w-4 h-4 text-indigo-500" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Schlaf & Score</h3>
            <p className="text-xs text-muted-foreground">Wie Schlaf deinen Score beeinflusst</p>
          </div>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Info className="w-4 h-4 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs text-xs">
                Basierend auf {correlation.improvedCount + correlation.declinedCount} Analysen und 
                deinen Schlafdaten der jeweils 7 Tage davor.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Correlation Badge */}
      <div className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium mb-4",
        strengthColors[correlation.correlationStrength]
      )}>
        {correlation.correlationStrength === "strong" ? <TrendingUp className="w-3 h-3" /> :
         correlation.correlationStrength === "none" ? <Minus className="w-3 h-3" /> :
         <TrendingUp className="w-3 h-3" />}
        {strengthLabels[correlation.correlationStrength]}
      </div>

      {/* Comparison Grid */}
      <div className="grid grid-cols-2 gap-3">
        <motion.div 
          className="p-3 rounded-xl bg-green-500/5 border border-green-500/20"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="flex items-center gap-1 text-green-500 text-xs font-medium mb-2">
            <TrendingUp className="w-3 h-3" />
            Bei Score-Verbesserung
          </div>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground">Schlaf</span>
              <span className="text-sm font-semibold">
                {correlation.avgSleepWhenImproved?.toFixed(1) || "-"}h
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground">Qualität</span>
              <span className="text-sm font-semibold">
                {correlation.avgQualityWhenImproved?.toFixed(1) || "-"}/5
              </span>
            </div>
          </div>
        </motion.div>

        <motion.div 
          className="p-3 rounded-xl bg-red-500/5 border border-red-500/20"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="flex items-center gap-1 text-red-500 text-xs font-medium mb-2">
            <TrendingDown className="w-3 h-3" />
            Bei Score-Verschlechterung
          </div>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground">Schlaf</span>
              <span className="text-sm font-semibold">
                {correlation.avgSleepWhenDeclined?.toFixed(1) || "-"}h
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground">Qualität</span>
              <span className="text-sm font-semibold">
                {correlation.avgQualityWhenDeclined?.toFixed(1) || "-"}/5
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Insight */}
      {correlation.sleepDiff > 0.3 && (
        <motion.div 
          className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/20"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <p className="text-xs text-muted-foreground">
            💡 <span className="text-foreground font-medium">Insight:</span> Du schläfst durchschnittlich{" "}
            <span className="text-primary font-semibold">{correlation.sleepDiff.toFixed(1)}h mehr</span>{" "}
            in Wochen, in denen sich dein Score verbessert. Versuche mindestens{" "}
            <span className="font-semibold">{Math.ceil(correlation.avgSleepWhenImproved || 7)}h</span> zu schlafen!
          </p>
        </motion.div>
      )}
    </Card>
  );
}
