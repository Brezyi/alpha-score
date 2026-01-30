import { useState, useEffect } from "react";
import { 
  Calendar, 
  Flame, 
  TrendingUp, 
  Trophy, 
  Sparkles, 
  Target,
  ChevronRight,
  Zap
} from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface WeeklyStats {
  analysesCompleted: number;
  scoreChange: number | null;
  streakDays: number;
  xpEarned: number;
  achievementsUnlocked: number;
  challengesCompleted: number;
  weekStart: Date;
  weekEnd: Date;
}

interface WeeklySummaryCardProps {
  currentStreak: number;
  currentXp: number;
  isPremium: boolean;
}

export function WeeklySummaryCard({ currentStreak, currentXp, isPremium }: WeeklySummaryCardProps) {
  const { user } = useAuth();
  const [stats, setStats] = useState<WeeklyStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWeeklyStats = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Calculate week boundaries (Monday to Sunday)
        const now = new Date();
        const dayOfWeek = now.getDay();
        const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() + diffToMonday);
        weekStart.setHours(0, 0, 0, 0);
        
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);

        // Fetch all data in parallel
        const [analysesRes, achievementsRes, challengesRes] = await Promise.all([
          // Analyses this week
          supabase
            .from("analyses")
            .select("looks_score, created_at")
            .eq("user_id", user.id)
            .eq("status", "completed")
            .gte("created_at", weekStart.toISOString())
            .lte("created_at", weekEnd.toISOString())
            .order("created_at", { ascending: true }),
          
          // Achievements unlocked this week
          supabase
            .from("user_achievements")
            .select("id")
            .eq("user_id", user.id)
            .gte("unlocked_at", weekStart.toISOString())
            .lte("unlocked_at", weekEnd.toISOString()),
          
          // Challenges completed this week
          supabase
            .from("user_challenge_progress")
            .select("id")
            .eq("user_id", user.id)
            .eq("completed", true)
            .gte("completed_at", weekStart.toISOString())
            .lte("completed_at", weekEnd.toISOString()),
        ]);

        // Calculate score change
        let scoreChange: number | null = null;
        const analyses = analysesRes.data || [];
        if (analyses.length >= 2) {
          const firstScore = analyses[0].looks_score;
          const lastScore = analyses[analyses.length - 1].looks_score;
          if (firstScore !== null && lastScore !== null) {
            scoreChange = Number((lastScore - firstScore).toFixed(1));
          }
        }

        // Estimate XP earned this week (simplified calculation)
        const xpFromAnalyses = analyses.length * 50;
        const xpFromChallenges = (challengesRes.data?.length || 0) * 25;
        const xpFromAchievements = (achievementsRes.data?.length || 0) * 100;
        const xpEarned = xpFromAnalyses + xpFromChallenges + xpFromAchievements;

        setStats({
          analysesCompleted: analyses.length,
          scoreChange,
          streakDays: currentStreak,
          xpEarned,
          achievementsUnlocked: achievementsRes.data?.length || 0,
          challengesCompleted: challengesRes.data?.length || 0,
          weekStart,
          weekEnd,
        });
      } catch (error) {
        console.error("Error fetching weekly stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchWeeklyStats();
  }, [user, currentStreak]);

  if (loading) {
    return (
      <div className="p-5 rounded-2xl glass-card space-y-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-5 w-40" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const formatDateRange = () => {
    const options: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
    const start = stats.weekStart.toLocaleDateString("de-DE", options);
    const end = stats.weekEnd.toLocaleDateString("de-DE", options);
    return `${start} - ${end}`;
  };

  // Calculate week progress (0-100%)
  const now = new Date();
  const weekProgress = Math.min(
    100,
    Math.round(
      ((now.getTime() - stats.weekStart.getTime()) / 
       (stats.weekEnd.getTime() - stats.weekStart.getTime())) * 100
    )
  );

  const highlights = [
    {
      icon: Target,
      label: "Analysen",
      value: stats.analysesCompleted,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      icon: Flame,
      label: "Streak",
      value: `${stats.streakDays}d`,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
    {
      icon: Zap,
      label: "XP",
      value: `+${stats.xpEarned}`,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
  ];

  return (
    <div className="p-5 rounded-2xl glass-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          <h3 className="font-bold">Wochenrückblick</h3>
        </div>
        <Badge variant="outline" className="text-xs">
          {formatDateRange()}
        </Badge>
      </div>

      {/* Week Progress */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
          <span>Woche</span>
          <span>{weekProgress}%</span>
        </div>
        <Progress value={weekProgress} className="h-1.5" />
      </div>

      {/* Highlight Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {highlights.map((item) => (
          <div 
            key={item.label}
            className={cn(
              "p-3 rounded-xl text-center",
              item.bgColor
            )}
          >
            <item.icon className={cn("w-5 h-5 mx-auto mb-1", item.color)} />
            <p className="text-lg font-bold">{item.value}</p>
            <p className="text-[10px] text-muted-foreground">{item.label}</p>
          </div>
        ))}
      </div>

      {/* Score Change */}
      {stats.scoreChange !== null && (
        <div className={cn(
          "p-3 rounded-xl mb-4 flex items-center justify-between",
          stats.scoreChange > 0 ? "bg-emerald-500/10" : stats.scoreChange < 0 ? "bg-red-500/10" : "bg-muted/50"
        )}>
          <div className="flex items-center gap-2">
            <TrendingUp className={cn(
              "w-5 h-5",
              stats.scoreChange > 0 ? "text-emerald-500" : stats.scoreChange < 0 ? "text-red-500" : "text-muted-foreground"
            )} />
            <span className="text-sm font-medium">Score-Entwicklung</span>
          </div>
          <span className={cn(
            "font-bold",
            stats.scoreChange > 0 ? "text-emerald-500" : stats.scoreChange < 0 ? "text-red-500" : "text-muted-foreground"
          )}>
            {stats.scoreChange > 0 ? "+" : ""}{stats.scoreChange}
          </span>
        </div>
      )}

      {/* Achievements & Challenges */}
      {(stats.achievementsUnlocked > 0 || stats.challengesCompleted > 0) && (
        <div className="flex items-center gap-2 flex-wrap">
          {stats.achievementsUnlocked > 0 && (
            <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30">
              <Trophy className="w-3 h-3 mr-1" />
              {stats.achievementsUnlocked} Achievement{stats.achievementsUnlocked !== 1 ? "s" : ""}
            </Badge>
          )}
          {stats.challengesCompleted > 0 && (
            <Badge className="bg-primary/20 text-primary border-primary/30">
              <Sparkles className="w-3 h-3 mr-1" />
              {stats.challengesCompleted} Challenge{stats.challengesCompleted !== 1 ? "s" : ""}
            </Badge>
          )}
        </div>
      )}

      <Link to="/progress" className="block mt-4">
        <Button variant="ghost" size="sm" className="w-full text-xs">
          Vollständigen Fortschritt ansehen
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </Link>
    </div>
  );
}
