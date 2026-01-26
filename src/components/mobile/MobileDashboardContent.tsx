import { Button } from "@/components/ui/button";
import { 
  Camera, 
  TrendingUp, 
  MessageSquare,
  Target,
  Heart,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Loader2,
  Trophy,
  ChevronRight,
  Sparkles,
  Crown,
  Zap,
  Flame
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import React, { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { useStreak } from "@/hooks/useStreak";
import { useProfile } from "@/hooks/useProfile";
import { ProfileOnboardingModal } from "@/components/ProfileOnboardingModal";
import { AnalysisThumbnail } from "@/components/AnalysisThumbnail";
import { useGamification } from "@/hooks/useGamification";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Haptics, ImpactStyle } from "@capacitor/haptics";

type Analysis = {
  id: string;
  looks_score: number | null;
  potential_score: number | null;
  created_at: string;
  status: string;
  photo_urls: string[] | null;
};

// Animated counter with smooth easing
const AnimatedCounter = ({ value, decimals = 1 }: { value: number; decimals?: number }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const animatedRef = useRef(false);

  useEffect(() => {
    if (animatedRef.current) {
      setDisplayValue(value);
      return;
    }
    
    animatedRef.current = true;
    const duration = 1500;
    const startTime = performance.now();
    
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      setDisplayValue(eased * value);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, [value]);

  return <span>{displayValue.toFixed(decimals)}</span>;
};

// Circular Progress Ring
const CircularProgress = ({ 
  progress, 
  size = 160, 
  strokeWidth = 10,
  score,
  maxScore = 10
}: { 
  progress: number; 
  size?: number; 
  strokeWidth?: number;
  score: number;
  maxScore?: number;
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Background glow */}
      <div className="absolute inset-0 rounded-full bg-primary/20 blur-2xl scale-110" />
      
      {/* Background ring */}
      <svg width={size} height={size} className="rotate-[-90deg]">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
          opacity={0.3}
        />
        {/* Progress ring */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#scoreGradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
        <defs>
          <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(var(--primary))" />
            <stop offset="100%" stopColor="hsl(var(--primary) / 0.6)" />
          </linearGradient>
        </defs>
      </svg>
      
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold text-foreground">
          <AnimatedCounter value={score} decimals={1} />
        </span>
        <span className="text-sm text-muted-foreground font-medium">/ {maxScore}</span>
      </div>
    </div>
  );
};

interface MobileDashboardContentProps {
  className?: string;
}

export const MobileDashboardContent = ({ className }: MobileDashboardContentProps) => {
  const { user, loading } = useAuth();
  const { profile, updateProfile, loading: profileLoading } = useProfile();
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [analysesLoading, setAnalysesLoading] = useState(true);
  const navigate = useNavigate();
  const { isPremium, subscriptionType } = useSubscription();
  const { currentStreak } = useStreak();
  const { xp } = useGamification();

  const needsOnboarding = !profileLoading && profile && !profile.gender;

  const handleOnboardingComplete = async (data: { gender: "male" | "female"; country: string }) => {
    await updateProfile({ gender: data.gender, country: data.country });
  };

  const handleHaptic = async () => {
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch {}
  };

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const fetchAnalyses = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from("analyses")
          .select("id, looks_score, potential_score, created_at, status, photo_urls")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(5);

        if (error) throw error;
        setAnalyses(data || []);
      } catch (error) {
        console.error("Error fetching analyses:", error);
      } finally {
        setAnalysesLoading(false);
      }
    };

    if (user) {
      fetchAnalyses();
    }
  }, [user]);

  if (loading || analysesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-primary/20" />
            <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          </div>
          <span className="text-sm text-muted-foreground">Wird geladen...</span>
        </div>
      </div>
    );
  }

  const completedAnalyses = analyses.filter(a => a.status === "completed" && a.looks_score !== null);
  const latestScore = completedAnalyses[0]?.looks_score ?? null;
  const latestPotential = completedAnalyses[0]?.potential_score ?? null;
  const previousScore = completedAnalyses[1]?.looks_score ?? null;
  const scoreDiff = latestScore !== null && previousScore !== null 
    ? latestScore - previousScore
    : null;
  const progress = latestScore !== null && latestPotential !== null 
    ? Math.round((latestScore / latestPotential) * 100)
    : 0;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Guten Morgen";
    if (hour < 18) return "Guten Tag";
    return "Guten Abend";
  };

  const displayName = profile?.display_name || user?.email?.split("@")[0] || "User";

  const quickActions = [
    { icon: Camera, label: "Analyse", path: "/upload", color: "bg-primary/15 text-primary" },
    { icon: Target, label: "Plan", path: "/plan", color: "bg-blue-500/15 text-blue-500" },
    { icon: Heart, label: "Lifestyle", path: "/lifestyle", color: "bg-pink-500/15 text-pink-500" },
    { icon: MessageSquare, label: "Coach", path: "/coach", color: "bg-violet-500/15 text-violet-500" },
  ];

  return (
    <div className={cn("px-5 pb-6 space-y-6", className)}>
      <ProfileOnboardingModal 
        open={needsOnboarding} 
        onComplete={handleOnboardingComplete} 
      />

      {/* Header with greeting */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="pt-2"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{getGreeting()}</p>
            <h1 className="text-2xl font-bold tracking-tight">{displayName}</h1>
          </div>
          {isPremium && (
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-primary/20 to-amber-500/20 border border-primary/30"
            >
              {subscriptionType === "lifetime" ? (
                <Sparkles className="w-4 h-4 text-amber-400" />
              ) : (
                <Crown className="w-4 h-4 text-amber-400" />
              )}
              <span className="text-xs font-semibold text-amber-400 uppercase tracking-wide">
                {subscriptionType}
              </span>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Main Score Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
      >
        {latestScore !== null ? (
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-card via-card to-card/50 border border-border p-6">
            {/* Decorative elements */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-primary/5 rounded-full blur-2xl" />
            
            <div className="relative flex flex-col items-center">
              {/* Score Ring */}
              <CircularProgress 
                progress={progress}
                score={latestScore}
                size={180}
                strokeWidth={12}
              />
              
              {/* Score Change */}
              {scoreDiff !== null && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className={cn(
                    "flex items-center gap-1 mt-4 px-4 py-2 rounded-full text-sm font-semibold",
                    scoreDiff > 0 && "bg-green-500/15 text-green-500",
                    scoreDiff < 0 && "bg-red-500/15 text-red-500",
                    scoreDiff === 0 && "bg-muted text-muted-foreground"
                  )}
                >
                  {scoreDiff > 0 ? <ArrowUpRight className="w-4 h-4" /> :
                   scoreDiff < 0 ? <ArrowDownRight className="w-4 h-4" /> :
                   <Minus className="w-4 h-4" />}
                  {scoreDiff > 0 && "+"}{scoreDiff.toFixed(1)} seit letzter Analyse
                </motion.div>
              )}

              {/* Potential indicator */}
              {latestPotential && (
                <div className="flex items-center gap-4 mt-6 pt-4 border-t border-border/50 w-full">
                  <div className="flex-1 text-center">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider block mb-1">Potenzial</span>
                    <span className="text-xl font-bold text-primary">{latestPotential.toFixed(1)}</span>
                  </div>
                  <div className="w-px h-10 bg-border" />
                  <div className="flex-1 text-center">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider block mb-1">Fortschritt</span>
                    <span className="text-xl font-bold">{progress}%</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* No Score - Start CTA */
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/30 p-8">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl" />
            
            <div className="relative flex flex-col items-center text-center space-y-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/30"
              >
                <Camera className="w-10 h-10 text-primary-foreground" />
              </motion.div>
              <div>
                <h3 className="text-xl font-bold mb-1">Starte deine Reise</h3>
                <p className="text-sm text-muted-foreground">
                  Lade Fotos hoch und erhalte deine persönliche KI-Analyse
                </p>
              </div>
              <Button 
                variant="hero" 
                size="lg" 
                className="w-full h-14 text-base rounded-xl shadow-lg shadow-primary/20"
                onClick={() => {
                  handleHaptic();
                  navigate("/upload");
                }}
              >
                <Zap className="w-5 h-5 mr-2" />
                Erste Analyse starten
              </Button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-3 gap-3"
      >
        {[
          { value: currentStreak, label: "Streak", icon: Flame, color: "text-orange-500" },
          { value: `Lv.${xp.level}`, label: "Level", icon: Zap, color: "text-primary" },
          { value: completedAnalyses.length, label: "Scans", icon: Camera, color: "text-blue-500" },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 + i * 0.05 }}
            className="bg-card border border-border rounded-2xl p-4 text-center"
          >
            <stat.icon className={cn("w-5 h-5 mx-auto mb-2", stat.color)} />
            <div className="text-xl font-bold">{stat.value}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">{stat.label}</div>
          </motion.div>
        ))}
      </motion.div>

      {/* Quick Actions Grid */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-3"
      >
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">Schnellzugriff</h2>
        <div className="grid grid-cols-4 gap-3">
          {quickActions.map((action, i) => (
            <motion.div
              key={action.path}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + i * 0.05 }}
            >
              <Link
                to={action.path}
                onClick={handleHaptic}
                className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-card border border-border active:scale-95 transition-all"
              >
                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", action.color)}>
                  <action.icon className="w-6 h-6" />
                </div>
                <span className="text-xs font-medium text-muted-foreground">{action.label}</span>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Recent Analyses */}
      {completedAnalyses.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-3"
        >
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Letzte Analysen</h2>
            <Link 
              to="/progress" 
              className="flex items-center gap-1 text-xs text-primary font-medium"
              onClick={handleHaptic}
            >
              Alle
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-2">
            {completedAnalyses.slice(0, 3).map((analysis, i) => (
              <motion.div
                key={analysis.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.05 }}
              >
                <Link
                  to={`/analysis/${analysis.id}`}
                  onClick={handleHaptic}
                  className="flex items-center gap-4 bg-card border border-border rounded-2xl p-4 active:scale-[0.98] transition-all"
                >
                  <AnalysisThumbnail 
                    photoUrls={analysis.photo_urls} 
                    className="w-14 h-14 rounded-xl"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xl font-bold text-primary">{analysis.looks_score?.toFixed(1)}</span>
                      <span className="text-sm text-muted-foreground">/10</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {new Date(analysis.created_at).toLocaleDateString("de-DE", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric"
                      })}
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Achievement Teaser */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Link
          to="/progress"
          onClick={handleHaptic}
          className="block bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-red-500/10 border border-amber-500/20 rounded-2xl p-4 active:scale-[0.98] transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">Achievements</h3>
              <p className="text-xs text-muted-foreground">Schalte Belohnungen frei und tracke deinen Fortschritt</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </div>
        </Link>
      </motion.div>
    </div>
  );
};
