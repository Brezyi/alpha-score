import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/hooks/useSubscription";
import { 
  ArrowLeft, 
  Sparkles, 
  Lock,
  Crown,
  TrendingUp,
  TrendingDown,
  Target,
  RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function AnalysisResults() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const { isPremium, loading: subscriptionLoading } = useSubscription();

  const fetchAnalysis = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/login");
      return;
    }

    const { data, error } = await supabase
      .from('analyses')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error || !data) {
      navigate("/dashboard");
      return;
    }

    setAnalysis(data);
    setIsProcessing(data.status === 'pending' || data.status === 'processing');
    setLoading(false);
  }, [id, navigate]);

  useEffect(() => {
    fetchAnalysis();
  }, [fetchAnalysis]);

  // Poll for updates while processing
  useEffect(() => {
    if (!isProcessing) return;

    const interval = setInterval(() => {
      fetchAnalysis();
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(interval);
  }, [isProcessing, fetchAnalysis]);

  if (loading || subscriptionLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Analyse wird geladen...</p>
        </div>
      </div>
    );
  }

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-sm px-4">
          <div className="w-20 h-20 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-6" />
          <h2 className="text-xl font-bold mb-2">KI analysiert deine Fotos</h2>
          <p className="text-muted-foreground mb-4">
            Dies kann bis zu 30 Sekunden dauern. Bitte warte...
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Automatische Aktualisierung</span>
          </div>
        </div>
      </div>
    );
  }

  if (analysis?.status === 'failed') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-sm px-4">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <Target className="w-8 h-8 text-destructive" />
          </div>
          <h2 className="text-xl font-bold mb-2">Analyse fehlgeschlagen</h2>
          <p className="text-muted-foreground mb-6">
            Leider konnte die Analyse nicht abgeschlossen werden. Bitte versuche es erneut.
          </p>
          <Button onClick={() => navigate("/upload")} variant="hero">
            Erneut versuchen
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <button 
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Zurück</span>
          </button>
          <h1 className="text-lg font-bold">Ergebnisse</h1>
          <div className="w-20" />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Score Card */}
        <Card className="bg-gradient-to-br from-card to-primary/5 border-primary/20 mb-6 overflow-hidden">
          <CardContent className="p-6 text-center relative">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/50 via-primary to-primary/50" />
            <p className="text-muted-foreground text-sm mb-2">Dein Looks Score</p>
            <div className="relative inline-block">
              <div className="text-7xl font-bold text-primary mb-2">
                {analysis?.looks_score?.toFixed(1) || "?"}
              </div>
              <div className="text-muted-foreground text-sm">/10</div>
            </div>
            <p className="text-muted-foreground mt-4">
              Top 28% der analysierten Nutzer
            </p>
          </CardContent>
        </Card>

        {/* Strengths */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h2 className="font-semibold">Stärken</h2>
          </div>
          <div className="space-y-2">
            {(isPremium ? analysis?.strengths : analysis?.strengths?.slice(0, 1))?.map((strength: string, i: number) => (
              <Card key={i} className="bg-primary/5 border-primary/20">
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-primary" />
                  </div>
                  <span>{strength}</span>
                </CardContent>
              </Card>
            ))}
            {!isPremium && analysis?.strengths?.length > 1 && (
              <Card className="bg-card border-border relative overflow-hidden">
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    <Lock className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <span className="text-muted-foreground blur-sm">
                    +{analysis.strengths.length - 1} weitere Stärken
                  </span>
                </CardContent>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-background/50 to-background flex items-center justify-end pr-4">
                  <Lock className="w-4 h-4 text-muted-foreground" />
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* Weaknesses */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <TrendingDown className="w-5 h-5 text-destructive" />
            <h2 className="font-semibold">Verbesserungspotenzial</h2>
          </div>
          {isPremium ? (
            <div className="space-y-2">
              {analysis?.weaknesses?.map((weakness: string, i: number) => (
                <Card key={i} className="bg-destructive/5 border-destructive/20">
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-destructive/20 flex items-center justify-center">
                      <Target className="w-4 h-4 text-destructive" />
                    </div>
                    <span>{weakness}</span>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="bg-card border-border relative overflow-hidden">
              <CardContent className="p-8 text-center">
                <Lock className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground mb-1">Premium-Feature</p>
                <p className="text-sm text-muted-foreground">
                  Entsperre detailliertes Verbesserungspotenzial
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Priorities */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-5 h-5 text-primary" />
            <h2 className="font-semibold">Prioritäten</h2>
          </div>
          {isPremium ? (
            <div className="space-y-2">
              {analysis?.priorities?.map((priority: string, i: number) => (
                <Card key={i} className="bg-card border-border">
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                      {i + 1}
                    </div>
                    <span>{priority}</span>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="bg-card border-border relative overflow-hidden">
              <CardContent className="p-8 text-center">
                <Lock className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground mb-1">Premium-Feature</p>
                <p className="text-sm text-muted-foreground">
                  Entsperre deine persönliche Prioritätenliste
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Premium CTA */}
        {!isPremium && (
          <Card className="bg-gradient-to-br from-primary/20 via-primary/10 to-card border-primary/30 mb-6">
            <CardContent className="p-6 text-center">
              <Crown className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Entsperre alle Details</h3>
              <p className="text-muted-foreground mb-6">
                Erhalte Zugang zu deiner vollständigen Analyse, personalisierten Looksmax-Plan und AI Coach
              </p>
              <Button 
                variant="hero" 
                size="lg" 
                className="w-full"
                onClick={() => navigate("/pricing")}
              >
                <Crown className="w-5 h-5" />
                Premium freischalten
              </Button>
              <p className="text-xs text-muted-foreground mt-3">
                Ab 9,99€/Monat • Jederzeit kündbar
              </p>
            </CardContent>
          </Card>
        )}

        <Button
          variant="outline"
          size="lg"
          className="w-full"
          onClick={() => navigate("/dashboard")}
        >
          Zurück zum Dashboard
        </Button>
      </main>
    </div>
  );
}
