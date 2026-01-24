import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { generateSignedUrls } from "@/hooks/useSignedImageUrl";
import { ProgressImage } from "@/components/ProgressImage";
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
  Zap,
  Loader2,
  RefreshCw,
  AlertCircle,
  Eye
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { useOptimizedAnimations } from "@/hooks/useReducedMotion";

interface Analysis {
  id: string;
  looks_score: number | null;
  potential_score: number | null;
  created_at: string;
  status: string;
  strengths: string[] | null;
  weaknesses: string[] | null;
  priorities: string[] | null;
  photo_urls: string[];
  signedPhotoUrls?: (string | null)[];
}

export default function Progress() {
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [compareIndex, setCompareIndex] = useState(0);
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { isPremium, loading: subscriptionLoading, createCheckout } = useSubscription();
  const { shouldReduce, containerVariants, itemVariants, cardVariants, hoverScale, tapScale, hoverScaleSmall } = useOptimizedAnimations();
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  // Fetch analyses with signed URLs
  const fetchAnalyses = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from("analyses")
        .select("id, looks_score, potential_score, created_at, status, strengths, weaknesses, priorities, photo_urls")
        .eq("user_id", user.id)
        .eq("status", "completed")
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;

      if (!data || data.length === 0) {
        setAnalyses([]);
        return;
      }

      // Generate signed URLs for all photos
      const analysesWithSignedUrls = await Promise.all(
        data.map(async (analysis) => {
          if (!analysis.photo_urls || analysis.photo_urls.length === 0) {
            return { ...analysis, signedPhotoUrls: [] };
          }
          
          const signedUrls = await generateSignedUrls(analysis.photo_urls);
          return { ...analysis, signedPhotoUrls: signedUrls };
        })
      );

      setAnalyses(analysesWithSignedUrls);
    } catch (err) {
      console.error("Error fetching analyses:", err);
      setError("Analysen konnten nicht geladen werden.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchAnalyses();
    }
  }, [user, fetchAnalyses]);

  if (authLoading || subscriptionLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Wird geladen...</p>
        </motion.div>
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

          <motion.div 
            className="text-center py-12"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div 
              className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            >
              <Lock className="w-10 h-10 text-primary" />
            </motion.div>
            <h1 className="text-2xl font-bold mb-2">Premium Feature</h1>
            <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
              Verfolge deinen Fortschritt mit Vorher/Nachher-Vergleichen und detaillierten Statistiken.
            </p>
            
            <motion.div 
              className="space-y-4 text-left max-w-sm mx-auto mb-8"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {[
                "Vorher/Nachher Fotovergleich",
                "Score-Entwicklung über Zeit",
                "Detaillierte Statistiken",
                "Stärken & Schwächen Trends"
              ].map((feature, i) => (
                <motion.div 
                  key={i} 
                  className="flex items-center gap-3 p-3 rounded-lg bg-card"
                  variants={itemVariants}
                  whileHover={{ scale: 1.02, x: 5 }}
                >
                  <motion.div 
                    className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center"
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.5 }}
                  >
                    <Crown className="w-4 h-4 text-primary" />
                  </motion.div>
                  <span className="text-sm">{feature}</span>
                </motion.div>
              ))}
            </motion.div>

            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button variant="hero" size="lg" onClick={() => createCheckout("premium")}>
                <Crown className="w-5 h-5" />
                Jetzt Premium werden
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </div>
    );
  }

  // Calculate statistics
  const completedAnalyses = analyses.filter(a => a.looks_score !== null);
  const latestScore = completedAnalyses[0]?.looks_score ?? null;
  const latestPotential = completedAnalyses[0]?.potential_score ?? null;
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

  // Potential progress calculation
  const potentialGap = latestScore !== null && latestPotential !== null 
    ? (latestPotential - latestScore).toFixed(1)
    : null;

  // Chart data (chronological order)
  const chartData = completedAnalyses
    .slice()
    .reverse()
    .map((a, index) => ({
      date: format(new Date(a.created_at), "dd.MM", { locale: de }),
      score: a.looks_score,
      potential: a.potential_score,
      index: index + 1,
    }));

  // Before/After comparison
  const canCompare = completedAnalyses.length >= 2;
  const maxCompareIndex = Math.max(0, completedAnalyses.length - 2);
  const afterAnalysis = completedAnalyses[compareIndex];
  const beforeAnalysis = completedAnalyses[compareIndex + 1];

  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), "dd. MMM yyyy", { locale: de });
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
        <motion.div 
          className="flex items-center justify-between mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Link 
            to="/dashboard" 
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchAnalyses}
                disabled={loading}
              >
                <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
                Aktualisieren
              </Button>
            </motion.div>
            <motion.div 
              className="flex items-center gap-2 text-sm text-primary"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Crown className="w-4 h-4" />
              Premium
            </motion.div>
          </div>
        </motion.div>

        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h1 className="text-3xl font-bold mb-2">Dein Fortschritt</h1>
          <p className="text-muted-foreground">
            Verfolge deine Entwicklung über Zeit ({completedAnalyses.length} Analysen)
          </p>
        </motion.div>

        {/* Error State */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Card className="p-6 mb-6 border-destructive/50 bg-destructive/5">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-destructive" />
                  <div>
                    <p className="font-medium text-destructive">{error}</p>
                    <Button 
                      variant="link" 
                      className="p-0 h-auto text-sm" 
                      onClick={fetchAnalyses}
                    >
                      Erneut versuchen
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading State */}
        {loading ? (
          <motion.div 
            className="text-center py-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <Loader2 className="w-12 h-12 text-primary mx-auto mb-4" />
            </motion.div>
            <p className="text-muted-foreground">Lade Analysen...</p>
          </motion.div>
        ) : completedAnalyses.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="p-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
              >
                <Camera className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              </motion.div>
              <h2 className="text-xl font-semibold mb-2">Keine Analysen vorhanden</h2>
              <p className="text-muted-foreground mb-6">
                Starte deine erste Analyse, um deinen Fortschritt zu tracken.
              </p>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button variant="hero" onClick={() => navigate("/upload")}>
                  <Camera className="w-4 h-4" />
                  Erste Analyse starten
                </Button>
              </motion.div>
            </Card>
          </motion.div>
        ) : (
          <>
            {/* Stats Cards */}
            <motion.div 
              className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <motion.div variants={cardVariants} whileHover={hoverScale}>
                <Card className="p-4 h-full">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <Target className="w-4 h-4" />
                    <span className="text-xs">Aktuell</span>
                  </div>
                  <div className="text-2xl font-bold">
                    {latestScore?.toFixed(1) || "-"}
                  </div>
                </Card>
              </motion.div>
              
              <motion.div variants={cardVariants} whileHover={hoverScale}>
                <Card className="p-4 h-full border-primary/30 bg-primary/5">
                  <div className="flex items-center gap-2 text-primary mb-2">
                    <Zap className="w-4 h-4" />
                    <span className="text-xs">Potenzial</span>
                  </div>
                  <div className="text-2xl font-bold text-primary">
                    {latestPotential?.toFixed(1) || "-"}
                  </div>
                  {potentialGap && (
                    <span className="text-xs text-muted-foreground">+{potentialGap} möglich</span>
                  )}
                </Card>
              </motion.div>
              
              <motion.div variants={cardVariants} whileHover={hoverScale}>
                <Card className="p-4 h-full">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <BarChart3 className="w-4 h-4" />
                    <span className="text-xs">Durchschnitt</span>
                  </div>
                  <div className="text-2xl font-bold">
                    {averageScore || "-"}
                  </div>
                </Card>
              </motion.div>
              
              <motion.div variants={cardVariants} whileHover={hoverScale}>
                <Card className="p-4 h-full">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <Flame className="w-4 h-4" />
                    <span className="text-xs">Höchster</span>
                  </div>
                  <div className="text-2xl font-bold text-primary">
                    {highestScore || "-"}
                  </div>
                </Card>
              </motion.div>
              
              <motion.div variants={cardVariants} whileHover={hoverScale}>
                <Card className="p-4 h-full">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    {totalImprovement && parseFloat(totalImprovement) > 0 ? (
                      <TrendingUp className="w-4 h-4 text-primary" />
                    ) : totalImprovement && parseFloat(totalImprovement) < 0 ? (
                      <TrendingDown className="w-4 h-4 text-destructive" />
                    ) : (
                      <Minus className="w-4 h-4" />
                    )}
                    <span className="text-xs">Gesamt</span>
                  </div>
                  <div className={cn(
                    "text-2xl font-bold",
                    totalImprovement && parseFloat(totalImprovement) > 0 && "text-primary",
                    totalImprovement && parseFloat(totalImprovement) < 0 && "text-destructive"
                  )}>
                    {totalImprovement ? (parseFloat(totalImprovement) > 0 ? "+" : "") + totalImprovement : "-"}
                  </div>
                </Card>
              </motion.div>
            </motion.div>

            {/* Score Chart - Showcase Style with Custom SVG */}
            {chartData.length >= 2 && (
              <motion.div
                initial={shouldReduce ? false : { opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={shouldReduce ? { duration: 0.2 } : { delay: 0.4 }}
              >
                <Card className="p-6 mb-8 glass-card overflow-hidden relative">
                  {/* Animated background shimmer */}
                  {!shouldReduce && (
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent"
                      animate={{ x: ["-100%", "100%"] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    />
                  )}
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                          <BarChart3 className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h2 className="text-lg font-bold">Score-Entwicklung</h2>
                          <p className="text-xs text-muted-foreground">{completedAnalyses.length} Analysen total</p>
                        </div>
                      </div>
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
                    <div className="h-56">
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
                              padding: "10px 14px",
                            }}
                            labelFormatter={(label) => (
                              <span className="text-sm font-semibold text-foreground">{label}</span>
                            )}
                            formatter={(value: number, name: string) => [
                              <span key={name} className="font-medium">{value?.toFixed(1) || "—"}</span>, 
                              name === "score" ? "Score" : "Potenzial"
                            ]}
                            cursor={{ stroke: "hsl(var(--primary))", strokeWidth: 1, strokeDasharray: "4 4" }}
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
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Before/After Comparison */}
            {canCompare && (
              <motion.div
                initial={shouldReduce ? false : { opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={shouldReduce ? { duration: 0.2 } : { delay: 0.5 }}
              >
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
                      <div className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Vorher
                      </div>
                      <div className="aspect-square rounded-xl overflow-hidden bg-card mb-3 relative">
                        <ProgressImage 
                          src={beforeAnalysis?.signedPhotoUrls?.[0] || beforeAnalysis?.photo_urls?.[0]} 
                          alt="Vorher" 
                        />
                        {/* Corner brackets */}
                        <div className="absolute top-2 left-2 w-6 h-6 border-l-2 border-t-2 border-muted-foreground/30" />
                        <div className="absolute top-2 right-2 w-6 h-6 border-r-2 border-t-2 border-muted-foreground/30" />
                        <div className="absolute bottom-2 left-2 w-6 h-6 border-l-2 border-b-2 border-muted-foreground/30" />
                        <div className="absolute bottom-2 right-2 w-6 h-6 border-r-2 border-b-2 border-muted-foreground/30" />
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
                      <div className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-primary" />
                        Nachher
                      </div>
                      <div className="aspect-square rounded-xl overflow-hidden bg-card mb-3 relative">
                        <ProgressImage 
                          src={afterAnalysis?.signedPhotoUrls?.[0] || afterAnalysis?.photo_urls?.[0]} 
                          alt="Nachher" 
                        />
                        {/* Primary corners */}
                        <div className="absolute top-2 left-2 w-6 h-6 border-l-2 border-t-2 border-primary" />
                        <div className="absolute top-2 right-2 w-6 h-6 border-r-2 border-t-2 border-primary" />
                        <div className="absolute bottom-2 left-2 w-6 h-6 border-l-2 border-b-2 border-primary" />
                        <div className="absolute bottom-2 right-2 w-6 h-6 border-r-2 border-b-2 border-primary" />
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
              </motion.div>
            )}

            {/* Improvement Insight Card */}
            {completedAnalyses.length >= 2 && (
              <motion.div
                initial={shouldReduce ? false : { opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={shouldReduce ? { duration: 0.2 } : { delay: 0.6 }}
              >
                <Card className="p-6 mb-8 bg-gradient-to-br from-primary/10 to-card border-primary/20 relative overflow-hidden">
                  {/* Animated gradient background - only on desktop */}
                  {!shouldReduce && (
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5"
                      animate={{ x: ["-100%", "100%"] }}
                      transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    />
                  )}
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-4">
                      <Flame className="w-5 h-5 text-primary" />
                      <h3 className="font-bold">Deine Entwicklung</h3>
                    </div>
                    <motion.div 
                      className="space-y-4"
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      {/* Score Change */}
                      <motion.div 
                        className="flex items-center justify-between p-3 rounded-lg bg-background/50"
                        variants={itemVariants}
                        whileHover={{ scale: 1.02 }}
                      >
                        <span className="text-muted-foreground">Score seit Start</span>
                        <motion.div 
                          className={cn(
                            "flex items-center gap-2 font-bold text-lg",
                            totalImprovement && parseFloat(totalImprovement) > 0 && "text-green-500",
                            totalImprovement && parseFloat(totalImprovement) < 0 && "text-red-500"
                          )}
                          initial={{ x: 20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.3 }}
                        >
                          {totalImprovement && parseFloat(totalImprovement) > 0 ? (
                            <TrendingUp className="w-5 h-5" />
                          ) : totalImprovement && parseFloat(totalImprovement) < 0 ? (
                            <TrendingDown className="w-5 h-5" />
                          ) : (
                            <Minus className="w-5 h-5" />
                          )}
                          {totalImprovement ? (parseFloat(totalImprovement) > 0 ? "+" : "") + totalImprovement : "0"} Punkte
                        </motion.div>
                      </motion.div>

                      {/* What Improved */}
                      {completedAnalyses.length >= 2 && (
                        <>
                          {(() => {
                            const latest = completedAnalyses[0];
                            const previous = completedAnalyses[1];
                            const latestStrengths = new Set(latest.strengths || []);
                            const prevStrengths = new Set(previous.strengths || []);
                            const newStrengths = [...latestStrengths].filter(s => !prevStrengths.has(s));
                            const latestWeaknesses = new Set(latest.weaknesses || []);
                            const prevWeaknesses = new Set(previous.weaknesses || []);
                            const resolvedWeaknesses = [...prevWeaknesses].filter(w => !latestWeaknesses.has(w));

                            return (
                              <>
                                {newStrengths.length > 0 && (
                                  <motion.div 
                                    className="p-3 rounded-lg bg-green-500/10 border border-green-500/20"
                                    variants={itemVariants}
                                    whileHover={{ scale: 1.02 }}
                                  >
                                    <div className="flex items-center gap-2 text-green-500 text-sm font-medium mb-2">
                                      <TrendingUp className="w-4 h-4" />
                                      Neu als Stärke erkannt
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                      {newStrengths.slice(0, 3).map((s, i) => (
                                        <motion.span 
                                          key={i} 
                                          className="px-2 py-1 rounded-full bg-green-500/20 text-green-500 text-xs"
                                          initial={{ scale: 0 }}
                                          animate={{ scale: 1 }}
                                          transition={{ delay: 0.4 + i * 0.1 }}
                                        >
                                          {s}
                                        </motion.span>
                                      ))}
                                    </div>
                                  </motion.div>
                                )}
                                {resolvedWeaknesses.length > 0 && (
                                  <motion.div 
                                    className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20"
                                    variants={itemVariants}
                                    whileHover={{ scale: 1.02 }}
                                  >
                                    <div className="flex items-center gap-2 text-blue-500 text-sm font-medium mb-2">
                                      <Target className="w-4 h-4" />
                                      Schwäche verbessert
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                      {resolvedWeaknesses.slice(0, 3).map((w, i) => (
                                        <motion.span 
                                          key={i} 
                                          className="px-2 py-1 rounded-full bg-blue-500/20 text-blue-500 text-xs line-through opacity-70"
                                          initial={{ scale: 0 }}
                                          animate={{ scale: 1 }}
                                          transition={{ delay: 0.4 + i * 0.1 }}
                                        >
                                          {w}
                                        </motion.span>
                                      ))}
                                    </div>
                                  </motion.div>
                                )}
                                {newStrengths.length === 0 && resolvedWeaknesses.length === 0 && (
                                  <motion.p 
                                    className="text-sm text-muted-foreground"
                                    variants={itemVariants}
                                  >
                                    Bleib dran! Bei der nächsten Analyse sehen wir, was sich verbessert hat.
                                  </motion.p>
                                )}
                              </>
                            );
                          })()}
                        </>
                      )}
                    </motion.div>
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Milestones - Showcase Style */}
            {completedAnalyses.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <Card className="p-6 mb-8 glass-card">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <motion.div
                      animate={shouldReduce ? {} : { rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Crown className="w-5 h-5 text-primary" />
                    </motion.div>
                    Meilensteine
                  </h3>
                  <motion.div 
                    className="space-y-3"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    {[
                      { emoji: "🎯", title: "Erste Analyse", achieved: completedAnalyses.length >= 1 },
                      { emoji: "📈", title: "+0.5 Score erreicht", achieved: totalImprovement && parseFloat(totalImprovement) >= 0.5 },
                      { emoji: "🔥", title: "7-Tage Streak", achieved: false },
                      { emoji: "⭐", title: "Score 7.0 erreicht", achieved: highestScore && parseFloat(highestScore) >= 7.0 },
                      { emoji: "🏆", title: "Top 10% erreicht", achieved: highestScore && parseFloat(highestScore) >= 8.5 },
                    ].map((milestone) => (
                      <motion.div 
                        key={milestone.title}
                        variants={cardVariants}
                        whileHover={{ scale: 1.01, x: 3 }}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-xl",
                          milestone.achieved ? "bg-primary/10" : "bg-muted/30 opacity-60"
                        )}
                      >
                        <span className="text-2xl">{milestone.emoji}</span>
                        <span className={cn("font-medium", !milestone.achieved && "text-muted-foreground")}>
                          {milestone.title}
                        </span>
                        {milestone.achieved && (
                          <motion.div
                            className="ml-auto"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 300 }}
                          >
                            <Target className="w-5 h-5 text-primary" />
                          </motion.div>
                        )}
                      </motion.div>
                    ))}
                  </motion.div>
                </Card>
              </motion.div>
            )}

            {/* Trends */}
            <motion.div 
              className="grid md:grid-cols-2 gap-6 mb-8"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              {/* Top Strengths */}
              <motion.div whileHover={{ scale: 1.02 }}>
                <Card className="p-6 h-full">
                  <div className="flex items-center gap-2 mb-4">
                    <motion.div
                      animate={{ y: [0, -3, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <TrendingUp className="w-5 h-5 text-green-500" />
                    </motion.div>
                    <h3 className="font-bold">Häufigste Stärken</h3>
                  </div>
                  {topStrengths.length > 0 ? (
                    <motion.div 
                      className="space-y-3"
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      {topStrengths.map(([strength, count], i) => (
                        <motion.div 
                          key={i} 
                          className="flex items-center justify-between"
                          variants={itemVariants}
                          whileHover={{ x: 5 }}
                        >
                          <span className="text-sm">{strength}</span>
                          <motion.span 
                            className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.3 + i * 0.1 }}
                          >
                            {count}x
                          </motion.span>
                        </motion.div>
                      ))}
                    </motion.div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Noch keine Daten vorhanden
                    </p>
                  )}
                </Card>
              </motion.div>

              {/* Top Weaknesses */}
              <motion.div whileHover={{ scale: 1.02 }}>
                <Card className="p-6 h-full">
                  <div className="flex items-center gap-2 mb-4">
                    <motion.div
                      animate={{ rotate: [0, 360] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    >
                      <Target className="w-5 h-5 text-orange-500" />
                    </motion.div>
                    <h3 className="font-bold">Fokus-Bereiche</h3>
                  </div>
                  {topWeaknesses.length > 0 ? (
                    <motion.div 
                      className="space-y-3"
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      {topWeaknesses.map(([weakness, count], i) => (
                        <motion.div 
                          key={i} 
                          className="flex items-center justify-between"
                          variants={itemVariants}
                          whileHover={{ x: 5 }}
                        >
                          <span className="text-sm">{weakness}</span>
                          <motion.span 
                            className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.3 + i * 0.1 }}
                          >
                            {count}x
                          </motion.span>
                        </motion.div>
                      ))}
                    </motion.div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Noch keine Daten vorhanden
                    </p>
                  )}
                </Card>
              </motion.div>
            </motion.div>

            {/* Analysis History */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
            >
              <Card className="p-6">
                <h2 className="text-xl font-bold mb-4">Alle Analysen</h2>
                <motion.div 
                  className="space-y-3"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {completedAnalyses.map((analysis, index) => {
                    const prevAnalysis = completedAnalyses[index + 1];
                    const scoreDiff = prevAnalysis?.looks_score && analysis.looks_score
                      ? analysis.looks_score - prevAnalysis.looks_score
                      : null;

                    return (
                      <motion.div 
                        key={analysis.id}
                        variants={itemVariants}
                        whileHover={{ scale: 1.02, x: 5 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex items-center gap-4 p-3 rounded-lg bg-card hover:bg-accent/50 transition-colors cursor-pointer group"
                        onClick={() => navigate(`/analysis/${analysis.id}`)}
                      >
                        <motion.div 
                          className="w-14 h-14 rounded-lg overflow-hidden bg-muted flex-shrink-0"
                          whileHover={{ scale: 1.1 }}
                        >
                          <ProgressImage 
                            src={analysis.signedPhotoUrls?.[0] || analysis.photo_urls?.[0]} 
                            alt="Analyse" 
                          />
                        </motion.div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium flex items-center gap-2">
                            Score: {analysis.looks_score?.toFixed(1)}
                            {index === 0 && (
                              <motion.span 
                                className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full"
                                animate={{ scale: [1, 1.1, 1] }}
                                transition={{ duration: 2, repeat: Infinity }}
                              >
                                Aktuell
                              </motion.span>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center gap-2">
                            <Calendar className="w-3 h-3" />
                            {formatDate(analysis.created_at)}
                          </div>
                        </div>
                        {scoreDiff !== null && (
                          <motion.div 
                            className={cn(
                              "flex items-center gap-1 text-sm font-medium",
                              scoreDiff > 0 && "text-green-500",
                              scoreDiff < 0 && "text-red-500",
                              scoreDiff === 0 && "text-muted-foreground"
                            )}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 + index * 0.05 }}
                          >
                            {scoreDiff > 0 ? (
                              <TrendingUp className="w-4 h-4" />
                            ) : scoreDiff < 0 ? (
                              <TrendingDown className="w-4 h-4" />
                            ) : (
                              <Minus className="w-4 h-4" />
                            )}
                            {scoreDiff > 0 ? "+" : ""}{scoreDiff.toFixed(1)}
                          </motion.div>
                        )}
                        <motion.div
                          initial={{ opacity: 0 }}
                          whileHover={{ opacity: 1 }}
                          className="transition-opacity"
                        >
                          <Eye className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100" />
                        </motion.div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              </Card>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}
