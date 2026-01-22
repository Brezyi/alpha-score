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
  HelpCircle
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/hooks/useSubscription";
import { useUserRole } from "@/hooks/useUserRole";
import { useStreak } from "@/hooks/useStreak";
import { useProfile } from "@/hooks/useProfile";
import { PushNotificationToggle } from "@/components/PushNotificationToggle";
import { ProfileMenu } from "@/components/ProfileMenu";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

type Analysis = {
  id: string;
  looks_score: number | null;
  created_at: string;
  status: string;
  strengths: string[] | null;
  weaknesses: string[] | null;
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
    color: "bg-blue-500/10 text-blue-400",
    premium: true,
  },
  {
    icon: TrendingUp,
    title: "Fortschritt",
    description: "Verfolge deine Entwicklung",
    href: "/progress",
    color: "bg-orange-500/10 text-orange-400",
    premium: true,
  },
  {
    icon: MessageSquare,
    title: "AI Coach",
    description: "Stelle Fragen an deinen Coach",
    href: "/coach",
    color: "bg-purple-500/10 text-purple-400",
    premium: true,
  },
  {
    icon: HelpCircle,
    title: "Support",
    description: "Hilfe & Problemlösung",
    href: "/support",
    color: "bg-muted text-muted-foreground",
    premium: false,
  },
];

