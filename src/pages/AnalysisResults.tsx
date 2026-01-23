import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";

import { 
  ArrowLeft, 
  Sparkles, 
  Lock,
  Crown,
  TrendingUp,
  TrendingDown,
  Target,
  RefreshCw,
  AlertTriangle,
  Camera,
  ChevronLeft,
  ChevronRight,
  X,
  Zap,
  ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function AnalysisResults() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const { isPremium, loading: subscriptionLoading } = useSubscription();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  const fetchAnalysis = useCallback(async () => {
    if (!user) return;

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
    
    // Generate signed URLs for photos
    if (data.photo_urls && data.photo_urls.length > 0) {
      const urls = await Promise.all(
        data.photo_urls.map(async (photoUrl: string) => {
          // Extract path from full URL (e.g., ".../analysis-photos/user-id/file.webp")
          const bucketPath = photoUrl.includes('/analysis-photos/')
            ? photoUrl.split('/analysis-photos/')[1]
            : photoUrl;
          
          const { data: signedData, error } = await supabase.storage
            .from("analysis-photos")
            .createSignedUrl(bucketPath, 3600); // 1 hour expiry
          
          if (error) {
            console.error("Error creating signed URL:", error);
            return null;
          }
          return signedData?.signedUrl || null;
        })
      );
      setPhotoUrls(urls.filter(Boolean) as string[]);
    }
    
    // Only continue processing if status is pending/processing - stop polling for all other states
    const stillProcessing = data.status === 'pending' || data.status === 'processing';
    setIsProcessing(stillProcessing);
    setLoading(false);
  }, [id, navigate, user]);

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
          {/* Scanning Image Preview */}
          <div className="relative w-32 h-32 mx-auto mb-6 rounded-2xl overflow-hidden border-2 border-primary/40 shadow-lg animate-subtle-shake">
            {/* Placeholder or first photo */}
            <div className="w-full h-full bg-gradient-to-br from-card to-primary/10 flex items-center justify-center">
              <Camera className="w-10 h-10 text-primary/50" />
            </div>
            {/* Scan Line */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent animate-scan-line shadow-[0_0_15px_hsl(var(--primary)),0_0_30px_hsl(var(--primary)/0.5)]" />
            </div>
            {/* Corner Brackets */}
            <div className="absolute top-2 left-2 w-4 h-4 border-l-2 border-t-2 border-primary/60" />
            <div className="absolute top-2 right-2 w-4 h-4 border-r-2 border-t-2 border-primary/60" />
            <div className="absolute bottom-2 left-2 w-4 h-4 border-l-2 border-b-2 border-primary/60" />
            <div className="absolute bottom-2 right-2 w-4 h-4 border-r-2 border-b-2 border-primary/60" />
            {/* Glow Effect */}
            <div className="absolute inset-0 bg-primary/5 animate-pulse" />
          </div>
          
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

  // Handle validation_failed status (face not detected)
  if (analysis?.status === 'validation_failed') {
    const validationError = (analysis.detailed_results as any)?.validation_error || 
      "Kein Gesicht erkannt. Bitte lade ein klares Foto deines Gesichts hoch (frontal, gute Beleuchtung).";
    
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-sm px-4">
          <div className="w-20 h-20 rounded-full bg-warning/10 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-10 h-10 text-warning" />
          </div>
          <h2 className="text-xl font-bold mb-2">Foto nicht geeignet</h2>
          <p className="text-muted-foreground mb-6">
            {validationError}
          </p>
          
          {/* Tips Box */}
          <Card className="bg-primary/5 border-primary/20 mb-6 text-left">
            <CardContent className="p-4">
              <p className="font-medium text-sm mb-2 flex items-center gap-2">
                <Camera className="w-4 h-4 text-primary" />
                Tipps für ein gutes Foto:
              </p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Frontale Aufnahme, Blick in die Kamera</li>
                <li>• Gute Beleuchtung (Tageslicht ideal)</li>
                <li>• Keine Sonnenbrille oder Maske</li>
                <li>• Gesicht sollte gut sichtbar sein</li>
                <li>• Scharfes, nicht verschwommenes Bild</li>
              </ul>
            </CardContent>
          </Card>
          
          <Button onClick={() => navigate("/upload")} variant="hero" size="lg" className="w-full">
            <Camera className="w-5 h-5" />
            Neues Foto hochladen
          </Button>
          <p className="text-xs text-muted-foreground mt-3">
            Keine Kosten entstanden – versuche es einfach erneut
          </p>
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
          <div className="w-10" /> {/* Spacer for centering */}
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Photo Display */}
        {photoUrls.length > 0 && (
          <div className="mb-8">
            <div className="flex gap-4 justify-center flex-wrap">
              {photoUrls.map((url, index) => (
                <button 
                  key={index} 
                  onClick={() => {
                    setLightboxIndex(index);
                    setLightboxOpen(true);
                  }}
                  className="group relative w-36 h-36 sm:w-44 sm:h-44 rounded-2xl overflow-hidden border-2 border-primary/30 shadow-xl bg-card cursor-pointer transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
                >
                  <img 
                    src={url} 
                    alt={`Foto ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {/* Scan Line Animation */}
                  <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent animate-scan-line shadow-[0_0_15px_hsl(var(--primary)),0_0_30px_hsl(var(--primary)/0.5)]" />
                  </div>
                  {/* Corner Brackets */}
                  <div className="absolute top-2 left-2 w-4 h-4 border-l-2 border-t-2 border-primary/60" />
                  <div className="absolute top-2 right-2 w-4 h-4 border-r-2 border-t-2 border-primary/60" />
                  <div className="absolute bottom-2 left-2 w-4 h-4 border-l-2 border-b-2 border-primary/60" />
                  <div className="absolute bottom-2 right-2 w-4 h-4 border-r-2 border-b-2 border-primary/60" />
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                </button>
              ))}
            </div>
            <p className="text-center text-xs text-muted-foreground mt-2">Tippe auf ein Foto zum Vergrößern</p>
          </div>
        )}

        {/* Lightbox Dialog */}
        <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
          <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95 border-none [&>button]:bg-black/50 [&>button]:text-white [&>button]:hover:bg-black/70">
            <div className="relative w-full h-full flex items-center justify-center min-h-[50vh]">
              {/* Navigation - Previous */}
              {photoUrls.length > 1 && (
                <button
                  onClick={() => setLightboxIndex((prev) => (prev === 0 ? photoUrls.length - 1 : prev - 1))}
                  className="absolute left-4 z-50 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              )}

              {/* Image */}
              <img
                src={photoUrls[lightboxIndex]}
                alt={`Foto ${lightboxIndex + 1}`}
                className="max-w-full max-h-[85vh] object-contain rounded-lg"
              />

              {/* Navigation - Next */}
              {photoUrls.length > 1 && (
                <button
                  onClick={() => setLightboxIndex((prev) => (prev === photoUrls.length - 1 ? 0 : prev + 1))}
                  className="absolute right-4 z-50 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              )}

              {/* Counter */}
              {photoUrls.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/50 text-white text-sm">
                  {lightboxIndex + 1} / {photoUrls.length}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Score Card with Potential */}
        <Card className="bg-gradient-to-br from-card to-primary/5 border-primary/20 mb-6 overflow-hidden">
          <CardContent className="p-6 relative">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/50 via-primary to-primary/50" />
            
            <div className="flex items-center justify-center gap-6 md:gap-10">
              {/* Current Score */}
              <div className="text-center">
                <p className="text-muted-foreground text-xs mb-1">Aktuell</p>
                <div className="text-5xl md:text-6xl font-bold text-foreground">
                  {analysis?.looks_score?.toFixed(1) || "?"}
                </div>
              </div>
              
              {/* Arrow */}
              <div className="flex flex-col items-center gap-1">
                <ArrowRight className="w-6 h-6 text-primary" />
                <span className="text-xs text-muted-foreground">Potenzial</span>
              </div>
              
              {/* Potential Score */}
              <div className="text-center">
                <p className="text-primary text-xs mb-1 flex items-center justify-center gap-1">
                  <Zap className="w-3 h-3" />
                  Erreichbar
                </p>
                <div className="text-5xl md:text-6xl font-bold text-primary">
                  {analysis?.potential_score?.toFixed(1) || (analysis?.looks_score ? (Math.min(10, analysis.looks_score + 1.5)).toFixed(1) : "?")}
                </div>
              </div>
            </div>
            
            {/* Improvement indicator */}
            {analysis?.looks_score && analysis?.potential_score && (
              <div className="mt-4 text-center">
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
                  <TrendingUp className="w-4 h-4" />
                  +{(analysis.potential_score - analysis.looks_score).toFixed(1)} Punkte möglich
                </span>
              </div>
            )}
            
            <p className="text-muted-foreground text-center mt-4 text-sm">
              Dein persönlicher Ausgangswert und erreichbares Potenzial
            </p>
          </CardContent>
        </Card>

        {/* Potential Image Preview */}
        {analysis?.potential_image_url && isPremium && (
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 mb-6 overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-5 h-5 text-primary" />
                <h2 className="font-semibold">Dein Potenzial</h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {/* Current Photo */}
                <div>
                  <p className="text-xs text-muted-foreground mb-2 text-center">Aktuell</p>
                  <div className="aspect-square rounded-xl overflow-hidden border border-border">
                    {photoUrls[0] && (
                      <img 
                        src={photoUrls[0]} 
                        alt="Aktuell"
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                </div>
                {/* Potential Photo */}
                <div>
                  <p className="text-xs text-primary mb-2 text-center flex items-center justify-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Potenzial
                  </p>
                  <div className="aspect-square rounded-xl overflow-hidden border-2 border-primary/40 relative">
                    <img 
                      src={analysis.potential_image_url} 
                      alt="Potenzial"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent" />
                  </div>
                </div>
              </div>
              {(analysis.detailed_results as any)?.potential_improvements && (
                <p className="text-sm text-muted-foreground mt-3 text-center">
                  {(analysis.detailed_results as any).potential_improvements}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Potential Image - Locked for free users */}
        {!isPremium && (
          <Card className="bg-card border-border mb-6 relative overflow-hidden">
            <CardContent className="p-8 text-center">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
              <Zap className="w-10 h-10 text-primary mx-auto mb-3" />
              <h3 className="font-semibold mb-2">KI-Potenzial-Vorschau</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Sieh, wie du mit optimaler Pflege und Styling aussehen könntest
              </p>
              <Lock className="w-6 h-6 text-muted-foreground mx-auto" />
              <p className="text-xs text-muted-foreground mt-2">Premium-Feature</p>
            </CardContent>
          </Card>
        )}

        {/* Strengths */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h2 className="font-semibold">Stärken</h2>
          </div>
          {isPremium ? (
            <div className="space-y-2">
              {analysis?.strengths?.map((strength: string, i: number) => (
                <Card key={i} className="bg-primary/5 border-primary/20">
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-primary" />
                    </div>
                    <span>{strength}</span>
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
                  Entsperre deine detaillierten Stärken
                </p>
              </CardContent>
            </Card>
          )}
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
