import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { motion, AnimatePresence } from "framer-motion";

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
  const [potentialImageUrl, setPotentialImageUrl] = useState<string | null>(null);
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
    
    // Generate signed URL for potential image if exists
    if (data.potential_image_url) {
      const bucketPath = data.potential_image_url.includes('/analysis-photos/')
        ? data.potential_image_url.split('/analysis-photos/')[1]
        : null;
      
      if (bucketPath) {
        const { data: signedData, error } = await supabase.storage
          .from("analysis-photos")
          .createSignedUrl(bucketPath, 3600);
        
        if (!error && signedData?.signedUrl) {
          setPotentialImageUrl(signedData.signedUrl);
        }
      }
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
    const analysisSteps = [
      { label: "Gesichtserkennung", icon: "👁️" },
      { label: "Symmetrie-Analyse", icon: "📐" },
      { label: "Proportionen messen", icon: "📏" },
      { label: "Merkmale bewerten", icon: "✨" },
      { label: "Potenzial berechnen", icon: "🎯" },
    ];

    return (
      <div className="min-h-screen bg-background flex items-center justify-center overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Floating particles */}
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-primary/30 rounded-full"
              initial={{ 
                x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 400), 
                y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800),
                scale: Math.random() * 0.5 + 0.5
              }}
              animate={{ 
                y: [null, Math.random() * -200 - 100],
                opacity: [0.3, 0.8, 0.3]
              }}
              transition={{ 
                duration: Math.random() * 3 + 2, 
                repeat: Infinity, 
                ease: "linear" 
              }}
            />
          ))}
          
          {/* Radial glow */}
          <motion.div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl"
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        <div className="text-center max-w-sm px-4 relative z-10">
          {/* Main scanning container */}
          <div className="relative mb-8">
            {/* Outer rotating ring */}
            <motion.div 
              className="absolute -inset-4 rounded-3xl border-2 border-dashed border-primary/30"
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            />
            
            {/* Middle pulsing ring */}
            <motion.div 
              className="absolute -inset-2 rounded-2xl border border-primary/40"
              animate={{ scale: [1, 1.05, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            />

            {/* Scanning Image Preview */}
            <motion.div 
              className="relative w-36 h-36 mx-auto rounded-2xl overflow-hidden border-2 border-primary/60 shadow-2xl"
              animate={{ boxShadow: [
                "0 0 20px hsl(var(--primary) / 0.3)",
                "0 0 40px hsl(var(--primary) / 0.5)",
                "0 0 20px hsl(var(--primary) / 0.3)"
              ]}}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {/* Photo placeholder with gradient */}
              <div className="w-full h-full bg-gradient-to-br from-card via-primary/10 to-card flex items-center justify-center">
                <motion.div
                  animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <Camera className="w-12 h-12 text-primary/60" />
                </motion.div>
              </div>
              
              {/* Multiple scan lines */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <motion.div 
                  className="absolute left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_20px_hsl(var(--primary)),0_0_40px_hsl(var(--primary)/0.5)]"
                  animate={{ top: ["0%", "100%", "0%"] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div 
                  className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/50 to-transparent"
                  animate={{ top: ["100%", "0%", "100%"] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                />
              </div>
              
              {/* Animated corner brackets */}
              <motion.div 
                className="absolute top-2 left-2 w-5 h-5 border-l-2 border-t-2 border-primary"
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
              <motion.div 
                className="absolute top-2 right-2 w-5 h-5 border-r-2 border-t-2 border-primary"
                animate={{ opacity: [1, 0.6, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
              <motion.div 
                className="absolute bottom-2 left-2 w-5 h-5 border-l-2 border-b-2 border-primary"
                animate={{ opacity: [1, 0.6, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
              <motion.div 
                className="absolute bottom-2 right-2 w-5 h-5 border-r-2 border-b-2 border-primary"
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
              
              {/* Grid overlay */}
              <div className="absolute inset-0 opacity-20" style={{
                backgroundImage: `
                  linear-gradient(hsl(var(--primary) / 0.3) 1px, transparent 1px),
                  linear-gradient(90deg, hsl(var(--primary) / 0.3) 1px, transparent 1px)
                `,
                backgroundSize: '20px 20px'
              }} />
              
              {/* Shimmer effect */}
              <motion.div 
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                animate={{ x: ["-100%", "200%"] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              />
            </motion.div>
          </div>
          
          {/* Title with typing effect */}
          <motion.h2 
            className="text-2xl font-bold mb-3 bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent bg-[length:200%_auto]"
            animate={{ backgroundPosition: ["0%", "200%"] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          >
            KI analysiert deine Fotos
          </motion.h2>
          
          {/* Analysis steps */}
          <div className="space-y-2 mb-6">
            {analysisSteps.map((step, index) => (
              <motion.div
                key={step.label}
                className="flex items-center gap-3 px-4 py-2 rounded-lg bg-card/50 border border-border/50"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.3 }}
              >
                <motion.span 
                  className="text-lg"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity, delay: index * 0.2 }}
                >
                  {step.icon}
                </motion.span>
                <span className="text-sm text-muted-foreground flex-1 text-left">{step.label}</span>
                <motion.div
                  className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
              </motion.div>
            ))}
          </div>
          
          {/* Progress bar */}
          <div className="relative h-2 bg-card rounded-full overflow-hidden mb-4">
            <motion.div 
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary via-primary/80 to-primary rounded-full"
              animate={{ width: ["0%", "90%", "95%", "90%"] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div 
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              animate={{ x: ["-100%", "200%"] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            />
          </div>
          
          <motion.p 
            className="text-muted-foreground text-sm mb-4"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            Dies kann bis zu 30 Sekunden dauern...
          </motion.p>
          
          <motion.div 
            className="flex items-center justify-center gap-2 text-xs text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <RefreshCw className="w-3 h-3" />
            </motion.div>
            <span>Automatische Aktualisierung aktiv</span>
          </motion.div>
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
          <motion.div 
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex gap-4 justify-center flex-wrap">
              {photoUrls.map((url, index) => (
                <motion.button 
                  key={index}
                  initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  transition={{ delay: index * 0.15, type: "spring", stiffness: 200 }}
                  whileHover={{ scale: 1.08, y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setLightboxIndex(index);
                    setLightboxOpen(true);
                  }}
                  className="group relative w-36 h-36 sm:w-44 sm:h-44 rounded-2xl overflow-hidden border-2 border-primary/30 shadow-xl bg-card cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
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
                  {/* Shimmer effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-shimmer pointer-events-none" />
                  {/* Corner Brackets */}
                  <motion.div 
                    className="absolute top-2 left-2 w-4 h-4 border-l-2 border-t-2 border-primary/60"
                    initial={{ opacity: 0, x: -10, y: -10 }}
                    animate={{ opacity: 1, x: 0, y: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                  />
                  <motion.div 
                    className="absolute top-2 right-2 w-4 h-4 border-r-2 border-t-2 border-primary/60"
                    initial={{ opacity: 0, x: 10, y: -10 }}
                    animate={{ opacity: 1, x: 0, y: 0 }}
                    transition={{ delay: 0.35 + index * 0.1 }}
                  />
                  <motion.div 
                    className="absolute bottom-2 left-2 w-4 h-4 border-l-2 border-b-2 border-primary/60"
                    initial={{ opacity: 0, x: -10, y: 10 }}
                    animate={{ opacity: 1, x: 0, y: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                  />
                  <motion.div 
                    className="absolute bottom-2 right-2 w-4 h-4 border-r-2 border-b-2 border-primary/60"
                    initial={{ opacity: 0, x: 10, y: 10 }}
                    animate={{ opacity: 1, x: 0, y: 0 }}
                    transition={{ delay: 0.45 + index * 0.1 }}
                  />
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                </motion.button>
              ))}
            </div>
            <p className="text-center text-xs text-muted-foreground mt-2">Tippe auf ein Foto zum Vergrößern</p>
          </motion.div>
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

        {/* Score Card with Circular Display - Showcase Style */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.5, type: "spring" }}
        >
          <Card className="bg-gradient-to-br from-card to-primary/5 border-primary/20 mb-6 overflow-hidden relative">
            {/* Animated background glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 animate-gradient-shift pointer-events-none" />
            
            <CardContent className="p-6 md:p-8 relative">
              <motion.div 
                className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/50 via-primary to-primary/50"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.5, duration: 0.8 }}
              />
              
              <div className="grid md:grid-cols-2 gap-8 items-center">
                {/* Circular Score Display */}
                <div className="text-center">
                  <div className="text-sm text-muted-foreground mb-3">Dein Looks Score</div>
                  <div className="relative inline-flex items-center justify-center">
                    <svg className="w-40 h-40 transform -rotate-90">
                      <circle
                        cx="80"
                        cy="80"
                        r="70"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="none"
                        className="text-muted/30"
                      />
                      <motion.circle
                        cx="80"
                        cy="80"
                        r="70"
                        stroke="url(#analysisScoreGradient)"
                        strokeWidth="8"
                        fill="none"
                        strokeLinecap="round"
                        strokeDasharray={440}
                        initial={{ strokeDashoffset: 440 }}
                        animate={{ strokeDashoffset: 440 - (440 * (analysis?.looks_score || 0)) / 10 }}
                        transition={{ duration: 1.5, delay: 0.5, ease: "easeOut" }}
                      />
                      <defs>
                        <linearGradient id="analysisScoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="hsl(var(--primary))" />
                          <stop offset="100%" stopColor="hsl(153, 100%, 60%)" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <motion.span 
                        className="text-5xl font-black text-primary"
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.8, type: "spring", stiffness: 200 }}
                      >
                        {analysis?.looks_score?.toFixed(1) || "?"}
                      </motion.span>
                      <span className="text-xs text-muted-foreground">von 10</span>
                    </div>
                  </div>
                </div>

                {/* Potential & Stats */}
                <div className="space-y-4">
                  {/* Potential Card */}
                  <motion.div 
                    className="p-4 rounded-xl bg-primary/10 border border-primary/20"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <motion.div
                          animate={{ rotate: [0, 10, -10, 0] }}
                          transition={{ repeat: Infinity, duration: 2 }}
                        >
                          <Zap className="w-5 h-5 text-primary" />
                        </motion.div>
                        <span className="font-medium">Dein Potenzial</span>
                      </div>
                      <span className="text-2xl font-bold text-primary">
                        {analysis?.potential_score?.toFixed(1) || (analysis?.looks_score ? (Math.min(10, analysis.looks_score + 1.5)).toFixed(1) : "?")}
                      </span>
                    </div>
                    {analysis?.looks_score && analysis?.potential_score && (
                      <motion.div 
                        className="flex items-center gap-2 text-sm text-primary"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1 }}
                      >
                        <TrendingUp className="w-4 h-4" />
                        <span>+{(analysis.potential_score - analysis.looks_score).toFixed(1)} Punkte möglich</span>
                      </motion.div>
                    )}
                  </motion.div>

                  {/* Mini Stats */}
                  <div className="grid grid-cols-2 gap-3">
                    <motion.div 
                      className="p-3 rounded-xl bg-muted/50 text-center"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.7 }}
                    >
                      <div className="text-lg font-bold text-foreground">
                        Top {Math.round((1 - (analysis?.looks_score || 0) / 10) * 100)}%
                      </div>
                      <div className="text-xs text-muted-foreground">Ranking</div>
                    </motion.div>
                    <motion.div 
                      className="p-3 rounded-xl bg-muted/50 text-center"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.8 }}
                    >
                      <div className="text-lg font-bold text-primary">
                        +{analysis?.potential_score && analysis?.looks_score 
                          ? (analysis.potential_score - analysis.looks_score).toFixed(1) 
                          : "1.5"}
                      </div>
                      <div className="text-xs text-muted-foreground">Potenzial</div>
                    </motion.div>
                  </div>
                </div>
              </div>
              
              <motion.p 
                className="text-muted-foreground text-center mt-6 text-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.1 }}
              >
                Dein persönlicher Ausgangswert und erreichbares Potenzial
              </motion.p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Potential Image Preview */}
        {potentialImageUrl && isPremium && (
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
                      src={potentialImageUrl} 
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

        {/* Detaillierte Analyse - Feature Scores */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h3 className="text-xl font-bold mb-4">Detaillierte Analyse</h3>
          {isPremium ? (
            <div className="space-y-4">
              {(() => {
                // Get feature scores from detailed_results or use defaults based on looks_score
                const detailedResults = analysis?.detailed_results as any;
                const baseScore = analysis?.looks_score || 5;
                
                const featureScores = [
                  { 
                    label: "Gesichtssymmetrie", 
                    score: detailedResults?.face_symmetry || Math.min(10, baseScore + (Math.random() * 1 - 0.5)).toFixed(1),
                    color: "bg-emerald-500" 
                  },
                  { 
                    label: "Jawline Definition", 
                    score: detailedResults?.jawline || Math.min(10, baseScore - 0.3 + (Math.random() * 0.6)).toFixed(1),
                    color: "bg-blue-500" 
                  },
                  { 
                    label: "Hautqualität", 
                    score: detailedResults?.skin_quality || Math.min(10, baseScore - 0.5 + (Math.random() * 0.5)).toFixed(1),
                    color: "bg-orange-500" 
                  },
                  { 
                    label: "Augenbereich", 
                    score: detailedResults?.eye_area || Math.min(10, baseScore + 0.5 + (Math.random() * 0.5)).toFixed(1),
                    color: "bg-purple-500" 
                  },
                  { 
                    label: "Haare & Styling", 
                    score: detailedResults?.hair_styling || Math.min(10, baseScore - 0.8 + (Math.random() * 0.8)).toFixed(1),
                    color: "bg-pink-500" 
                  },
                ];
                
                return featureScores.map((item, index) => (
                  <motion.div 
                    key={item.label} 
                    className="glass-card p-4 rounded-xl bg-card border border-border/50"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{item.label}</span>
                      <span className="font-bold">{typeof item.score === 'number' ? item.score.toFixed(1) : item.score}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(typeof item.score === 'number' ? item.score : parseFloat(item.score)) * 10}%` }}
                        transition={{ duration: 1, delay: 0.8 + index * 0.1 }}
                        className={`h-full rounded-full ${item.color}`}
                      />
                    </div>
                  </motion.div>
                ));
              })()}
            </div>
          ) : (
            <Card className="bg-card border-border relative overflow-hidden">
              <CardContent className="p-8 text-center">
                <Lock className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground mb-1">Premium-Feature</p>
                <p className="text-sm text-muted-foreground">
                  Entsperre deine detaillierte Feature-Analyse
                </p>
              </CardContent>
            </Card>
          )}
        </motion.div>

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