const Dashboard = () => {
  const { user, loading } = useAuth();
  const { profile } = useProfile();
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [analysesLoading, setAnalysesLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isPremium } = useSubscription();
  const { isAdminOrOwner, role } = useUserRole();
  const { currentStreak, longestStreak, isActiveToday, loading: streakLoading } = useStreak();

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
          .select("id, looks_score, created_at, status, strengths, weaknesses")
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
  const previousScore = completedAnalyses[1]?.looks_score ?? null;
  const scoreDiff = latestScore !== null && previousScore !== null 
    ? (latestScore - previousScore).toFixed(1) 
    : null;

  // Chart data (last 10 analyses, reversed for chronological order)
  const chartData = completedAnalyses
    .slice(0, 10)
    .reverse()
    .map((a) => ({
      date: new Date(a.created_at).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" }),
      score: a.looks_score,
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
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border">
        <div className="container px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
                <Zap className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">FaceRank</span>
            </Link>

            <div className="flex items-center gap-4">
              {isAdminOrOwner && (
                <Link to="/admin">
                  <Button variant="outline" size="sm" className="hidden sm:flex gap-2">
                    <Shield className="w-4 h-4" />
                    Admin
                  </Button>
                </Link>
              )}
              {!isPremiumUser && (
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Hey, {profile?.display_name?.split(" ")[0] || user?.user_metadata?.full_name?.split(" ")[0] || "Champ"} 👋
          </h1>
          <p className="text-muted-foreground">
            Bereit, heute besser zu werden?
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="p-4 rounded-2xl glass-card">
            <div className="text-sm text-muted-foreground mb-1">Aktueller Score</div>
            <div className="flex items-end gap-2">
              <div className="text-3xl font-bold text-gradient">
                {latestScore !== null ? latestScore.toFixed(1) : "—"}
              </div>
              {scoreDiff !== null && (
                <div className={`flex items-center text-sm mb-1 ${
                  parseFloat(scoreDiff) > 0 ? "text-green-500" : 
                  parseFloat(scoreDiff) < 0 ? "text-red-500" : "text-muted-foreground"
                }`}>
                  {parseFloat(scoreDiff) > 0 ? (
                    <ArrowUpRight className="w-4 h-4" />
                  ) : parseFloat(scoreDiff) < 0 ? (
                    <ArrowDownRight className="w-4 h-4" />
                  ) : (
                    <Minus className="w-4 h-4" />
                  )}
                  {Math.abs(parseFloat(scoreDiff))}
                </div>
              )}
            </div>
          </div>
          <div className="p-4 rounded-2xl glass-card">
            <div className="text-sm text-muted-foreground mb-1">Analysen</div>
            <div className="text-3xl font-bold">{completedAnalyses.length}</div>
          </div>
          <div className="p-4 rounded-2xl glass-card">
            <div className="text-sm text-muted-foreground mb-1">Streak</div>
            <div className="text-3xl font-bold flex items-center gap-2">
              {streakLoading ? (
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              ) : (
                <>
                  {currentStreak}
                  <Flame className={`w-6 h-6 ${currentStreak > 0 ? "text-orange-500" : "text-muted-foreground"}`} />
                </>
              )}
            </div>
            {!streakLoading && longestStreak > 0 && (
              <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                <Trophy className="w-3 h-3" />
                Best: {longestStreak}
              </div>
            )}
            {!streakLoading && !isActiveToday && currentStreak > 0 && (
              <div className="text-xs text-orange-400 mt-1">
                Heute noch aktiv werden!
              </div>
            )}
          </div>
          <div className="p-4 rounded-2xl glass-card">
            <div className="text-sm text-muted-foreground mb-1">Tasks heute</div>
            <div className="text-3xl font-bold">0/5</div>
          </div>
        </div>

        {/* Score Chart */}
        {chartData.length >= 2 && (
          <div className="mb-8 p-6 rounded-2xl glass-card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Score-Verlauf</h2>
              <div className="text-sm text-muted-foreground">
                Letzte {chartData.length} Analysen
              </div>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <XAxis 
                    dataKey="date" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    domain={[0, 10]}
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => value.toFixed(1)}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                    formatter={(value: number) => [value.toFixed(1), "Score"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="hsl(var(--primary))"
                    strokeWidth={3}
                    dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, fill: "hsl(var(--primary))" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Premium Banner (for free users) */}
        {!isPremiumUser && (
          <div className="relative overflow-hidden rounded-2xl p-6 mb-8 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent border border-primary/30">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <Crown className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium text-primary">Premium Feature</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Schalte alle Features frei</h3>
              <p className="text-muted-foreground mb-4 max-w-md">
                Erhalte detaillierte Analysen, deinen personalisierten Plan und Zugang zum AI Coach.
              </p>
              <Link to="/pricing">
                <Button variant="hero">
                  Premium werden
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          </div>
        )}

        {/* Push Notification Toggle */}
        <div className="mb-8">
          <PushNotificationToggle />
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">Schnellzugriff</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action) => {
              const isLocked = action.premium && !isPremiumUser;
              return (
                <Link 
                  key={action.title}
                  to={isLocked ? "/pricing" : action.href}
                  className="group relative p-6 rounded-2xl glass-card hover:border-primary/50 transition-all duration-300"
                >
                  {isLocked && (
                    <div className="absolute top-3 right-3">
                      <Lock className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}
                  <div className={`w-12 h-12 rounded-xl ${action.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
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

        {/* Analysis History */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Analyse-Historie</h2>
            {analyses.length > 0 && (
              <span className="text-sm text-muted-foreground">
                {analyses.length} {analyses.length === 1 ? "Analyse" : "Analysen"}
              </span>
            )}
          </div>

          {analysesLoading ? (
            <div className="flex items-center justify-center p-12 rounded-2xl glass-card">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : analyses.length === 0 ? (
            <div className="text-center p-8 rounded-2xl glass-card">
              <Camera className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Noch keine Analysen</h3>
              <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                Lade ein Foto hoch und erhalte in wenigen Sekunden deinen Looks Score.
              </p>
              <Link to="/upload">
                <Button variant="hero" size="lg">
                  <Camera className="w-5 h-5" />
                  Erste Analyse starten
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {analyses.map((analysis) => (
                <Link
                  key={analysis.id}
                  to={`/analysis/${analysis.id}`}
                  className="flex items-center gap-4 p-4 rounded-xl glass-card hover:border-primary/50 transition-all group"
                >
                  {/* Score Circle */}
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 ${
                    analysis.status === "completed" && analysis.looks_score !== null
                      ? "bg-gradient-to-br from-primary/20 to-primary/5 border-2 border-primary/30"
                      : "bg-muted"
                  }`}>
                    {analysis.status === "completed" && analysis.looks_score !== null ? (
                      <span className="text-lg font-bold text-gradient">
                        {analysis.looks_score.toFixed(1)}
                      </span>
                    ) : analysis.status === "processing" ? (
                      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">
                        {analysis.status === "completed" ? "Analyse abgeschlossen" : 
                         analysis.status === "processing" ? "Wird analysiert..." : 
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
              ))}
            </div>
          )}
        </div>

        {/* CTA for more analyses */}
        {analyses.length > 0 && (
          <div className="text-center p-6 rounded-2xl glass-card">
            <h3 className="text-lg font-bold mb-2">Neue Analyse starten</h3>
            <p className="text-muted-foreground mb-4 text-sm">
              Tracke deinen Fortschritt mit regelmäßigen Analysen.
            </p>
            <Link to="/upload">
              <Button variant="hero">
                <Camera className="w-5 h-5" />
                Foto analysieren
              </Button>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
