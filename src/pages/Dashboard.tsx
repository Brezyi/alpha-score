import { Button } from "@/components/ui/button";
import { 
  Zap, 
  Camera, 
  TrendingUp, 
  MessageSquare, 
  Target, 
  Crown,
  Flame,
  ChevronRight,
  Lock,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Loader2,
  Shield,
  Trophy,
  Calendar,
  X,
  AlertTriangle,
  Sparkles,
  Hexagon,
  Square,
  Droplets,
  Eye,
  Scissors,
  ChevronDown,
  Info
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Link, useNavigate } from "react-router-dom";
import React, { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/hooks/useSubscription";
import { useUserRole } from "@/hooks/useUserRole";
import { useStreak } from "@/hooks/useStreak";
import { useProfile } from "@/hooks/useProfile";
import { ProfileMenu } from "@/components/ProfileMenu";
import { ProfileOnboardingModal } from "@/components/ProfileOnboardingModal";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useGlobalSettings } from "@/contexts/SystemSettingsContext";
import { TestimonialSubmitDialog } from "@/components/TestimonialSubmitDialog";
import { Progress } from "@/components/ui/progress";
import { AnalysisThumbnail } from "@/components/AnalysisThumbnail";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Analysis = {
  id: string;
  looks_score: number | null;
  potential_score: number | null;
  created_at: string;
  status: string;
  strengths: string[] | null;
  weaknesses: string[] | null;
  photo_urls: string[] | null;
  detailed_results: any;
};

const quickActions = [
  {
    icon: Camera,
    title: "Neue Analyse",
    description: "Lade Fotos hoch für deine KI-Bewertung",
    href: "/upload",
    color: "bg-primary/10 text-primary",
    premium: false,
  },
  {
    icon: Target,
    title: "Mein Plan",
    description: "Dein personalisierter Looksmax-Plan",
    href: "/plan",
    color: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    premium: true,
  },
  {
    icon: TrendingUp,
    title: "Fortschritt",
    description: "Verfolge deine Entwicklung",
    href: "/progress",
    color: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
    premium: true,
  },
  {
    icon: MessageSquare,
    title: "AI Coach",
    description: "Stelle Fragen an deinen Coach",
    href: "/coach",
    color: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
    premium: true,
  },
];

// Animated number (60fps) without React re-renders
const AnimatedNumber = React.forwardRef<
  HTMLSpanElement,
  { value: number; decimals?: number; durationMs?: number; className?: string }
