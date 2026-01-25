import { Button } from "@/components/ui/button";
import { 
  Camera, 
  TrendingUp, 
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Loader2,
  Trophy,
  ChevronRight,
  Sparkles,
  Crown
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

type Analysis = {
  id: string;
  looks_score: number | null;
  potential_score: number | null;
  created_at: string;
  status: string;
  photo_urls: string[] | null;
};

// Animated number component
const AnimatedNumber = React.forwardRef<
  HTMLSpanElement,
  { value: number; decimals?: number; durationMs?: number; className?: string }
>(({ value, decimals = 1, durationMs = 1200, className }, forwardedRef) => {
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

  // Check if onboarding is needed
  const needsOnboarding = !profileLoading && profile && !profile.gender;

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
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const completedAnalyses = analyses.filter(a => a.status === "completed" && a.looks_score !== null);
  const latestScore = completedAnalyses[0]?.looks_score ?? null;
  const latestPotential = completedAnalyses[0]?.potential_score ?? null;
  const previousScore = completedAnalyses[1]?.looks_score ?? null;
  const scoreDiff = latestScore !== null && previousScore !== null 
    ? (latestScore - previousScore).toFixed(1) 
    : null;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Guten Morgen";
    if (hour < 18) return "Guten Tag";
    return "Guten Abend";
  };

  const displayName = profile?.display_name || user?.email?.split("@")[0] || "User";

  return (
    <div className={cn("px-4 py-4 space-y-5", className)}>
      {/* Onboarding Modal */}
      <ProfileOnboardingModal 
        open={needsOnboarding} 
        onComplete={handleOnboardingComplete} 
      />

      {/* Greeting Section */}
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">{getGreeting()}</p>
        <h1 className="text-xl font-bold truncate">{displayName}</h1>
        {isPremium && (
          <div className="flex items-center gap-1.5 text-xs text-primary">
            {subscriptionType === "lifetime" ? (
              <Sparkles className="w-3.5 h-3.5" />
            ) : (
              <Crown className="w-3.5 h-3.5" />
            )}
            <span className="font-medium capitalize">{subscriptionType}</span>
          </div>
        )}
      </div>

      {/* Score Card */}
      {latestScore !== null ? (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-card to-card/80 border border-border p-5">
          {/* Background Glow */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl" />
          
          <div className="relative flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Dein Score</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-primary">
                  <AnimatedNumber value={latestScore} decimals={1} />
                </span>
                <span className="text-lg text-muted-foreground">/10</span>
              </div>
              {scoreDiff && (
                <div className={cn(
                  "flex items-center gap-1 text-sm font-medium",
                  parseFloat(scoreDiff) > 0 ? "text-green-500" : 
                  parseFloat(scoreDiff) < 0 ? "text-red-500" : "text-muted-foreground"
                )}>
                  {parseFloat(scoreDiff) > 0 ? <ArrowUpRight className="w-4 h-4" /> :
                   parseFloat(scoreDiff) < 0 ? <ArrowDownRight className="w-4 h-4" /> :
                   <Minus className="w-4 h-4" />}
                  {parseFloat(scoreDiff) > 0 && "+"}{scoreDiff} zur letzten
                </div>
              )}
            </div>
            
            <div className="text-right space-y-1">
              <p className="text-xs text-muted-foreground font-medium">Potenzial</p>
              <span className="text-2xl font-bold">{latestPotential?.toFixed(1) ?? "–"}</span>
            </div>
          </div>
          
          {/* Progress Bar */}
          {latestPotential && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                <span>Fortschritt zum Potenzial</span>
                <span>{Math.round((latestScore / latestPotential) * 100)}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all duration-700"
                  style={{ width: `${Math.min((latestScore / latestPotential) * 100, 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      ) : (
        /* No Score - CTA Card */
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 p-6">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl" />
          
          <div className="relative space-y-4 text-center">
            <div className="inline-flex p-3 rounded-full bg-primary/20">
              <Camera className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-bold mb-1">Starte deine Analyse</h3>
              <p className="text-sm text-muted-foreground">
                Lade Fotos hoch und erhalte deine KI-Bewertung
              </p>
            </div>
            <Button variant="hero" size="lg" className="w-full" asChild>
              <Link to="/upload">
                <Camera className="w-5 h-5 mr-2" />
                Jetzt starten
              </Link>
            </Button>
          </div>
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card border border-border rounded-xl p-3 text-center">
          <div className="text-lg font-bold text-primary">{currentStreak}</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Streak 🔥</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-3 text-center">
          <div className="text-lg font-bold">Lv.{xp.level}</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Level</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-3 text-center">
          <div className="text-lg font-bold">{completedAnalyses.length}</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Analysen</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Schnellzugriff</h2>
        <div className="grid grid-cols-2 gap-3">
          <Link 
            to="/upload"
            className="flex items-center gap-3 bg-card border border-border rounded-xl p-4 active:scale-[0.98] transition-transform"
          >
            <div className="p-2.5 rounded-xl bg-primary/10">
              <Camera className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-sm truncate">Neue Analyse</div>
              <div className="text-xs text-muted-foreground">Fotos hochladen</div>
            </div>
          </Link>
          
          <Link 
            to="/progress"
            className="flex items-center gap-3 bg-card border border-border rounded-xl p-4 active:scale-[0.98] transition-transform"
          >
            <div className="p-2.5 rounded-xl bg-orange-500/10">
              <TrendingUp className="w-5 h-5 text-orange-500" />
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-sm truncate">Fortschritt</div>
              <div className="text-xs text-muted-foreground">Entwicklung</div>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Analyses */}
      {completedAnalyses.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Letzte Analysen</h2>
            <Link to="/progress" className="text-xs text-primary flex items-center gap-1">
              Alle <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {completedAnalyses.slice(0, 3).map((analysis) => (
              <Link
                key={analysis.id}
                to={`/analysis/${analysis.id}`}
                className="flex items-center gap-3 bg-card border border-border rounded-xl p-3 active:scale-[0.99] transition-transform"
              >
                <AnalysisThumbnail 
                  photoUrls={analysis.photo_urls} 
                  className="w-12 h-12 rounded-lg"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-primary">{analysis.looks_score?.toFixed(1)}</span>
                    <span className="text-muted-foreground">/10</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(analysis.created_at).toLocaleDateString("de-DE", {
                      day: "2-digit",
                      month: "short",
                    })}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Achievement Preview */}
      <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-500/20">
            <Trophy className="w-5 h-5 text-amber-500" />
          </div>
          <div className="flex-1">
            <div className="font-semibold text-sm">Achievements</div>
            <div className="text-xs text-muted-foreground">Schalte neue Belohnungen frei</div>
          </div>
          <Link to="/progress" className="text-xs text-amber-500 font-medium">
            Ansehen
          </Link>
        </div>
      </div>
    </div>
  );
};
