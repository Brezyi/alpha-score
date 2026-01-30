import { Button } from "@/components/ui/button";
import { 
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
  Info,
  Quote,
  CheckCircle2,
  Circle,
  Heart,
  Users,
  DollarSign,
  BarChart3
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
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart, ComposedChart } from "recharts";
import { useGlobalSettings } from "@/contexts/SystemSettingsContext";
import { ScannerLogo } from "@/components/ScannerLogo";
import { TestimonialSubmitDialog } from "@/components/TestimonialSubmitDialog";
import { Progress } from "@/components/ui/progress";
import { AnalysisThumbnail } from "@/components/AnalysisThumbnail";
import { useGamification } from "@/hooks/useGamification";
import { XpLevelCard } from "@/components/gamification/XpLevelCard";
import { DailyChallengesCard } from "@/components/gamification/DailyChallengesCard";
import { AchievementsGrid } from "@/components/gamification/AchievementsGrid";
import { useProductRecommendations } from "@/hooks/useProductRecommendations";
import { ProductRecommendationsCard } from "@/components/ProductRecommendationsCard";
import { PersonalizedInsights } from "@/components/dashboard/PersonalizedInsights";
import { SleepScoreCorrelation } from "@/components/dashboard/SleepScoreCorrelation";
import { StreakRewards } from "@/components/gamification/StreakRewards";
import { useLifestyle } from "@/hooks/useLifestyle";
import { useReferral } from "@/hooks/useReferral";
import { Capacitor } from "@capacitor/core";
import { MobileAppLayout } from "@/components/mobile/MobileAppLayout";
import { MobileDashboardContent } from "@/components/mobile/MobileDashboardContent";
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
    icon: Heart,
    title: "Lifestyle",
    description: "Tracke Schlaf, Wasser & Supplements",
    href: "/lifestyle",
    color: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
    premium: true,
  },
  {
    icon: Users,
    title: "Freunde",
    description: "Verbinde dich mit anderen",
    href: "/friends",
    color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    premium: false,
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
    icon: DollarSign,
    title: "Affiliate",
    description: "Verdiene 20% pro Abo",
    href: "/affiliate",
    color: "bg-green-500/10 text-green-600 dark:text-green-400",
    premium: false,
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

import { motivationalQuotes, getDailyQuote } from "@/data/motivationalQuotes";

type UserTask = {
  id: string;
  title: string;
  category: string;
  completed: boolean;
  priority: number;
};

const Dashboard = () => {
  const isNative = Capacitor.isNativePlatform();
  const { user, loading } = useAuth();
  const { profile, updateProfile, loading: profileLoading } = useProfile();
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [analysesLoading, setAnalysesLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [analysisToDelete, setAnalysisToDelete] = useState<Analysis | null>(null);
  const [hasAnimated, setHasAnimated] = useState(false);
  const [tasks, setTasks] = useState<UserTask[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [dailyQuote] = useState(() => getDailyQuote());
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
  const { isAdminOrOwner, isOwner, role } = useUserRole();
  const { currentStreak, longestStreak, isActiveToday, loading: streakLoading } = useStreak();
  const { settings } = useGlobalSettings();
  
  // Lifestyle data for personalized insights and sleep correlation
  const { todayEntry: lifestyleData, entries: lifestyleEntries, loading: lifestyleLoading } = useLifestyle();
  
  // Referral check for free users
  const { hasEnoughReferrals, loading: referralLoading } = useReferral();
  
  // Gamification
  const { xp, achievements, dailyChallenges, loading: gamificationLoading, challengesLoading, completeChallenge, checkAchievements } = useGamification();
  
  // Check if results should be locked (free user without enough referrals)
  const isResultsLocked = !isPremium && !hasEnoughReferrals;

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

  // Fetch user tasks for "Next Steps" widget
  useEffect(() => {
    const fetchTasks = async () => {
      if (!user) {
        setTasksLoading(false);
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from("user_tasks")
          .select("id, title, category, completed, priority")
          .eq("user_id", user.id)
          .eq("completed", false)
          .order("priority", { ascending: false })
          .limit(3);

        if (error) throw error;
        setTasks(data || []);
      } catch (error: any) {
        console.error("Error fetching tasks:", error);
      } finally {
        setTasksLoading(false);
      }
    };

    if (user) {
      fetchTasks();
    }
  }, [user]);

  // Check achievements when data is loaded
  useEffect(() => {
    const checkUserAchievements = async () => {
      if (!user || analysesLoading || gamificationLoading || achievements.length === 0) return;
      
      const completedAnalysesForCheck = analyses.filter(a => a.status === "completed" && a.looks_score !== null);
      const scores = completedAnalysesForCheck.map(a => a.looks_score).filter((s): s is number => s !== null);
      const highestScoreForCheck = scores.length > 0 ? Math.max(...scores) : 0;
      const lowestScoreForCheck = scores.length > 0 ? Math.min(...scores) : 0;
      const latestScoreForCheck = completedAnalysesForCheck[0]?.looks_score ?? 0;
      
      // Fetch completed tasks count
      const { count: tasksCount } = await supabase
        .from("user_tasks")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("completed", true);
      
      await checkAchievements({
        analysesCount: completedAnalysesForCheck.length,
        currentStreak: currentStreak,
        highestScore: highestScoreForCheck,
        lowestScore: lowestScoreForCheck,
        completedTasksCount: tasksCount || 0,
        level: xp.level,
        latestScore: latestScoreForCheck,
      });
    };
    
    checkUserAchievements();
  }, [user, analysesLoading, gamificationLoading, achievements.length, analyses, currentStreak, xp.level, checkAchievements]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // On native platforms, use the mobile-optimized layout
  if (isNative) {
    return (
      <MobileAppLayout showLogo showSettings showNotifications>
        <MobileDashboardContent />
      </MobileAppLayout>
    );
  }

  const isPremiumUser = isPremium;

  // Calculate stats - but ONLY if not locked (prevent JS manipulation)
  const completedAnalyses = analyses.filter(a => a.status === "completed" && a.looks_score !== null);
  
  // Security: Don't expose real values when locked - use null/placeholder
  const shouldHideData = isResultsLocked && completedAnalyses.length > 0;
  
  const latestScore = shouldHideData ? null : (completedAnalyses[0]?.looks_score ?? null);
  const latestPotential = shouldHideData ? null : (completedAnalyses[0]?.potential_score ?? null);
  const previousScore = shouldHideData ? null : (completedAnalyses[1]?.looks_score ?? null);
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
  const allScores = shouldHideData ? [] : completedAnalyses.map(a => a.looks_score).filter((s): s is number => s !== null);
  const highestScore = allScores.length > 0 ? Math.max(...allScores) : null;
  const isPersonalBest = latestScore !== null && highestScore !== null && latestScore >= highestScore && completedAnalyses.length > 1;

  // Get user's weaknesses for product recommendations (hide if locked)
  const userWeaknesses = shouldHideData ? [] : (completedAnalyses[0]?.weaknesses || []);
  const { products: recommendedProducts, loading: productsLoading, hasPersonalizedResults } = useProductRecommendations(userWeaknesses);

  // Chart data (last 10 analyses, reversed for chronological order) with potential and change
  // Security: Empty chart data when locked
  const chartDataRaw = shouldHideData ? [] : completedAnalyses.slice(0, 10).reverse();
  const chartData = chartDataRaw.map((a, index) => {
    const prevScore = index > 0 ? chartDataRaw[index - 1].looks_score : null;
    const change = a.looks_score !== null && prevScore !== null ? a.looks_score - prevScore : null;
    return {
      date: new Date(a.created_at).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" }),
      fullDate: new Date(a.created_at).toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" }),
      score: a.looks_score,
      potential: a.potential_score,
      change,
    };
  });

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
            <Link to="/dashboard">
              <ScannerLogo size="sm" labelSize="lg" />
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

      {/* Main Content - Cleaner Layout */}
      <main className="container px-4 py-6 max-w-6xl mx-auto">
        
        {/* Hero Section - Welcome + Score */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {/* Left: Welcome */}
            <div className="animate-fade-in">
              <h1 className="text-2xl md:text-3xl font-bold mb-1">
                Hey, {profile?.display_name?.split(" ")[0] || user?.user_metadata?.full_name?.split(" ")[0] || "Champ"} 👋
              </h1>
              <p className="text-muted-foreground text-sm">
                Bereit, heute besser zu werden?
              </p>
            </div>
            
            {/* Right: Quick Stats Row */}
            <div className="flex items-center gap-3">
              {/* Streak */}
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card border border-border">
                <Flame className={`w-5 h-5 ${currentStreak > 0 ? 'text-orange-500' : 'text-muted-foreground'}`} />
                <div>
                  <div className="text-lg font-bold leading-none">{currentStreak}</div>
                  <div className="text-[10px] text-muted-foreground uppercase">Streak</div>
                </div>
              </div>
              
              {/* Analyses Count */}
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card border border-border">
                <Camera className="w-5 h-5 text-primary" />
                <div>
                  <div className="text-lg font-bold leading-none">{completedAnalyses.length}</div>
                  <div className="text-[10px] text-muted-foreground uppercase">Scans</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column - Score & Progress */}
          <div className="lg:col-span-4 space-y-4">
            
            {/* Score Card - Prominent */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-card via-card to-primary/5 border border-border relative overflow-hidden animate-fade-in" style={{ animationDelay: "100ms" }}>
              {/* Glow Effect */}
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/10 rounded-full blur-3xl" />
              
              {!isResultsLocked && isPersonalBest && (
                <div className="absolute top-4 right-4 flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-500 text-xs font-medium">
                  <Trophy className="w-3 h-3" />
                  Best
                </div>
              )}
              
              <div className="relative">
                <div className="text-sm text-muted-foreground mb-4 text-center">Dein Looks Score</div>
                
                {shouldHideData ? (
                  <div className="relative flex flex-col items-center">
                    <div className="w-32 h-32 rounded-full bg-muted/30 flex items-center justify-center border-4 border-muted/50">
                      <Lock className="w-10 h-10 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground mt-4 mb-2">Ergebnis gesperrt</p>
                    <Link to={`/analysis/${completedAnalyses[0]?.id}`}>
                      <Button size="sm" variant="hero">Freischalten</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    {/* SVG Score Ring */}
                    <div className="relative">
                      <svg className="w-36 h-36 transform -rotate-90" viewBox="0 0 144 144">
                        <circle cx="72" cy="72" r="60" stroke="hsl(var(--muted)/0.3)" strokeWidth="10" fill="none" />
                        <circle 
                          cx="72" cy="72" r="60" 
                          stroke="url(#dashboardGradient)" 
                          strokeWidth="10" 
                          fill="none" 
                          strokeLinecap="round"
                          strokeDasharray={377}
                          strokeDashoffset={377 - (377 * (latestScore || 0)) / 10}
                          className="transition-all duration-1000 ease-out"
                        />
                        <defs>
                          <linearGradient id="dashboardGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="hsl(var(--primary))" />
                            <stop offset="100%" stopColor="hsl(var(--primary)/0.6)" />
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
                    
                    {/* Score Change */}
                    {scoreDiff !== null && (
                      <div className={`mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${
                        parseFloat(scoreDiff) > 0 ? "bg-emerald-500/10 text-emerald-500" : 
                        parseFloat(scoreDiff) < 0 ? "bg-red-500/10 text-red-500" : "bg-muted text-muted-foreground"
                      }`}>
                        {parseFloat(scoreDiff) > 0 ? <ArrowUpRight className="w-4 h-4" /> :
                         parseFloat(scoreDiff) < 0 ? <ArrowDownRight className="w-4 h-4" /> :
                         <Minus className="w-4 h-4" />}
                        {parseFloat(scoreDiff) > 0 && "+"}{scoreDiff}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            {/* Potential Card */}
            {completedAnalyses.length > 0 && latestPotential && !shouldHideData && (
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 animate-fade-in" style={{ animationDelay: "200ms" }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">Potenzial</span>
                  </div>
                  <span className="text-xl font-bold text-primary">{latestPotential.toFixed(1)}</span>
                </div>
                {pointsToGo && (
                  <div className="mt-2 flex items-center gap-2">
                    <Progress value={potentialProgress || 0} className="flex-1 h-2" />
                    <span className="text-xs text-muted-foreground whitespace-nowrap">+{pointsToGo} möglich</span>
                  </div>
                )}
              </div>
            )}
            
            {/* Daily Quote - Compact */}
            <div className="p-4 rounded-xl bg-card border border-border animate-fade-in" style={{ animationDelay: "300ms" }}>
              <div className="flex items-start gap-3">
                <Quote className="w-5 h-5 text-primary/50 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm leading-relaxed text-muted-foreground">"{dailyQuote.text}"</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">— {dailyQuote.author}</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right Column - Actions & Content */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Quick Actions - Horizontal Pills */}
            <div className="animate-fade-in" style={{ animationDelay: "150ms" }}>
              <div className="flex flex-wrap gap-2">
                {quickActions.slice(0, 4).map((action) => {
                  const isLocked = action.premium && !isPremiumUser;
                  return (
                    <Link 
                      key={action.title}
                      to={isLocked ? "/pricing" : action.href}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all hover:scale-[1.02] active:scale-[0.98] ${
                        isLocked ? 'bg-muted/50 border-border' : 'bg-card border-border hover:border-primary/30 hover:bg-primary/5'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg ${action.color} flex items-center justify-center`}>
                        <action.icon className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-medium">{action.title}</span>
                      {isLocked && <Lock className="w-3 h-3 text-muted-foreground ml-1" />}
                    </Link>
                  );
                })}
                
                {/* Owner Revenue Link */}
                {isOwner && (
                  <Link 
                    to="/admin/billing"
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 transition-all"
                  >
                    <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center">
                      <BarChart3 className="w-4 h-4 text-amber-500" />
                    </div>
                    <span className="text-sm font-medium text-amber-600 dark:text-amber-400">Umsatz</span>
                  </Link>
                )}
              </div>
            </div>
            
            {/* Score Chart - Clean */}
            {chartData.length >= 2 && !shouldHideData && (
              <div className="p-5 rounded-2xl bg-card border border-border animate-fade-in" style={{ animationDelay: "250ms" }}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold">Score-Entwicklung</h3>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-0.5 bg-primary rounded-full" />
                      <span className="text-muted-foreground">Score</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-0.5 bg-primary/40 rounded-full" style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 2px, currentColor 2px, currentColor 4px)' }} />
                      <span className="text-muted-foreground">Potenzial</span>
                    </div>
                  </div>
                </div>
                
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="scoreAreaGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis 
                        dataKey="date" 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                        dy={5}
                      />
                      <YAxis 
                        domain={[0, 10]} 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                        tickFormatter={(v) => v.toFixed(0)}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: "hsl(var(--card))", 
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "10px",
                          fontSize: "12px",
                          padding: "8px 12px"
                        }}
                        labelFormatter={(_, payload) => payload?.[0]?.payload?.fullDate || ''}
                        formatter={(value: any, name: string) => [
                          Number(value).toFixed(1), 
                          name === "score" ? "Score" : "Potenzial"
                        ]}
                      />
                      <Area type="monotone" dataKey="score" stroke="none" fill="url(#scoreAreaGradient)" />
                      <Line type="monotone" dataKey="potential" stroke="hsl(var(--primary)/0.4)" strokeWidth={2} strokeDasharray="4 4" dot={false} />
                      <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ fill: "hsl(var(--primary))", r: 4, strokeWidth: 0 }} activeDot={{ r: 6 }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
            
            {/* Next Steps + Recent Analyses Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Next Steps */}
              <div className="p-4 rounded-xl bg-card border border-border animate-fade-in" style={{ animationDelay: "300ms" }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-blue-500" />
                    <span className="font-medium text-sm">Nächste Schritte</span>
                  </div>
                  <Link to="/plan" className="text-xs text-primary hover:underline">Alle →</Link>
                </div>
                
                {tasksLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div>
                ) : tasks.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground mb-2">Keine offenen Tasks</p>
                    <Link to={isPremiumUser ? "/plan" : "/pricing"}>
                      <Button variant="outline" size="sm" className="text-xs gap-1">
                        {!isPremiumUser && <Lock className="w-3 h-3" />}
                        {isPremiumUser ? "Plan erstellen" : "Premium"}
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {tasks.map((task) => (
                      <div key={task.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                        <Circle className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                        <span className="text-sm truncate flex-1">{task.title}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Recent Analyses Preview */}
              <div className="p-4 rounded-xl bg-card border border-border animate-fade-in" style={{ animationDelay: "350ms" }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Camera className="w-4 h-4 text-primary" />
                    <span className="font-medium text-sm">Letzte Analysen</span>
                  </div>
                  {completedAnalyses.length > 0 && (
                    <Link to="/progress#analyses" className="text-xs text-primary hover:underline">Alle →</Link>
                  )}
                </div>
                
                {analysesLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div>
                ) : completedAnalyses.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground mb-2">Noch keine Analysen</p>
                    <Link to="/upload">
                      <Button variant="hero" size="sm" className="text-xs gap-1">
                        <Camera className="w-3 h-3" />
                        Erste Analyse
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {completedAnalyses.slice(0, 4).map((analysis) => (
                      <Link 
                        key={analysis.id} 
                        to={`/analysis/${analysis.id}`}
                        className="flex-shrink-0 group"
                      >
                        <div className="relative">
                          <AnalysisThumbnail photoUrls={analysis.photo_urls} className="w-16 h-16 rounded-lg group-hover:ring-2 ring-primary/50 transition-all" />
                          <div className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded bg-primary text-[10px] font-bold text-primary-foreground">
                            {analysis.looks_score?.toFixed(1)}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
          </div>
          
          {/* Gamification Section for Premium */}
          {isPremiumUser && !shouldHideData && (
            <div className="space-y-4 animate-fade-in" style={{ animationDelay: "400ms" }}>
              
              {/* XP & Level + Daily Challenges */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <XpLevelCard
                  level={xp.level}
                  currentXp={xp.currentXp}
                  xpForNextLevel={xp.xpForNextLevel}
                  progress={xp.progress}
                />
                <DailyChallengesCard
                  challenges={dailyChallenges}
                  loading={challengesLoading}
                  onComplete={completeChallenge}
                />
              </div>
              
              {/* Achievements - Compact */}
              {achievements.length > 0 && (
                <div className="p-4 rounded-xl bg-card border border-border">
                  <AchievementsGrid achievements={achievements} maxDisplay={8} />
                </div>
              )}
              
              {/* Streak Rewards */}
              <StreakRewards 
                currentStreak={currentStreak} 
                longestStreak={longestStreak} 
                compact 
              />
              
              {/* Personalized Insights */}
              {completedAnalyses.length > 0 && (
                <PersonalizedInsights
                  weaknesses={completedAnalyses[0]?.weaknesses || []}
                  priorities={completedAnalyses[0]?.detailed_results?.priorities || []}
                  lifestyleData={lifestyleData}
                  gender={profile?.gender}
                />
              )}
              
              {/* Sleep Correlation */}
              <SleepScoreCorrelation 
                lifestyleEntries={lifestyleEntries.map(e => ({
                  entry_date: e.entry_date,
                  sleep_hours: e.sleep_hours,
                  sleep_quality: null
                }))}
                analyses={completedAnalyses.map(a => ({
                  created_at: a.created_at,
                  looks_score: a.looks_score
                }))}
              />
              
              {/* Product Recommendations */}
              {recommendedProducts.length > 0 && (
                <ProductRecommendationsCard
                  products={recommendedProducts}
                  loading={productsLoading}
                  maxDisplay={3}
                  title="Empfohlene Produkte"
                  hasPersonalizedResults={hasPersonalizedResults}
                />
              )}
            </div>
          )}
          
          {/* Premium CTA for Free Users */}
          {!isPremiumUser && (
            <div className="p-5 rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 animate-fade-in" style={{ animationDelay: "400ms" }}>
              <div className="flex items-center gap-3 mb-3">
                <Crown className="w-5 h-5 text-primary" />
                <span className="font-semibold">Premium freischalten</span>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Detaillierte Analysen, personalisierter Plan und AI Coach.
              </p>
              <Link to="/pricing">
                <Button variant="hero" size="sm" className="gap-2">
                  Premium werden
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          )}
          
        </div>{/* End Right Column */}
        
      </div>{/* End Main Grid */}
      
      {/* New Analysis CTA - Bottom */}
      {completedAnalyses.length > 0 && (
        <div className="mt-8 text-center p-6 rounded-2xl bg-card border border-border animate-fade-in" style={{ animationDelay: "500ms" }}>
          <h3 className="font-semibold mb-2">Neue Analyse starten</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Tracke deinen Fortschritt mit regelmäßigen Analysen.
          </p>
          <Link to="/upload">
            <Button variant="hero" className="gap-2">
              <Camera className="w-4 h-4" />
              Foto analysieren
            </Button>
          </Link>
        </div>
      )}
      
      {/* Delete Dialog */}
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
                ? "Diese laufende Analyse wird abgebrochen und gelöscht."
                : "Diese fehlgeschlagene Analyse wird aus deiner Historie entfernt."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
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
                    title: "Analyse entfernt",
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
              Entfernen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
    </main>
  </div>
);
};

export default Dashboard;