>(({ value, decimals = 1, durationMs = 1800, className }, forwardedRef) => {
  const localRef = useRef<HTMLSpanElement | null>(null);
  const animatedOnceRef = useRef(false);

  const setRefs = (node: HTMLSpanElement | null) => {
    localRef.current = node;
    if (!forwardedRef) return;
    if (typeof forwardedRef === "function") forwardedRef(node);
    else (forwardedRef as React.MutableRefObject<HTMLSpanElement | null>).current = node;
  };

  useEffect(() => {
    const el = localRef.current;
    if (!el) return;

    const target = Number.isFinite(value) ? value : 0;

    // If we've already animated once, just set the final value (no re-animation)
    if (animatedOnceRef.current) {
      el.textContent = target.toFixed(decimals);
      return;
    }

    animatedOnceRef.current = true;
    const start = 0;
    const startTime = performance.now();
    el.textContent = start.toFixed(decimals);

    let rafId = 0;
    const tick = (now: number) => {
      const t = Math.min((now - startTime) / durationMs, 1);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - t, 3);
      const current = start + eased * (target - start);
      el.textContent = current.toFixed(decimals);
      if (t < 1) rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [value, decimals, durationMs]);

  return <span ref={setRefs} className={className} />;
});
AnimatedNumber.displayName = "AnimatedNumber";

const Dashboard = () => {
  const { user, loading } = useAuth();
  const { profile, updateProfile, loading: profileLoading } = useProfile();
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [analysesLoading, setAnalysesLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [analysisToDelete, setAnalysisToDelete] = useState<Analysis | null>(null);
  const [hasAnimated, setHasAnimated] = useState(false);
  const [viewedDetails, setViewedDetails] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem('dashboard-viewed-details');
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  // Persist viewed details to localStorage
  useEffect(() => {
    if (viewedDetails.size > 0) {
      localStorage.setItem('dashboard-viewed-details', JSON.stringify([...viewedDetails]));
    }
  }, [viewedDetails]);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isPremium, subscriptionType, subscriptionEnd } = useSubscription();
  const { isAdminOrOwner, role } = useUserRole();
  const { currentStreak, longestStreak, isActiveToday, loading: streakLoading } = useStreak();
  const { settings } = useGlobalSettings();

  // Format subscription badge
  const getSubscriptionBadge = () => {
    if (!isPremium) return null;
    
    const formatEndDate = (dateStr: string | null) => {
      if (!dateStr) return null;
      const date = new Date(dateStr);
      return date.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
    };

    switch (subscriptionType) {
      case "owner":
        return { label: "Owner", icon: Crown, className: "bg-amber-500/20 text-amber-500 border-amber-500/30" };
      case "lifetime":
        return { label: "Lifetime", icon: Sparkles, className: "bg-primary/20 text-primary border-primary/30" };
      case "premium":
        return { 
          label: `Premium${subscriptionEnd ? ` bis ${formatEndDate(subscriptionEnd)}` : ""}`, 
          icon: Crown, 
          className: "bg-primary/20 text-primary border-primary/30" 
        };
      default:
        return null;
    }
  };

  const subscriptionBadge = getSubscriptionBadge();

  // Trigger animation once analyses are loaded
  useEffect(() => {
    if (!analysesLoading && analyses.length > 0 && !hasAnimated) {
      setHasAnimated(true);
    }
  }, [analysesLoading, analyses, hasAnimated]);

  // Check if onboarding is needed (profile loaded but no gender set)
  const needsOnboarding = !profileLoading && profile && !profile.gender;

  // Handle onboarding completion
  const handleOnboardingComplete = async (data: { gender: "male" | "female"; country: string }) => {
    await updateProfile({ gender: data.gender, country: data.country });
  };

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  // Fetch analyses
  useEffect(() => {
    const fetchAnalyses = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from("analyses")
          .select("id, looks_score, potential_score, created_at, status, strengths, weaknesses, photo_urls, detailed_results")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setAnalyses(data || []);
      } catch (error: any) {
        console.error("Error fetching analyses:", error);
      } finally {
        setAnalysesLoading(false);
      }
    };

    if (user) {
      fetchAnalyses();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isPremiumUser = isPremium;

  // Calculate stats
  const completedAnalyses = analyses.filter(a => a.status === "completed" && a.looks_score !== null);
  const latestScore = completedAnalyses[0]?.looks_score ?? null;
  const latestPotential = completedAnalyses[0]?.potential_score ?? null;
  const previousScore = completedAnalyses[1]?.looks_score ?? null;
  const scoreDiff = latestScore !== null && previousScore !== null 
    ? (latestScore - previousScore).toFixed(1) 
    : null;
  
  // Calculate progress to potential (percentage)
  const potentialProgress = latestScore !== null && latestPotential !== null 
    ? Math.round((latestScore / latestPotential) * 100)
    : null;
  const pointsToGo = latestScore !== null && latestPotential !== null
    ? (latestPotential - latestScore).toFixed(1)
    : null;
  
  // Check if current score is the personal best
  const allScores = completedAnalyses.map(a => a.looks_score).filter((s): s is number => s !== null);
  const highestScore = allScores.length > 0 ? Math.max(...allScores) : null;
  const isPersonalBest = latestScore !== null && highestScore !== null && latestScore >= highestScore && completedAnalyses.length > 1;

  // Chart data (last 10 analyses, reversed for chronological order) with potential
  const chartData = completedAnalyses
    .slice(0, 10)
    .reverse()
    .map((a) => ({
      date: new Date(a.created_at).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" }),
      score: a.looks_score,
      potential: a.potential_score,
    }));

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("de-DE", { 
      day: "2-digit", 
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Profile Onboarding Modal */}
      <ProfileOnboardingModal 
        open={needsOnboarding} 
        onComplete={handleOnboardingComplete} 
      />

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border">
        <div className="container px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
                <Zap className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">{settings.app_name}</span>
            </Link>

            <div className="flex items-center gap-3">
              {subscriptionBadge && (
                <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${subscriptionBadge.className}`}>
                  <subscriptionBadge.icon className="w-3.5 h-3.5" />
                  {subscriptionBadge.label}
                </div>
              )}
              <div className="hidden sm:block">
                <TestimonialSubmitDialog />
              </div>
              {isAdminOrOwner && (
                <Link to="/admin">
                  <Button variant="outline" size="sm" className="hidden sm:flex gap-2">
                    <Shield className="w-4 h-4" />
                    Admin
                  </Button>
                </Link>
              )}
              {!isPremium && (
                <Link to="/pricing">
                  <Button variant="premium" size="sm" className="hidden sm:flex">
                    <Crown className="w-4 h-4" />
                    Premium
                  </Button>
                </Link>
              )}
              <ProfileMenu />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8 animate-fade-in" style={{ animationDelay: "0ms" }}>
          <h1 className="text-3xl font-bold mb-2">
            Hey, {profile?.display_name?.split(" ")[0] || user?.user_metadata?.full_name?.split(" ")[0] || "Champ"} 👋
          </h1>
          <p className="text-muted-foreground">
            Bereit, heute besser zu werden?
          </p>
        </div>

        {/* Stats Overview - Showcase Style */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Main Score Card with Circle */}
          <div className="md:col-span-1 p-6 rounded-2xl glass-card opacity-0 animate-fade-in-up relative" style={{ animationDelay: "100ms", animationFillMode: "forwards" }}>
            {/* Personal Best Badge */}
            {isPersonalBest && (
              <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-medium">
                <Trophy className="w-3 h-3" />
                <span>Bestwert</span>
              </div>
            )}
            <div className="text-center">
              <div className="text-sm text-muted-foreground mb-3">Dein Looks Score</div>
              <div className="relative inline-flex items-center justify-center">
                <svg
                  className="w-32 h-32 transform -rotate-90 overflow-visible"
                  viewBox="-8 -8 144 144"
                >
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-muted/30"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="url(#dashboardScoreGradient)"
                    strokeWidth="8"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={352}
                    strokeDashoffset={352 - (352 * (latestScore || 0)) / 10}
                    className={`transition-all duration-1000 ease-out ${scoreDiff !== null && parseFloat(scoreDiff) > 0 ? '[filter:drop-shadow(0_0_6px_hsl(var(--primary)/0.5))]' : ''}`}
                  />
                  <defs>
                    <linearGradient id="dashboardScoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="hsl(var(--primary))" />
                      <stop offset="100%" stopColor="hsl(153, 100%, 60%)" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-black text-primary">
                    {latestScore !== null ? (
                      hasAnimated ? <AnimatedNumber value={latestScore} /> : latestScore.toFixed(1)
                    ) : "—"}
                  </span>
                  <span className="text-xs text-muted-foreground">von 10</span>
                </div>
              </div>
              
              {/* Score Change Indicator - centered below */}
              {scoreDiff !== null && (
                <div className="mt-3 flex justify-center">
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${
                    parseFloat(scoreDiff) > 0 ? "bg-green-500/10 text-green-500" : 
                    parseFloat(scoreDiff) < 0 ? "bg-red-500/10 text-red-500" : "bg-muted text-muted-foreground"
                  }`}>
                    {parseFloat(scoreDiff) > 0 ? (
                      <ArrowUpRight className="w-4 h-4" />
                    ) : parseFloat(scoreDiff) < 0 ? (
                      <ArrowDownRight className="w-4 h-4" />
                    ) : (
                      <Minus className="w-4 h-4" />
                    )}
                    <span>{parseFloat(scoreDiff) > 0 ? "+" : ""}{scoreDiff}</span>
                    <span className="text-muted-foreground font-normal">seit letzter Analyse</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Potential & Stats */}
          <div className="md:col-span-2 space-y-4">
            {/* Potential Card */}
            {latestPotential !== null && (
              <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 opacity-0 animate-fade-in-up" style={{ animationDelay: "200ms", animationFillMode: "forwards" }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    <span className="font-medium">Dein Potenzial</span>
                  </div>
                  <span className="text-2xl font-bold text-primary">{latestPotential.toFixed(1)}</span>
                </div>
                {pointsToGo && (
                  <div className="mt-2 text-sm text-muted-foreground">
                    Noch <span className="text-primary font-semibold">+{pointsToGo} Punkte</span> erreichbar
                  </div>
                )}
              </div>
            )}

            {/* Mini Stats Grid */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-4 rounded-xl bg-muted/50 text-center opacity-0 animate-fade-in-up hover:scale-[1.02] transition-transform" style={{ animationDelay: "250ms", animationFillMode: "forwards" }}>
                <div className="text-2xl font-bold">{completedAnalyses.length}</div>
                <div className="text-xs text-muted-foreground">Analysen</div>
              </div>
              <div className="p-4 rounded-xl bg-muted/50 text-center opacity-0 animate-fade-in-up hover:scale-[1.02] transition-transform" style={{ animationDelay: "300ms", animationFillMode: "forwards" }}>
                <div className="flex items-center justify-center gap-1">
                  <span className="text-2xl font-bold">
                    {streakLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                    ) : currentStreak}
                  </span>
                  {!streakLoading && currentStreak > 0 && <Flame className="w-5 h-5 text-orange-500" />}
                </div>
                <div className="text-xs text-muted-foreground">Streak</div>
                {!streakLoading && !isActiveToday && currentStreak > 0 && (
                  <div className="text-[10px] text-orange-400 mt-1 animate-pulse">Heute aktiv werden!</div>
                )}
              </div>
              <div className="p-4 rounded-xl bg-muted/50 text-center opacity-0 animate-fade-in-up hover:scale-[1.02] transition-transform" style={{ animationDelay: "350ms", animationFillMode: "forwards" }}>
                <div className="text-2xl font-bold text-primary">{latestPotential ? `Top ${Math.round((1 - (latestScore || 0) / 10) * 100)}%` : "—"}</div>
                <div className="text-xs text-muted-foreground">Ranking</div>
              </div>
            </div>
          </div>
        </div>

        {/* Potential Progress Bar */}
        {potentialProgress !== null && latestPotential !== null && (
          <div className="mb-8 p-6 rounded-2xl glass-card opacity-0 animate-fade-in-up" style={{ animationDelay: "500ms", animationFillMode: "forwards" }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary animate-pulse" />
                <h3 className="font-semibold">Fortschritt zu deinem Potenzial</h3>
              </div>
              <div className="text-sm text-muted-foreground">
                <span className="text-foreground font-bold">{latestScore?.toFixed(1)}</span>
                <span className="mx-1">/</span>
                <span className="text-primary font-bold">{latestPotential.toFixed(1)}</span>
              </div>
            </div>
            <div className="relative">
              <Progress value={potentialProgress} animated={hasAnimated} animationDuration={2200} glowOnComplete className="h-4" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-medium text-primary-foreground drop-shadow-sm">
                  {hasAnimated ? <AnimatedNumber value={potentialProgress} decimals={0} /> : potentialProgress}%
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between mt-2 text-sm">
              <span className="text-muted-foreground">
                Noch <span className="text-primary font-semibold">+{pointsToGo} Punkte</span> möglich
              </span>
              <Link to="/plan" className="text-primary hover:underline flex items-center gap-1 group">
                Plan ansehen
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        )}

        {/* Detaillierte Analyse - Feature Scores */}
        {completedAnalyses.length > 0 && (
          <div className="mb-8 p-6 rounded-2xl glass-card opacity-0 animate-fade-in-up relative overflow-hidden" style={{ animationDelay: "550ms", animationFillMode: "forwards" }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                Detaillierte Analyse
                {!isPremiumUser && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-primary/20 text-primary rounded-full flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    Premium
                  </span>
                )}
              </h3>
              {isPremiumUser && (
                <Link to={`/analysis/${completedAnalyses[0].id}`} className="text-sm text-primary hover:underline flex items-center gap-1 group">
                  Vollständig ansehen
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              )}
            </div>
            
            <div className={`grid md:grid-cols-2 lg:grid-cols-3 gap-4 ${!isPremiumUser ? 'blur-sm pointer-events-none select-none' : ''}`}>
              {(() => {
                const detailedResults = completedAnalyses[0]?.detailed_results;
                const baseScore = completedAnalyses[0]?.looks_score || 5;
                
                // Helper to extract score value
                const extractScore = (value: any, fallback: number): number => {
                  if (value === null || value === undefined) return fallback;
                  if (typeof value === 'number') return value;
                  if (typeof value === 'object' && 'score' in value) return Number(value.score) || fallback;
                  if (typeof value === 'string') return parseFloat(value) || fallback;
                  return fallback;
                };

                // Helper to extract issues array
                const extractIssues = (value: any): string[] => {
                  if (value && typeof value === 'object' && 'issues' in value && Array.isArray(value.issues)) {
                    return value.issues;
                  }
                  return [];
                };

                // Helper to extract details string
                const extractDetails = (value: any): string => {
                  if (value && typeof value === 'object' && 'details' in value && typeof value.details === 'string') {
                    return value.details;
                  }
                  return '';
                };
                
                const featureScores = [
                  { key: "face_symmetry", label: "Gesichtssymmetrie", score: isPremiumUser ? extractScore(detailedResults?.face_symmetry, baseScore + 0.3) : 7.2, color: "bg-emerald-500", iconBg: "bg-emerald-500/20", iconColor: "text-emerald-500", Icon: Hexagon, issues: extractIssues(detailedResults?.face_symmetry), details: extractDetails(detailedResults?.face_symmetry) },
                  { key: "jawline", label: "Jawline Definition", score: isPremiumUser ? extractScore(detailedResults?.jawline, baseScore - 0.2) : 6.8, color: "bg-blue-500", iconBg: "bg-blue-500/20", iconColor: "text-blue-500", Icon: Square, issues: extractIssues(detailedResults?.jawline), details: extractDetails(detailedResults?.jawline) },
                  { key: "skin_quality", label: "Hautqualität", score: isPremiumUser ? extractScore(detailedResults?.skin_quality, baseScore - 0.5) : 5.9, color: "bg-orange-500", iconBg: "bg-orange-500/20", iconColor: "text-orange-500", Icon: Droplets, issues: extractIssues(detailedResults?.skin_quality), details: extractDetails(detailedResults?.skin_quality) },
                  { key: "eye_area", label: "Augenbereich", score: isPremiumUser ? extractScore(detailedResults?.eye_area, baseScore + 0.5) : 7.5, color: "bg-purple-500", iconBg: "bg-purple-500/20", iconColor: "text-purple-500", Icon: Eye, issues: extractIssues(detailedResults?.eye_area), details: extractDetails(detailedResults?.eye_area) },
                  { key: "hair_styling", label: "Haare & Styling", score: isPremiumUser ? extractScore(detailedResults?.hair_styling, baseScore - 0.3) : 6.4, color: "bg-pink-500", iconBg: "bg-pink-500/20", iconColor: "text-pink-500", Icon: Scissors, issues: extractIssues(detailedResults?.hair_styling), details: extractDetails(detailedResults?.hair_styling) },
                ];
                
                return featureScores.map((item, index) => {
                  const hasDetails = isPremiumUser && (item.issues.length > 0 || item.details);
                  const hasBeenViewed = viewedDetails.has(item.key);
                  const showPulse = hasDetails && !hasBeenViewed;
                  
                  const handleOpenChange = (open: boolean) => {
                    if (open && !hasBeenViewed) {
                      setViewedDetails(prev => new Set([...prev, item.key]));
                    }
                  };
                  
                  return (
                    <Collapsible key={item.key} onOpenChange={handleOpenChange}>
                      <div 
                        className="p-4 rounded-xl bg-card border border-border/50 opacity-0 animate-fade-in"
                        style={{ animationDelay: `${600 + index * 50}ms`, animationFillMode: "forwards" }}
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`w-8 h-8 rounded-lg ${item.iconBg} flex items-center justify-center relative`}>
                            <item.Icon className={`w-4 h-4 ${item.iconColor}`} />
                            {hasDetails && (
                              <>
                                {showPulse && (
                                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full animate-ping opacity-75" />
                                )}
                                <span className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full flex items-center justify-center">
                                  <Info className="w-2 h-2 text-primary-foreground" />
                                </span>
                              </>
                            )}
                          </div>
                          <div className="flex-1 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{item.label}</span>
                              {hasDetails && !hasBeenViewed && (
                                <span className="px-1.5 py-0.5 text-[10px] font-medium bg-primary/15 text-primary rounded-full">
                                  Details
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold">{Math.min(10, item.score).toFixed(1)}</span>
                              {hasDetails && (
                                <CollapsibleTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-muted">
                                    <ChevronDown className="w-4 h-4 transition-transform duration-200 data-[state=open]:rotate-180" />
                                  </Button>
                                </CollapsibleTrigger>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className={`h-full rounded-full ${item.color} transition-all duration-1000`}
                            style={{ width: `${Math.min(100, item.score * 10)}%` }}
                          />
                        </div>
                        
                        {hasDetails && (
                          <CollapsibleContent className="mt-3 pt-3 border-t border-border/50">
                            {item.details && (
                              <p className="text-xs text-muted-foreground mb-2">{item.details}</p>
                            )}
                            {item.issues.length > 0 && (
                              <div className="space-y-1">
                                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                                  <Info className="w-3 h-3" />
                                  Verbesserungspotenzial:
                                </span>
                                <ul className="text-xs text-muted-foreground space-y-0.5 pl-4">
                                  {item.issues.map((issue, i) => (
                                    <li key={i} className="list-disc">{issue}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </CollapsibleContent>
                        )}
                      </div>
                    </Collapsible>
                  );
                });
              })()}
            </div>
            
            {/* Premium CTA Overlay for Free Users */}
            {!isPremiumUser && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-[2px]">
                <div className="text-center p-6 max-w-sm">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                    <Lock className="w-6 h-6 text-primary" />
                  </div>
                  <h4 className="text-lg font-bold mb-2">Detaillierte Scores freischalten</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Erhalte präzise Bewertungen für jedes Gesichtsmerkmal und personalisierte Verbesserungstipps.
                  </p>
                  <Button 
                    onClick={() => navigate("/pricing")}
                    className="bg-gradient-to-r from-primary to-primary/80 hover:opacity-90"
                  >
                    <Crown className="w-4 h-4 mr-2" />
                    Premium freischalten
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Score Chart - Clean Style */}
        {chartData.length >= 2 && (
          <div className="mb-8 p-6 rounded-2xl glass-card opacity-0 animate-scale-in" style={{ animationDelay: "600ms", animationFillMode: "forwards" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Score-Entwicklung
              </h2>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-0.5 bg-primary rounded-full" />
                  <span className="text-muted-foreground">Score</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <svg className="w-4 h-2" viewBox="0 0 16 2">
                    <line x1="0" y1="1" x2="16" y2="1" stroke="hsl(var(--primary))" strokeWidth="2" strokeDasharray="3 2" strokeOpacity="0.5" />
                  </svg>
                  <span className="text-muted-foreground">Potenzial</span>
                </div>
              </div>
            </div>
            
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <XAxis 
                    dataKey="date" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: "hsl(var(--border))", strokeWidth: 1 }}
                    dy={8}
                  />
                  <YAxis 
                    domain={[0, 10]}
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => value.toFixed(0)}
                    ticks={[0, 2.5, 5, 7.5, 10]}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "10px",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                      padding: "8px 12px",
                    }}
                    labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600, marginBottom: 4 }}
                    formatter={(value: number, name: string) => [
                      <span key={name} className="font-semibold">{value?.toFixed(1) || "—"}</span>, 
                      name === "score" ? "Score" : "Potenzial"
                    ]}
                    cursor={{ stroke: "hsl(var(--primary))", strokeWidth: 1, strokeDasharray: "4 4" }}
                  />
                  {/* Potential Line (area fill + dashed) */}
                  <Line
                    type="monotone"
                    dataKey="potential"
                    stroke="hsl(var(--primary) / 0.4)"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                    activeDot={{ r: 4, fill: "hsl(var(--primary) / 0.5)", stroke: "hsl(var(--primary))", strokeWidth: 1 }}
                    connectNulls
                  />
                  {/* Current Score Line (solid, prominent) */}
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="hsl(var(--primary))"
                    strokeWidth={3}
                    dot={{ fill: "hsl(var(--primary))", strokeWidth: 0, r: 5 }}
                    activeDot={{ r: 7, fill: "hsl(var(--primary))", stroke: "hsl(var(--background))", strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Premium Banner (for free users) */}
        {!isPremiumUser && (
          <div className="relative overflow-hidden rounded-2xl p-6 mb-8 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent border border-primary/30 opacity-0 animate-fade-in-up" style={{ animationDelay: "700ms", animationFillMode: "forwards" }}>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <Crown className="w-5 h-5 text-primary animate-float" />
                <span className="text-sm font-medium text-primary">Premium Feature</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Schalte alle Features frei</h3>
              <p className="text-muted-foreground mb-4 max-w-md">
                Erhalte detaillierte Analysen, deinen personalisierten Plan und Zugang zum AI Coach.
              </p>
              <Link to="/pricing">
                <Button variant="hero" className="group">
                  Premium werden
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 animate-pulse" />
          </div>
        )}

        {/* Quick Actions */}

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4 opacity-0 animate-fade-in" style={{ animationDelay: "800ms", animationFillMode: "forwards" }}>Schnellzugriff</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => {
              const isLocked = action.premium && !isPremiumUser;
              return (
                <Link 
                  key={action.title}
                  to={isLocked ? "/pricing" : action.href}
                  className="group relative p-6 rounded-2xl glass-card hover:border-primary/50 transition-all duration-300 opacity-0 animate-fade-in hover:shadow-lg hover:shadow-primary/5"
                  style={{ animationDelay: `${850 + index * 100}ms`, animationFillMode: "forwards" }}
                >
                  {isLocked && (
                    <div className="absolute top-3 right-3">
                      <Lock className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}
                  <div className={`w-12 h-12 rounded-xl ${action.color} flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                    <action.icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">
                    {action.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {action.description}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Analysis History - Show last 5 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4 opacity-0 animate-fade-in" style={{ animationDelay: "1200ms", animationFillMode: "forwards" }}>
            <h2 className="text-xl font-bold">Letzte Analysen</h2>
            {analyses.length > 5 && (
              <Link to="/progress" className="text-sm text-primary hover:underline flex items-center gap-1 group">
                Alle {analyses.length} anzeigen
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            )}
          </div>

          {analysesLoading ? (
            <div className="flex items-center justify-center p-12 rounded-2xl glass-card">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : analyses.length === 0 ? (
            <div className="text-center p-8 rounded-2xl glass-card opacity-0 animate-scale-in" style={{ animationDelay: "1300ms", animationFillMode: "forwards" }}>
              <Camera className="w-12 h-12 text-primary mx-auto mb-4 animate-bounce-subtle" />
              <h3 className="text-xl font-bold mb-2">Noch keine Analysen</h3>
              <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                Lade ein Foto hoch und erhalte in wenigen Sekunden deinen Looks Score.
              </p>
              <Link to="/upload">
                <Button variant="hero" size="lg" className="group">
                  <Camera className="w-5 h-5" />
                  Erste Analyse starten
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {analyses.slice(0, 5).map((analysis, index) => {
                const isPending = analysis.status === "pending" || analysis.status === "processing";
                const isFailed = analysis.status === "failed" || analysis.status === "validation_failed";
                const canDelete = isPending || isFailed;
                
                const handleOpenDeleteDialog = (e: React.MouseEvent) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setAnalysisToDelete(analysis);
                  setDeleteDialogOpen(true);
                };
                
                return (
                  <div
                    key={analysis.id}
                    className="flex items-center gap-4 p-4 rounded-xl glass-card hover:border-primary/50 transition-all group opacity-0 animate-slide-in-right hover:translate-x-1"
                    style={{ animationDelay: `${1300 + index * 100}ms`, animationFillMode: "forwards" }}
                  >
                    {/* Clickable area for navigation */}
                    <Link
                      to={`/analysis/${analysis.id}`}
                      className="flex items-center gap-4 flex-1 min-w-0"
                    >
                      {/* Photo Thumbnail */}
                      <div className="relative flex-shrink-0">
                        <AnalysisThumbnail 
                          photoUrls={analysis.photo_urls} 
                          className="w-14 h-14"
                        />
                        {/* Score Badge */}
                        {analysis.status === "completed" && analysis.looks_score !== null && (
                          <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-background border-2 border-primary/30 flex items-center justify-center">
                            <span className="text-xs font-bold text-primary">
                              {analysis.looks_score.toFixed(1)}
                            </span>
                          </div>
                        )}
                        {analysis.status === "processing" && (
                          <div className="absolute inset-0 bg-background/50 rounded-lg flex items-center justify-center">
                            <Loader2 className="w-5 h-5 animate-spin text-primary" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">
                            {analysis.status === "completed" ? "Analyse abgeschlossen" : 
                             analysis.status === "processing" ? "Wird analysiert..." : 
                             analysis.status === "validation_failed" ? "Validierung fehlgeschlagen" :
                             analysis.status === "failed" ? "Fehlgeschlagen" :
                             "Ausstehend"}
                          </span>
                          {analysis.status === "completed" && (
                            <span className={`px-2 py-0.5 rounded-full text-xs ${
                              analysis.looks_score && analysis.looks_score >= 7 
                                ? "bg-green-500/20 text-green-400"
                                : analysis.looks_score && analysis.looks_score >= 5
                                ? "bg-yellow-500/20 text-yellow-400"
                                : "bg-red-500/20 text-red-400"
                            }`}>
                              {analysis.looks_score && analysis.looks_score >= 7 ? "Top" : 
                               analysis.looks_score && analysis.looks_score >= 5 ? "Durchschnitt" : 
                               "Potenzial"}
                            </span>
                          )}
                          {isPending && (
                            <span className="px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground">
                              In Bearbeitung
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          {formatDate(analysis.created_at)}
                        </div>
                        {analysis.strengths && analysis.strengths.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {analysis.strengths.slice(0, 3).map((strength, i) => (
                              <span key={i} className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs">
                                {strength}
                              </span>
                            ))}
                            {analysis.strengths.length > 3 && (
                              <span className="text-xs text-muted-foreground">
                                +{analysis.strengths.length - 3} mehr
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Arrow */}
                      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </Link>
                    
                    {/* Cancel/Delete button for pending or failed analyses */}
                    {canDelete && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="flex-shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={handleOpenDeleteDialog}
                        title={isFailed ? "Analyse entfernen" : "Analyse abbrechen"}
                      >
                        <X className="w-5 h-5" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* CTA for more analyses */}
        {analyses.length > 0 && (
          <div className="text-center p-6 rounded-2xl glass-card opacity-0 animate-fade-in-up" style={{ animationDelay: "1800ms", animationFillMode: "forwards" }}>
            <h3 className="text-lg font-bold mb-2">Neue Analyse starten</h3>
            <p className="text-muted-foreground mb-4 text-sm">
              Tracke deinen Fortschritt mit regelmäßigen Analysen.
            </p>
            <Link to="/upload">
              <Button variant="hero" className="group">
                <Camera className="w-5 h-5 group-hover:scale-110 transition-transform" />
                Foto analysieren
              </Button>
            </Link>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                </div>
                <AlertDialogTitle>
                  {analysisToDelete?.status === "pending" || analysisToDelete?.status === "processing"
                    ? "Analyse abbrechen?"
                    : "Analyse entfernen?"}
                </AlertDialogTitle>
              </div>
              <AlertDialogDescription>
                {analysisToDelete?.status === "pending" || analysisToDelete?.status === "processing"
                  ? "Diese laufende Analyse wird abgebrochen und gelöscht. Diese Aktion kann nicht rückgängig gemacht werden."
                  : "Diese fehlgeschlagene Analyse wird aus deiner Historie entfernt. Diese Aktion kann nicht rückgängig gemacht werden."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setDeleteDialogOpen(false)}>
                Abbrechen
              </AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={async () => {
                  if (!analysisToDelete) return;
                  
                  try {
                    const { error } = await supabase
                      .from("analyses")
                      .delete()
                      .eq("id", analysisToDelete.id);
                    
                    if (error) throw error;
                    
                    setAnalyses(prev => prev.filter(a => a.id !== analysisToDelete.id));
                    toast({
                      title: analysisToDelete.status === "pending" || analysisToDelete.status === "processing"
                        ? "Analyse abgebrochen"
                        : "Analyse entfernt",
                      description: "Die Analyse wurde erfolgreich gelöscht.",
                    });
                  } catch (err) {
                    console.error("Error deleting analysis:", err);
                    toast({
                      title: "Fehler",
                      description: "Die Analyse konnte nicht gelöscht werden.",
                      variant: "destructive",
                    });
                  } finally {
                    setDeleteDialogOpen(false);
                    setAnalysisToDelete(null);
                  }
                }}
              >
                {analysisToDelete?.status === "pending" || analysisToDelete?.status === "processing"
                  ? "Analyse abbrechen"
                  : "Analyse entfernen"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
};

export default Dashboard;
