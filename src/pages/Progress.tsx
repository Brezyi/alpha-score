import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { 
  ArrowLeft, 
  TrendingUp, 
  TrendingDown,
  Minus,
  Calendar,
  Target,
  Flame,
  Crown,
  Lock,
  Camera,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";

interface Analysis {
  id: string;
  looks_score: number | null;
  created_at: string;
  status: string;
  strengths: string[] | null;
  weaknesses: string[] | null;
  photo_urls: string[];
}

export default function Progress() {
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [compareIndex, setCompareIndex] = useState(0);
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { isPremium, loading: subscriptionLoading, createCheckout } = useSubscription();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  // Fetch analyses
  useEffect(() => {
    const fetchAnalyses = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from("analyses")
          .select("id, looks_score, created_at, status, strengths, weaknesses, photo_urls")
          .eq("user_id", user.id)
          .eq("status", "completed")
          .order("created_at", { ascending: false });

        if (error) throw error;
        setAnalyses(data || []);
      } catch (error) {
        console.error("Error fetching analyses:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchAnalyses();
    }
  }, [user]);

  if (authLoading || loading || subscriptionLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Wird geladen...</p>
        </div>
      </div>
    );
  }

  // Premium gate
  if (!isPremium) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-lg mx-auto px-4 py-8">
          <Link 
            to="/dashboard" 
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Zurück zum Dashboard
          </Link>

          <div className="text-center py-12">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Lock className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Premium Feature</h1>
            <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
              Verfolge deinen Fortschritt mit Vorher/Nachher-Vergleichen und detaillierten Statistiken.
            </p>
            
            <div className="space-y-4 text-left max-w-sm mx-auto mb-8">
              {[
                "Vorher/Nachher Fotovergleich",
                "Score-Entwicklung über Zeit",
                "Detaillierte Statistiken",
                "Stärken & Schwächen Trends"
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-card">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Crown className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>

            <Button variant="hero" size="lg" onClick={() => createCheckout("premium")}>
              <Crown className="w-5 h-5" />
              Jetzt Premium werden
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Calculate statistics
  const completedAnalyses = analyses.filter(a => a.looks_score !== null);
  const latestScore = completedAnalyses[0]?.looks_score ?? null;
  const oldestScore = completedAnalyses[completedAnalyses.length - 1]?.looks_score ?? null;
  const totalImprovement = latestScore !== null && oldestScore !== null 
    ? (latestScore - oldestScore).toFixed(1) 
    : null;
  
  const averageScore = completedAnalyses.length > 0
    ? (completedAnalyses.reduce((acc, a) => acc + (a.looks_score || 0), 0) / completedAnalyses.length).toFixed(1)
    : null;

  const highestScore = completedAnalyses.length > 0
    ? Math.max(...completedAnalyses.map(a => a.looks_score || 0)).toFixed(1)
    : null;

  // Chart data (chronological order)
  const chartData = completedAnalyses
    .slice()
    .reverse()
    .map((a, index) => ({
      date: new Date(a.created_at).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" }),
      score: a.looks_score,
      index: index + 1,
    }));

  // Before/After comparison
  const canCompare = completedAnalyses.length >= 2;
  const maxCompareIndex = Math.max(0, completedAnalyses.length - 2);
  const afterAnalysis = completedAnalyses[compareIndex];
  const beforeAnalysis = completedAnalyses[compareIndex + 1];

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  };

  // Strength/Weakness trends
  const allStrengths = completedAnalyses.flatMap(a => a.strengths || []);
  const allWeaknesses = completedAnalyses.flatMap(a => a.weaknesses || []);
  
  const countOccurrences = (arr: string[]) => {
    const counts: Record<string, number> = {};
    arr.forEach(item => {
      counts[item] = (counts[item] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  };

  const topStrengths = countOccurrences(allStrengths);
  const topWeaknesses = countOccurrences(allWeaknesses);

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link 
            to="/dashboard" 
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Dashboard
          </Link>
          <div className="flex items-center gap-2 text-sm text-primary">
            <Crown className="w-4 h-4" />
            Premium
          </div>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Dein Fortschritt</h1>
          <p className="text-muted-foreground">
            Verfolge deine Entwicklung über Zeit
          </p>
        </div>

        {completedAnalyses.length === 0 ? (
          <Card className="p-8 text-center">
            <Camera className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Keine Analysen vorhanden</h2>
            <p className="text-muted-foreground mb-6">
              Starte deine erste Analyse, um deinen Fortschritt zu tracken.
            </p>
            <Button variant="hero" onClick={() => navigate("/upload")}>
              <Camera className="w-4 h-4" />
              Erste Analyse starten
            </Button>
          </Card>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <Card className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <Target className="w-4 h-4" />
                  <span className="text-xs">Aktuell</span>
                </div>
                <div className="text-2xl font-bold">{latestScore?.toFixed(1) || "-"}</div>
              </Card>
              
              <Card className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <BarChart3 className="w-4 h-4" />
                  <span className="text-xs">Durchschnitt</span>
                </div>
                <div className="text-2xl font-bold">{averageScore || "-"}</div>
              </Card>
              
              <Card className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <Flame className="w-4 h-4" />
                  <span className="text-xs">Höchster</span>
                </div>
                <div className="text-2xl font-bold text-primary">{highestScore || "-"}</div>
              </Card>
              
              <Card className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  {totalImprovement && parseFloat(totalImprovement) > 0 ? (
                    <TrendingUp className="w-4 h-4 text-green-500" />
                  ) : totalImprovement && parseFloat(totalImprovement) < 0 ? (
                    <TrendingDown className="w-4 h-4 text-red-500" />
                  ) : (
                    <Minus className="w-4 h-4" />
                  )}
                  <span className="text-xs">Gesamt</span>
                </div>
                <div className={cn(
                  "text-2xl font-bold",
                  totalImprovement && parseFloat(totalImprovement) > 0 && "text-green-500",
                  totalImprovement && parseFloat(totalImprovement) < 0 && "text-red-500"
                )}>
                  {totalImprovement ? (parseFloat(totalImprovement) > 0 ? "+" : "") + totalImprovement : "-"}
                </div>
              </Card>
            </div>

            {/* Score Chart */}
            {chartData.length >= 2 && (
              <Card className="p-6 mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">Score-Entwicklung</h2>
                  <div className="text-sm text-muted-foreground">
                    {completedAnalyses.length} Analysen
                  </div>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
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
                      <Area
                        type="monotone"
                        dataKey="score"
                        stroke="hsl(var(--primary))"
                        strokeWidth={3}
                        fill="url(#scoreGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            )}

            {/* Before/After Comparison */}
            {canCompare && (
              <Card className="p-6 mb-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold">Vorher / Nachher</h2>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setCompareIndex(Math.min(compareIndex + 1, maxCompareIndex))}
                      disabled={compareIndex >= maxCompareIndex}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground px-2">
                      {compareIndex + 1} / {maxCompareIndex + 1}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setCompareIndex(Math.max(compareIndex - 1, 0))}
                      disabled={compareIndex <= 0}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Before */}
                  <div>
                    <div className="text-sm text-muted-foreground mb-2">Vorher</div>
                    <div className="aspect-square rounded-xl overflow-hidden bg-card mb-3">
                      {beforeAnalysis?.photo_urls?.[0] ? (
                        <img 
                          src={beforeAnalysis.photo_urls[0]} 
                          alt="Vorher" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          <Camera className="w-12 h-12" />
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        {beforeAnalysis && formatDate(beforeAnalysis.created_at)}
                      </span>
                      <span className="text-xl font-bold">
                        {beforeAnalysis?.looks_score?.toFixed(1) || "-"}
                      </span>
                    </div>
                  </div>

                  {/* After */}
                  <div>
                    <div className="text-sm text-muted-foreground mb-2">Nachher</div>
                    <div className="aspect-square rounded-xl overflow-hidden bg-card mb-3">
                      {afterAnalysis?.photo_urls?.[0] ? (
                        <img 
                          src={afterAnalysis.photo_urls[0]} 
                          alt="Nachher" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          <Camera className="w-12 h-12" />
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        {afterAnalysis && formatDate(afterAnalysis.created_at)}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-bold">
                          {afterAnalysis?.looks_score?.toFixed(1) || "-"}
                        </span>
                        {beforeAnalysis?.looks_score && afterAnalysis?.looks_score && (
                          <span className={cn(
                            "text-sm font-medium px-2 py-0.5 rounded-full",
                            afterAnalysis.looks_score > beforeAnalysis.looks_score 
                              ? "bg-green-500/10 text-green-500"
                              : afterAnalysis.looks_score < beforeAnalysis.looks_score
                              ? "bg-red-500/10 text-red-500"
                              : "bg-muted text-muted-foreground"
                          )}>
                            {afterAnalysis.looks_score > beforeAnalysis.looks_score ? "+" : ""}
                            {(afterAnalysis.looks_score - beforeAnalysis.looks_score).toFixed(1)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Trends */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {/* Top Strengths */}
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  <h3 className="font-bold">Häufigste Stärken</h3>
                </div>
                {topStrengths.length > 0 ? (
                  <div className="space-y-3">
                    {topStrengths.map(([strength, count], i) => (
                      <div key={i} className="flex items-center justify-between">
                        <span className="text-sm">{strength}</span>
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                          {count}x
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Noch keine Daten vorhanden
                  </p>
                )}
              </Card>

              {/* Top Weaknesses */}
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Target className="w-5 h-5 text-orange-500" />
                  <h3 className="font-bold">Fokus-Bereiche</h3>
                </div>
                {topWeaknesses.length > 0 ? (
                  <div className="space-y-3">
                    {topWeaknesses.map(([weakness, count], i) => (
                      <div key={i} className="flex items-center justify-between">
                        <span className="text-sm">{weakness}</span>
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                          {count}x
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Noch keine Daten vorhanden
                  </p>
                )}
              </Card>
            </div>

            {/* Analysis History */}
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">Alle Analysen</h2>
              <div className="space-y-3">
                {completedAnalyses.map((analysis, index) => {
                  const prevAnalysis = completedAnalyses[index + 1];
                  const scoreDiff = prevAnalysis?.looks_score && analysis.looks_score
                    ? analysis.looks_score - prevAnalysis.looks_score
                    : null;

                  return (
                    <div 
                      key={analysis.id}
                      className="flex items-center gap-4 p-3 rounded-lg bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/analysis/${analysis.id}`)}
                    >
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        {analysis.photo_urls?.[0] ? (
                          <img 
                            src={analysis.photo_urls[0]} 
                            alt="Analyse" 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Camera className="w-5 h-5 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">
                          Score: {analysis.looks_score?.toFixed(1)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {formatDate(analysis.created_at)}
                        </div>
                      </div>
                      {scoreDiff !== null && (
                        <div className={cn(
                          "flex items-center gap-1 text-sm font-medium",
                          scoreDiff > 0 && "text-green-500",
                          scoreDiff < 0 && "text-red-500",
                          scoreDiff === 0 && "text-muted-foreground"
                        )}>
                          {scoreDiff > 0 ? (
                            <TrendingUp className="w-4 h-4" />
                          ) : scoreDiff < 0 ? (
                            <TrendingDown className="w-4 h-4" />
                          ) : (
                            <Minus className="w-4 h-4" />
                          )}
                          {scoreDiff > 0 ? "+" : ""}{scoreDiff.toFixed(1)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
