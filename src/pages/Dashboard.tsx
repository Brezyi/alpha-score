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
import { useProductRecommendations } from "@/hooks/useProductRecommendations";
import { ProductRecommendationsCard } from "@/components/ProductRecommendationsCard";
import { PersonalizedInsights } from "@/components/dashboard/PersonalizedInsights";
import { WelcomeWidget } from "@/components/dashboard/WelcomeWidget";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { FriendComparisonWidget } from "@/components/dashboard/FriendComparisonWidget";
import { WeeklySummaryCard } from "@/components/dashboard/WeeklySummaryCard";
import { useLifestyle } from "@/hooks/useLifestyle";
import { useReferral } from "@/hooks/useReferral";
import { Capacitor } from "@capacitor/core";
import { FloatingActionButton } from "@/components/ui/floating-action-button";
import { SkeletonDashboard } from "@/components/ui/skeleton-card";
import { MobileAppLayout } from "@/components/mobile/MobileAppLayout";
import { MobileDashboardContent } from "@/components/mobile/MobileDashboardContent";
import { HelpFAB } from "@/components/help/HelpFAB";
import { NewUserWelcome } from "@/components/help/NewUserWelcome";
import { useDashboardTour } from "@/hooks/useOnboardingTour";
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
    color: "bg-blue-500/10 text-blue-500",
    premium: true,
  },
  {
    icon: Heart,
    title: "Lifestyle",
    description: "Tracke Schlaf, Wasser & Supplements",
    href: "/lifestyle",
    color: "bg-pink-500/10 text-pink-500",
    premium: true,
  },
  {
    icon: Users,
    title: "Freunde",
    description: "Verbinde dich mit anderen",
    href: "/friends",
    color: "bg-amber-500/10 text-amber-500",
    premium: false,
  },
  {
    icon: TrendingUp,
    title: "Fortschritt",
    description: "Verfolge deine Entwicklung",
    href: "/progress",
    color: "bg-violet-500/10 text-violet-500",
    premium: true,
  },
  {
    icon: DollarSign,
    title: "Affiliate",
    description: "Verdiene 20% pro Abo",
    href: "/affiliate",
    color: "bg-primary/10 text-primary",
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
  
  // Onboarding tour for new users
  const { startManualTour, hasCompletedTour, autoStartTour } = useDashboardTour();
  const [showWelcomeBanner, setShowWelcomeBanner] = useState(() => {
    try {
      return !localStorage.getItem("welcome-banner-dismissed");
    } catch {
      return true;
    }
  });
  
  // Check if results should be locked (free user without enough referrals)
  const isResultsLocked = !isPremium && !hasEnoughReferrals;
  
  // Get user's weaknesses for product recommendations - computed from analyses state
  // This needs to be before any early returns to maintain hook order
  const userWeaknesses = React.useMemo(() => {
    const completedAnalysesForWeaknesses = analyses.filter(a => a.status === "completed" && a.looks_score !== null);
    const shouldHide = isResultsLocked && completedAnalysesForWeaknesses.length > 0;
    return shouldHide ? [] : (completedAnalysesForWeaknesses[0]?.weaknesses || []);
  }, [analyses, isResultsLocked]);
  
  // Product recommendations - must be called before early returns
  const { products: recommendedProducts, loading: productsLoading, hasPersonalizedResults } = useProductRecommendations(userWeaknesses);

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
  
  // Show welcome banner for new users who haven't completed the tour
  const shouldShowWelcome = !needsOnboarding && showWelcomeBanner && !hasCompletedTour && analyses.length === 0;
  
  // Handle dismissing the welcome banner
  const handleDismissWelcome = () => {
    setShowWelcomeBanner(false);
    try {
      localStorage.setItem("welcome-banner-dismissed", "true");
    } catch {
      // Ignore localStorage errors
    }
  };

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

  // Show skeleton while loading critical data
  const isLoadingCriticalData = loading || analysesLoading || profileLoading;
  
  if (isLoadingCriticalData) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border">
          <div className="container px-4">
            <div className="flex items-center justify-between h-16">
              <ScannerLogo size="sm" labelSize="lg" />
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
              </div>
            </div>
          </div>
        </header>
        <main className="container px-4 py-6 pb-24">
          <SkeletonDashboard />
        </main>
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

      {/* Main Content */}
      <main className="container px-4 py-8">
        {/* Welcome Widget */}
        <div className="mb-8">
          <WelcomeWidget />
        </div>

        {/* Stats Overview - Showcase Style */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Main Score Card with Circle */}
          <div className="md:col-span-1 p-6 rounded-2xl glass-enhanced hover-glow opacity-0 animate-fade-in-up relative" style={{ animationDelay: "100ms", animationFillMode: "forwards" }} data-tour="score-card">
            {/* Personal Best Badge - only show if not locked */}
            {!isResultsLocked && isPersonalBest && (
              <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-medium">
                <Trophy className="w-3 h-3" />
                <span>Bestwert</span>
              </div>
            )}
            <div className="text-center">
              <div className="text-sm text-muted-foreground mb-3">Dein Looks Score</div>
              
              {/* Locked state for free users without referrals */}
              {shouldHideData ? (
                <div className="relative">
                  {/* Blurred score circle - no real data exposed */}
                  <div className="relative inline-flex items-center justify-center blur-lg opacity-50 pointer-events-none select-none">
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
                        stroke="hsl(var(--primary))"
                        strokeWidth="8"
                        fill="none"
                        strokeLinecap="round"
                        strokeDasharray={352}
                        strokeDashoffset={352 - (352 * 5) / 10}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-4xl font-black text-primary">—</span>
                      <span className="text-xs text-muted-foreground">von 10</span>
                    </div>
                  </div>
                  
                  {/* Lock overlay */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center mb-2">
                      <Lock className="w-8 h-8 text-primary" />
                    </div>
                    <p className="text-sm font-medium mb-2">Ergebnis gesperrt</p>
                    <Link to={`/analysis/${completedAnalyses[0]?.id}`}>
                      <Button size="sm" variant="hero">
                        Freischalten
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <>
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
                </>
              )}
            </div>
          </div>

          {/* Potential & Stats */}
          <div className="md:col-span-2 space-y-4">
            {/* Potential Card - only render when not locked AND has data */}
            {completedAnalyses.length > 0 && completedAnalyses[0]?.potential_score !== null && (
              <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 opacity-0 animate-fade-in-up relative overflow-hidden" style={{ animationDelay: "200ms", animationFillMode: "forwards" }}>
                {shouldHideData ? (
                  <>
                    <div className="blur-md opacity-50 pointer-events-none select-none">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-5 h-5 text-primary" />
                          <span className="font-medium">Dein Potenzial</span>
                        </div>
                        <span className="text-2xl font-bold text-primary">—</span>
                      </div>
                      <div className="mt-2 text-sm text-muted-foreground">
                        Noch <span className="text-primary font-semibold">+— Punkte</span> erreichbar
                      </div>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Lock className="w-5 h-5 text-primary" />
                    </div>
                  </>
                ) : latestPotential !== null ? (
                  <>
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
                  </>
                ) : null}
              </div>
            )}

            {/* Mini Stats Grid */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-4 rounded-xl bg-muted/50 text-center opacity-0 animate-fade-in-up hover:scale-[1.02] transition-transform" style={{ animationDelay: "250ms", animationFillMode: "forwards" }}>
                <div className="text-2xl font-bold">{completedAnalyses.length}</div>
                <div className="text-xs text-muted-foreground">Analysen</div>
              </div>
              <div className="p-4 rounded-xl bg-muted/50 text-center opacity-0 animate-fade-in-up hover:scale-[1.02] transition-transform relative overflow-hidden" style={{ animationDelay: "300ms", animationFillMode: "forwards" }}>
                {/* Animated flame background for active streaks */}
                {!streakLoading && currentStreak >= 3 && (
                  <div className="absolute inset-0 bg-gradient-to-t from-orange-500/10 via-transparent to-transparent animate-pulse" />
                )}
                <div className="relative flex items-center justify-center gap-1">
                  <span className="text-2xl font-bold">
                    {streakLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                    ) : currentStreak}
                  </span>
                  {!streakLoading && currentStreak > 0 && (
                    <div className="relative">
                      <Flame className={`w-5 h-5 text-orange-500 ${currentStreak >= 7 ? 'animate-bounce' : currentStreak >= 3 ? 'animate-pulse' : ''}`} />
                      {currentStreak >= 7 && (
                        <Flame className="absolute inset-0 w-5 h-5 text-orange-400 animate-ping opacity-50" />
                      )}
                    </div>
                  )}
                </div>
                <div className="relative text-xs text-muted-foreground">
                  {currentStreak >= 7 ? "🔥 On Fire!" : currentStreak >= 3 ? "Streak" : "Streak"}
                </div>
                {!streakLoading && !isActiveToday && currentStreak > 0 && (
                  <div className="relative text-[10px] text-orange-400 mt-1 animate-pulse font-medium">Heute aktiv werden!</div>
                )}
              </div>
              {/* Ranking - Locked for free users */}
              <div className="p-4 rounded-xl bg-muted/50 text-center opacity-0 animate-fade-in-up hover:scale-[1.02] transition-transform relative" style={{ animationDelay: "350ms", animationFillMode: "forwards" }}>
                {shouldHideData ? (
                  <>
                    <div className="blur-md opacity-50 pointer-events-none select-none">
                      <div className="text-2xl font-bold text-primary">Top —%</div>
                      <div className="text-xs text-muted-foreground">Ranking</div>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Lock className="w-4 h-4 text-primary" />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-2xl font-bold text-primary">{latestPotential ? `Top ${Math.round((1 - (latestScore || 0) / 10) * 100)}%` : "—"}</div>
                    <div className="text-xs text-muted-foreground">Ranking</div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* New Widgets Row: Motivation Quote + Next Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Motivation Quote Widget */}
          <div className="p-5 rounded-2xl glass-enhanced hover-glow opacity-0 animate-fade-in-up relative overflow-hidden" style={{ animationDelay: "400ms", animationFillMode: "forwards" }}>
            <div className="absolute top-3 right-3">
              <Quote className="w-8 h-8 text-primary/10" />
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-muted-foreground mb-1">Motivation des Tages</div>
                <p className="text-sm font-medium leading-relaxed mb-2">"{dailyQuote.text}"</p>
                <p className="text-xs text-muted-foreground">— {dailyQuote.author}</p>
              </div>
            </div>
          </div>

          {/* Next Steps Widget */}
          <div className="p-5 rounded-2xl glass-enhanced hover-glow opacity-0 animate-fade-in-up" style={{ animationDelay: "450ms", animationFillMode: "forwards" }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Target className="w-4 h-4 text-blue-500" />
                </div>
                <span className="font-semibold text-sm">Nächste Schritte</span>
              </div>
              <Link to="/plan" className="text-xs text-primary hover:underline flex items-center gap-1 group">
                Alle
                <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
            
            {tasksLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : tasks.length === 0 ? (
              <div className="text-center py-3">
                <p className="text-sm text-muted-foreground mb-2">Keine offenen Tasks</p>
                {isPremiumUser ? (
                  <Link to="/plan">
                    <Button variant="outline" size="sm" className="text-xs">
                      Plan erstellen
                    </Button>
                  </Link>
                ) : (
                  <Link to="/pricing">
                    <Button variant="outline" size="sm" className="text-xs gap-1">
                      <Lock className="w-3 h-3" />
                      Premium freischalten
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {tasks.map((task, index) => (
                  <div 
                    key={task.id} 
                    className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group"
                  >
                    <Circle className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm truncate flex-1">{task.title}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground uppercase tracking-wide">
                      {task.category}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Potential Progress Bar */}
        {potentialProgress !== null && latestPotential !== null && (
          <div className="mb-8 p-6 rounded-2xl glass-enhanced hover-glow opacity-0 animate-fade-in-up relative overflow-hidden" style={{ animationDelay: "500ms", animationFillMode: "forwards" }}>
            {shouldHideData ? (
              <>
                <div className="blur-md opacity-50 pointer-events-none select-none">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-primary" />
                      <h3 className="font-semibold">Fortschritt zu deinem Potenzial</h3>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <span className="text-foreground font-bold">—</span>
                      <span className="mx-1">/</span>
                      <span className="text-primary font-bold">—</span>
                    </div>
                  </div>
                  <Progress value={50} className="h-4" />
                  <div className="flex items-center justify-between mt-2 text-sm">
                    <span className="text-muted-foreground">
                      Noch <span className="text-primary font-semibold">+— Punkte</span> möglich
                    </span>
                  </div>
                </div>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <Lock className="w-6 h-6 text-primary mb-2" />
                  <Link to={`/analysis/${completedAnalyses[0]?.id}`}>
                    <Button size="sm" variant="hero">
                      Freischalten
                    </Button>
                  </Link>
                </div>
              </>
            ) : (
              <>
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
              </>
            )}
          </div>
        )}

        {/* Personalized Insights based on weaknesses and lifestyle - hide when locked */}
        {isPremiumUser && completedAnalyses.length > 0 && !shouldHideData && (
          <PersonalizedInsights
            weaknesses={completedAnalyses[0]?.weaknesses || []}
            priorities={completedAnalyses[0]?.detailed_results?.priorities || []}
            lifestyleData={lifestyleData}
            gender={profile?.gender}
          />
        )}


        {/* Score Chart - Clean Style */}
        {chartData.length >= 2 && (
          <div className="mb-8 p-6 rounded-2xl glass-enhanced hover-glow opacity-0 animate-scale-in relative overflow-hidden" style={{ animationDelay: "600ms", animationFillMode: "forwards" }}>
            {shouldHideData ? (
              <>
                <div className="blur-md opacity-50 pointer-events-none select-none">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-primary" />
                      Score-Entwicklung
                    </h2>
                  </div>
                  <div className="h-44 flex items-center justify-center bg-muted/20 rounded-lg">
                    <div className="text-muted-foreground">Chart gesperrt</div>
                  </div>
                </div>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <Lock className="w-6 h-6 text-primary mb-2" />
                  <Link to={`/analysis/${completedAnalyses[0]?.id}`}>
                    <Button size="sm" variant="hero">
                      Freischalten
                    </Button>
                  </Link>
                </div>
              </>
            ) : (
              <>
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
                      <defs>
                        <linearGradient id="scoreGradientFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis 
                        dataKey="date" 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                        dy={5}
                      />
                      <YAxis 
                        domain={[0, 10]} 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                        dx={-5}
                        tickFormatter={(value) => value.toFixed(0)}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: "hsl(var(--card))", 
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "12px",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                          padding: "12px"
                        }}
                        labelFormatter={(label, payload) => {
                          const data = payload?.[0]?.payload;
                          return data?.fullDate || label;
                        }}
                        formatter={(value: any, name: string, props: any) => {
                          const change = props?.payload?.change;
                          if (name === "score") {
                            const changeStr = change !== null ? ` (${change > 0 ? '+' : ''}${change.toFixed(1)})` : '';
                            return [`${Number(value).toFixed(1)}${changeStr}`, "Score"];
                          }
                          return [Number(value).toFixed(1), "Potenzial"];
                        }}
                      />
                      {/* Area fill under score line */}
                      <Area
                        type="monotone"
                        dataKey="score"
                        stroke="none"
                        fill="url(#scoreGradientFill)"
                      />
                      {/* Potential Line (dashed) */}
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
              </>
            )}
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
        <div className="mb-8" data-tour="quick-actions">
          <h2 className="text-xl font-bold mb-4 opacity-0 animate-fade-in" style={{ animationDelay: "800ms", animationFillMode: "forwards" }}>Schnellzugriff</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => {
              const isLocked = action.premium && !isPremiumUser;
              return (
                <Link 
                  key={action.title}
                  to={isLocked ? "/pricing" : action.href}
                  className="group relative p-6 rounded-2xl glass-card hover-glow hover-lift transition-all duration-300 opacity-0 animate-fade-in"
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
            
            {/* Owner-Only: Revenue Quick Access */}
            {isOwner && (
              <Link 
                to="/admin/billing"
                className="group relative p-6 rounded-2xl glass-card border-amber-500/30 hover:border-amber-500/50 transition-all duration-300 opacity-0 animate-fade-in hover:shadow-lg hover:shadow-amber-500/10"
                style={{ animationDelay: `${850 + quickActions.length * 100}ms`, animationFillMode: "forwards" }}
              >
                <div className="absolute top-3 right-3">
                  <Crown className="w-4 h-4 text-amber-500" />
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                  <BarChart3 className="w-6 h-6 text-amber-500" />
                </div>
                <h3 className="font-semibold mb-1 group-hover:text-amber-500 transition-colors">
                  Umsatz & Abos
                </h3>
                <p className="text-sm text-muted-foreground">
                  Revenue & Affiliate-Übersicht
                </p>
              </Link>
            )}
          </div>
        </div>

        {/* Gamification Section - XP, Challenges */}
        {isPremiumUser && (
          <div className="mb-8 space-y-6 opacity-0 animate-fade-in-up" style={{ animationDelay: "1100ms", animationFillMode: "forwards" }} data-tour="gamification">
            <h2 className="text-xl font-bold">Dein Fortschritt</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* XP & Level Card */}
              <XpLevelCard
                level={xp.level}
                currentXp={xp.currentXp}
                xpForNextLevel={xp.xpForNextLevel}
                progress={xp.progress}
              />
              
              {/* Daily Challenges */}
              <DailyChallengesCard
                challenges={dailyChallenges}
                loading={challengesLoading}
                onComplete={completeChallenge}
              />
              
              {/* Activity Feed */}
              <ActivityFeed />
            </div>
            
            {/* Social & Recap Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Weekly Summary */}
              <WeeklySummaryCard
                currentStreak={currentStreak}
                currentXp={xp.currentXp}
                isPremium={isPremiumUser}
              />
              
              {/* Friend Comparison */}
              <FriendComparisonWidget
                userScoreDelta={scoreDiff ? parseFloat(scoreDiff) : null}
                isPremium={isPremiumUser}
              />
            </div>
            
            {/* Product Recommendations */}
            {recommendedProducts.length > 0 && (
              <ProductRecommendationsCard
                products={recommendedProducts}
                loading={productsLoading}
                maxDisplay={4}
                title="Empfohlene Produkte für dich"
                hasPersonalizedResults={hasPersonalizedResults}
              />
            )}
          </div>
        )}

        {/* Analysis History - Show last 5 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4 opacity-0 animate-fade-in" style={{ animationDelay: "1200ms", animationFillMode: "forwards" }}>
            <h2 className="text-xl font-bold">Letzte Analysen</h2>
            {analyses.length > 5 && !shouldHideData && (
              <Link to="/progress#timeline" className="text-sm text-primary hover:underline flex items-center gap-1 group">
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
          ) : shouldHideData ? (
            <div className="relative p-8 rounded-2xl glass-card opacity-0 animate-scale-in overflow-hidden" style={{ animationDelay: "1300ms", animationFillMode: "forwards" }}>
              <div className="blur-md opacity-50 pointer-events-none select-none space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-muted/30">
                    <div className="w-14 h-14 rounded-lg bg-muted" />
                    <div className="flex-1">
                      <div className="h-4 w-32 bg-muted rounded mb-2" />
                      <div className="h-3 w-24 bg-muted/50 rounded" />
                    </div>
                  </div>
                ))}
              </div>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <Lock className="w-8 h-8 text-primary mb-3" />
                <p className="text-sm font-medium mb-3">Analysen gesperrt</p>
                <Link to={`/analysis/${completedAnalyses[0]?.id}`}>
                  <Button variant="hero">
                    Freischalten
                  </Button>
                </Link>
              </div>
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
          <div className="text-center p-6 rounded-2xl glass-enhanced hover-glow opacity-0 animate-fade-in-up" style={{ animationDelay: "1800ms", animationFillMode: "forwards" }}>
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

        {/* Floating Action Button */}
        <FloatingActionButton />
        
        {/* Help FAB */}
        <HelpFAB onStartTour={startManualTour} />
        
        {/* Welcome Banner for new users */}
        {shouldShowWelcome && (
          <NewUserWelcome 
            onStartTour={startManualTour} 
            onDismiss={handleDismissWelcome} 
          />
        )}
      </main>
    </div>
  );
};

export default Dashboard;
