import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Camera, 
  ChevronLeft, 
  ChevronRight,
  Trophy,
  Target,
  Flame,
  Star,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { LineChart, Line, ResponsiveContainer, Area } from "recharts";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { ProgressImage } from "@/components/ProgressImage";

interface Analysis {
  id: string;
  looks_score: number | null;
  potential_score: number | null;
  created_at: string;
  signedPhotoUrls?: (string | null)[];
}

interface MobileProgressContentProps {
  analyses: Analysis[];
  loading: boolean;
  currentStreak: number;
  longestStreak: number;
  onRefresh: () => void;
}

export const MobileProgressContent = ({
  analyses,
  loading,
  currentStreak,
  longestStreak,
  onRefresh
}: MobileProgressContentProps) => {
  const navigate = useNavigate();
  const [compareIndex, setCompareIndex] = useState(0);
  
  const completedAnalyses = analyses.filter(a => a.looks_score !== null);
  const latestScore = completedAnalyses[0]?.looks_score ?? null;
  const oldestScore = completedAnalyses[completedAnalyses.length - 1]?.looks_score ?? null;
  const totalImprovement = latestScore !== null && oldestScore !== null 
    ? latestScore - oldestScore 
    : null;
  
  const highestScore = completedAnalyses.length > 0
    ? Math.max(...completedAnalyses.map(a => a.looks_score || 0))
    : null;

  // Chart data
  const chartData = completedAnalyses.slice().reverse().map(a => ({
    score: a.looks_score,
    potential: a.potential_score,
  }));

  // Before/After comparison
  const canCompare = completedAnalyses.length >= 2;
  const maxCompareIndex = Math.max(0, completedAnalyses.length - 2);
  const afterAnalysis = completedAnalyses[compareIndex];
  const beforeAnalysis = completedAnalyses[compareIndex + 1];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (completedAnalyses.length === 0) {
    return (
      <div className="px-4 py-8">
        <motion.div 
          className="text-center py-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Camera className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-xl font-bold mb-2">Noch keine Analysen</h2>
          <p className="text-muted-foreground text-sm mb-6">
            Starte deine erste Analyse, um deinen Fortschritt zu tracken
          </p>
          <Button variant="hero" onClick={() => navigate("/upload")}>
            <Camera className="w-5 h-5" />
            Erste Analyse starten
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Current Score */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-4 bg-gradient-to-br from-primary/20 to-primary/5 border-primary/30">
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">Aktuell</span>
            </div>
            <div className="text-3xl font-bold text-primary">
              {latestScore?.toFixed(1) ?? "-"}
            </div>
          </Card>
        </motion.div>

        {/* Improvement */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              {totalImprovement !== null && totalImprovement > 0 ? (
                <TrendingUp className="w-4 h-4 text-green-500" />
              ) : totalImprovement !== null && totalImprovement < 0 ? (
                <TrendingDown className="w-4 h-4 text-red-500" />
              ) : (
                <Minus className="w-4 h-4 text-muted-foreground" />
              )}
              <span className="text-xs text-muted-foreground">Fortschritt</span>
            </div>
            <div className={cn(
              "text-3xl font-bold",
              totalImprovement !== null && totalImprovement > 0 ? "text-green-500" : 
              totalImprovement !== null && totalImprovement < 0 ? "text-red-500" : 
              "text-muted-foreground"
            )}>
              {totalImprovement !== null 
                ? `${totalImprovement > 0 ? "+" : ""}${totalImprovement.toFixed(1)}`
                : "-"
              }
            </div>
          </Card>
        </motion.div>

        {/* Highest Score */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              <span className="text-xs text-muted-foreground">Bestwert</span>
            </div>
            <div className="text-3xl font-bold text-amber-500">
              {highestScore?.toFixed(1) ?? "-"}
            </div>
          </Card>
        </motion.div>

        {/* Streak */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Flame className={cn(
                "w-4 h-4",
                currentStreak >= 7 ? "text-orange-500" : 
                currentStreak >= 3 ? "text-amber-500" : 
                "text-muted-foreground"
              )} />
              <span className="text-xs text-muted-foreground">Streak</span>
            </div>
            <div className="text-3xl font-bold">
              {currentStreak}
              <span className="text-sm text-muted-foreground ml-1">Tage</span>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Mini Chart */}
      {chartData.length > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-4">
            <h3 className="text-sm font-medium mb-3">Entwicklung</h3>
            <div className="h-24">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <defs>
                    <linearGradient id="scoreGradientMobile" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="none"
                    fill="url(#scoreGradientMobile)"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="score" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="potential" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={1}
                    strokeDasharray="4 4"
                    strokeOpacity={0.5}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Before/After Comparison */}
      {canCompare && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium">Vorher / Nachher</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCompareIndex(Math.min(compareIndex + 1, maxCompareIndex))}
                  disabled={compareIndex >= maxCompareIndex}
                  className="p-1.5 rounded-full bg-card border border-border disabled:opacity-30"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCompareIndex(Math.max(compareIndex - 1, 0))}
                  disabled={compareIndex <= 0}
                  className="p-1.5 rounded-full bg-card border border-border disabled:opacity-30"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Before */}
              <div className="space-y-2">
                <div className="aspect-[3/4] rounded-xl overflow-hidden bg-muted">
                  {beforeAnalysis?.signedPhotoUrls?.[0] ? (
                    <ProgressImage
                      src={beforeAnalysis.signedPhotoUrls[0]}
                      alt="Vorher"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Camera className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold">{beforeAnalysis?.looks_score?.toFixed(1)}</div>
                  <div className="text-xs text-muted-foreground">
                    {format(new Date(beforeAnalysis?.created_at), "dd.MM.yy", { locale: de })}
                  </div>
                </div>
              </div>

              {/* After */}
              <div className="space-y-2">
                <div className="aspect-[3/4] rounded-xl overflow-hidden bg-muted relative">
                  {afterAnalysis?.signedPhotoUrls?.[0] ? (
                    <ProgressImage
                      src={afterAnalysis.signedPhotoUrls[0]}
                      alt="Nachher"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Camera className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                  {/* Improvement badge */}
                  {beforeAnalysis?.looks_score && afterAnalysis?.looks_score && (
                    <div className={cn(
                      "absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-bold",
                      afterAnalysis.looks_score > beforeAnalysis.looks_score
                        ? "bg-green-500 text-white"
                        : "bg-muted text-muted-foreground"
                    )}>
                      {afterAnalysis.looks_score > beforeAnalysis.looks_score && "+"}
                      {(afterAnalysis.looks_score - beforeAnalysis.looks_score).toFixed(1)}
                    </div>
                  )}
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-primary">{afterAnalysis?.looks_score?.toFixed(1)}</div>
                  <div className="text-xs text-muted-foreground">
                    {format(new Date(afterAnalysis?.created_at), "dd.MM.yy", { locale: de })}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Analyses Count */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-center py-4"
      >
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Target className="w-4 h-4" />
          <span>{completedAnalyses.length} Analysen insgesamt</span>
        </div>
      </motion.div>
    </div>
  );
};
