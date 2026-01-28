import { useState, useCallback, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useStreak } from "@/hooks/useStreak";
import { useSubscription } from "@/hooks/useSubscription";
import { useReferral } from "@/hooks/useReferral";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Upload, 
  X, 
  Camera, 
  User, 
  ArrowLeft,
  Sparkles,
  Image as ImageIcon,
  Check,
  HelpCircle,
  Crown,
  Lock,
  Users,
  Copy,
  Share2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PhotoGuidelinesModal } from "@/components/PhotoGuidelinesModal";
import { PhotoTutorial } from "@/components/PhotoTutorial";
import { Capacitor } from "@capacitor/core";
import { MobileAppLayout } from "@/components/mobile/MobileAppLayout";
import { MobileUploadContent } from "@/components/mobile/MobileUploadContent";

interface UploadedPhoto {
  file: File;
  preview: string;
  type: "front" | "side" | "body";
}

const photoTypes = [
  { id: "front" as const, label: "Frontal", icon: User, description: "Gesicht von vorne" },
  { id: "side" as const, label: "Seite", icon: User, description: "Profil-Ansicht" },
  { id: "body" as const, label: "Körper", icon: User, description: "Ganzkörper (optional)" },
];

const DAILY_LIMIT_PREMIUM = 10;

export default function AnalysisUpload() {
  const isNative = Capacitor.isNativePlatform();
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [activeType, setActiveType] = useState<"front" | "side" | "body">("front");
  const [completedAnalysesCount, setCompletedAnalysesCount] = useState<number | null>(null);
  const [dailyAnalysesCount, setDailyAnalysesCount] = useState<number | null>(null);
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { recordActivity } = useStreak();
  const { isPremium, subscriptionType, loading: subscriptionLoading } = useSubscription();
  const { 
    referralCode, 
    referralCount, 
    requiredReferrals, 
    hasEnoughReferrals, 
    loading: referralLoading,
    copyReferralCode,
    copyShareLink,
    getShareLink 
  } = useReferral();

  const isLifetime = subscriptionType === 'lifetime' || subscriptionType === 'owner';

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  // Check how many completed analyses user has (total + today)
  useEffect(() => {
    const fetchAnalysesCount = async () => {
      if (!user) return;
      
      // Total completed analyses
      const { count: totalCount, error: totalError } = await supabase
        .from("analyses")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "completed");
      
      if (!totalError) {
        setCompletedAnalysesCount(totalCount ?? 0);
      }

      // Today's completed analyses
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString();

      const { count: dailyCount, error: dailyError } = await supabase
        .from("analyses")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "completed")
        .gte("created_at", startOfDay)
        .lt("created_at", endOfDay);

      if (!dailyError) {
        setDailyAnalysesCount(dailyCount ?? 0);
      }
    };
    
    fetchAnalysesCount();
  }, [user]);

  // Free users need 3 referrals to unlock their analysis
  const needsReferrals = !isPremium && !hasEnoughReferrals;
  const hasReachedDailyLimit = isPremium && !isLifetime && dailyAnalysesCount !== null && dailyAnalysesCount >= DAILY_LIMIT_PREMIUM;

  const handleCopyCode = async () => {
    const success = await copyReferralCode();
    if (success) {
      toast({
        title: "Code kopiert!",
        description: "Teile den Code mit deinen Freunden.",
      });
    }
  };

  const handleShare = async () => {
    const link = getShareLink();
    if (link && navigator.share) {
      try {
        await navigator.share({
          title: "Lade Freunde ein!",
          text: `Melde dich bei GLOWMAXXED an und nutze meinen Freundescode: ${referralCode}`,
          url: link,
        });
      } catch (err) {
        // User cancelled or share failed, copy link instead
        await copyShareLink();
        toast({
          title: "Link kopiert!",
          description: "Teile den Link mit deinen Freunden.",
        });
      }
    } else {
      await copyShareLink();
      toast({
        title: "Link kopiert!",
        description: "Teile den Link mit deinen Freunden.",
      });
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  }, [activeType]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      handleFiles(files);
    }
  };

  const handleFiles = (files: File[]) => {
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
      toast({
        title: "Ungültiges Format",
        description: "Bitte lade nur Bilder hoch (JPG, PNG, WebP)",
        variant: "destructive",
      });
      return;
    }

    const existingType = photos.find(p => p.type === activeType);
    if (existingType) {
      toast({
        title: "Foto ersetzen",
        description: `Das ${photoTypes.find(t => t.id === activeType)?.label}-Foto wird ersetzt`,
      });
    }

    const file = imageFiles[0];
    const preview = URL.createObjectURL(file);
    
    setPhotos(prev => {
      const filtered = prev.filter(p => p.type !== activeType);
      return [...filtered, { file, preview, type: activeType }];
    });

    // Auto-advance to next type
    const currentIndex = photoTypes.findIndex(t => t.id === activeType);
    if (currentIndex < photoTypes.length - 1) {
      setActiveType(photoTypes[currentIndex + 1].id);
    }
  };

  const addPhoto = (file: File, type: "front" | "side" | "body") => {
    const preview = URL.createObjectURL(file);
    setPhotos(prev => {
      const filtered = prev.filter(p => p.type !== type);
      return [...filtered, { file, preview, type }];
    });
  };

  const removePhoto = (type: "front" | "side" | "body") => {
    setPhotos(prev => {
      const photo = prev.find(p => p.type === type);
      if (photo) URL.revokeObjectURL(photo.preview);
      return prev.filter(p => p.type !== type);
    });
  };

  const uploadPhotos = async () => {
    if (!user || photos.length === 0) return;

    const frontPhoto = photos.find(p => p.type === "front");
    if (!frontPhoto) {
      toast({
        title: "Frontalfoto erforderlich",
        description: "Bitte lade mindestens ein Frontalfoto hoch",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    const uploadedUrls: string[] = [];

    try {
      for (const photo of photos) {
        const fileExt = photo.file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}-${photo.type}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('analysis-photos')
          .upload(fileName, photo.file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('analysis-photos')
          .getPublicUrl(fileName);

        uploadedUrls.push(publicUrl);
      }

      // Create analysis record
      const { data: analysis, error: dbError } = await supabase
        .from('analyses')
        .insert({
          user_id: user.id,
          photo_urls: uploadedUrls,
          status: 'pending'
        })
        .select()
        .single();

      if (dbError) throw dbError;

      // Record activity for streak
      await recordActivity();

      toast({
        title: "Upload erfolgreich!",
        description: "Deine Analyse wird jetzt verarbeitet...",
      });

      // Trigger AI analysis (fire and forget - results page will poll/show status)
      supabase.functions.invoke("analyze-photos", {
        body: { analysisId: analysis.id }
      }).catch(err => {
        console.error("Analysis trigger error:", err);
      });

      // Navigate to results page
      navigate(`/analysis/${analysis.id}`);

    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload fehlgeschlagen",
        description: error.message || "Bitte versuche es erneut",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const getPhotoForType = (type: "front" | "side" | "body") => {
    return photos.find(p => p.type === type);
  };

  // Show loading while checking subscription, analysis count, and referral data
  if (subscriptionLoading || referralLoading || completedAnalysesCount === null || (isPremium && !isLifetime && dailyAnalysesCount === null)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Wird geladen...</p>
        </div>
      </div>
    );
  }

  // Show referral invite screen if free user needs more referrals
  if (needsReferrals) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <button 
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Zurück</span>
            </button>
            <h1 className="text-lg font-bold">KI-Analyse</h1>
            <div className="w-5" />
          </div>
        </header>
        
        <main className="container mx-auto px-4 py-12 max-w-md text-center">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Users className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-3">Lade 3 Freunde ein!</h2>
          <p className="text-muted-foreground mb-6">
            Um deine kostenlose Analyse freizuschalten, lade {requiredReferrals} Freunde ein, die sich registrieren.
          </p>

          {/* Progress */}
          <div className="mb-8">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Fortschritt</span>
              <span className="font-medium">{referralCount} / {requiredReferrals}</span>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-primary rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${(referralCount / requiredReferrals) * 100}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
            <div className="flex justify-between mt-2">
              {[...Array(requiredReferrals)].map((_, i) => (
                <div key={i} className="flex flex-col items-center">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                    i < referralCount 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-muted text-muted-foreground"
                  )}>
                    {i < referralCount ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <User className="w-4 h-4" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Referral Code Card */}
          <Card className="bg-gradient-to-br from-primary/20 via-primary/10 to-card border-primary/30 mb-6">
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground mb-3">Dein Freundescode</p>
              <div className="flex items-center justify-center gap-3 mb-4">
                <code className="text-3xl font-bold tracking-widest text-primary">
                  {referralCode || "--------"}
                </code>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={handleCopyCode}
                >
                  <Copy className="w-4 h-4" />
                  Code kopieren
                </Button>
                <Button 
                  variant="hero" 
                  className="flex-1"
                  onClick={handleShare}
                >
                  <Share2 className="w-4 h-4" />
                  Teilen
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Instructions */}
          <div className="bg-muted/50 rounded-xl p-4 text-left mb-6">
            <h4 className="font-medium mb-2">So funktioniert's:</h4>
            <ol className="text-sm text-muted-foreground space-y-2">
              <li className="flex items-start gap-2">
                <span className="bg-primary/20 text-primary rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 text-xs font-bold">1</span>
                Teile deinen Code mit Freunden
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-primary/20 text-primary rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 text-xs font-bold">2</span>
                Deine Freunde registrieren sich mit dem Code
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-primary/20 text-primary rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 text-xs font-bold">3</span>
                Nach 3 Anmeldungen wird deine Analyse freigeschaltet
              </li>
            </ol>
          </div>

          {/* Premium alternative */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-3">
              Keine Lust zu warten?
            </p>
            <Link to="/pricing">
              <Button variant="outline" size="sm">
                <Crown className="w-4 h-4" />
                Jetzt Premium werden
              </Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  // Show daily limit reached screen for premium users (not lifetime)
  if (hasReachedDailyLimit) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <button 
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Zurück</span>
            </button>
            <h1 className="text-lg font-bold">KI-Analyse</h1>
            <div className="w-5" />
          </div>
        </header>
        
        <main className="container mx-auto px-4 py-16 max-w-md text-center">
          <div className="w-20 h-20 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-10 h-10 text-amber-500" />
          </div>
          <h2 className="text-2xl font-bold mb-3">Tageslimit erreicht</h2>
          <p className="text-muted-foreground mb-8">
            Du hast heute bereits {dailyAnalysesCount} von {DAILY_LIMIT_PREMIUM} Analysen verwendet. Morgen kannst du wieder analysieren!
          </p>
          
          <Card className="bg-gradient-to-br from-amber-500/20 via-amber-500/10 to-card border-amber-500/30 mb-6">
            <CardContent className="p-6">
              <Crown className="w-10 h-10 text-amber-500 mx-auto mb-4" />
              <h3 className="font-bold text-lg mb-2">Lifetime Upgrade</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Mit Lifetime hast du keine Tageslimits – unbegrenzte Analysen, für immer.
              </p>
              <ul className="text-sm text-muted-foreground space-y-2 text-left">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-amber-500" />
                  Unbegrenzte KI-Analysen
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-amber-500" />
                  Keine Tageslimits
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-amber-500" />
                  Einmalzahlung, kein Abo
                </li>
              </ul>
            </CardContent>
          </Card>
          
          <Link to="/pricing">
            <Button variant="hero" size="lg" className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700">
              <Crown className="w-5 h-5" />
              Auf Lifetime upgraden
            </Button>
          </Link>
          
          <button 
            onClick={() => navigate("/dashboard")}
            className="mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Zurück zum Dashboard
          </button>
        </main>
      </div>
    );
  }

  // Native mobile layout
  if (isNative) {
    return (
      <MobileAppLayout title="KI-Analyse" showLogo={false} showBack>
        <MobileUploadContent
          photos={photos}
          isUploading={isUploading}
          isPremium={isPremium}
          onAddPhoto={addPhoto}
          onRemovePhoto={removePhoto}
          onUpload={uploadPhotos}
        />
      </MobileAppLayout>
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
          <h1 className="text-lg font-bold">KI-Analyse</h1>
          <PhotoGuidelinesModal 
            trigger={
              <button className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
                <HelpCircle className="w-5 h-5" />
              </button>
            }
          />
        </div>
      </header>

      {/* Free user info banner */}
      {!isPremium && (
        <div className="container mx-auto px-4 pt-4 max-w-2xl">
          <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-primary flex-shrink-0" />
            <p className="text-sm">
              <span className="font-medium">Kostenlose Analyse:</span>{" "}
              Du erhältst deinen Looks Score (ohne Details).
            </p>
          </div>
        </div>
      )}

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Photo Tutorial */}
        <PhotoTutorial className="mb-6" />

        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {photoTypes.map((type, index) => {
            const hasPhoto = getPhotoForType(type.id);
            return (
              <div key={type.id} className="flex items-center">
                <motion.button
                  onClick={() => setActiveType(type.id)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                    hasPhoto 
                      ? "bg-primary text-primary-foreground" 
                      : activeType === type.id
                        ? "bg-primary/20 text-primary border-2 border-primary"
                        : "bg-card text-muted-foreground border border-border"
                  )}
                >
                  {hasPhoto ? (
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    >
                      <Check className="w-5 h-5" />
                    </motion.div>
                  ) : (
                    index + 1
                  )}
                </motion.button>
                {index < photoTypes.length - 1 && (
                  <motion.div 
                    className={cn(
                      "w-8 h-0.5 mx-1 origin-left",
                      hasPhoto ? "bg-primary" : "bg-border"
                    )}
                    initial={hasPhoto ? { scaleX: 0 } : {}}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.3 }}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Photo type selector */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {photoTypes.map((type, index) => {
            const photo = getPhotoForType(type.id);
            const Icon = type.icon;
            return (
              <motion.button
                key={type.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveType(type.id)}
                className={cn(
                  "relative p-3 rounded-xl border-2 transition-all text-left",
                  activeType === type.id
                    ? "border-primary bg-primary/10"
                    : photo
                      ? "border-primary/50 bg-primary/5"
                      : "border-border bg-card hover:border-muted-foreground"
                )}
              >
                <AnimatePresence>
                  {photo && (
                    <motion.div 
                      className="absolute top-2 right-2"
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0, rotate: 180 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <Check className="w-4 h-4 text-primary" />
                    </motion.div>
                  )}
                </AnimatePresence>
                <Icon className={cn(
                  "w-5 h-5 mb-1",
                  activeType === type.id ? "text-primary" : "text-muted-foreground"
                )} />
                <p className="font-medium text-sm">{type.label}</p>
                <p className="text-xs text-muted-foreground">{type.description}</p>
              </motion.button>
            );
          })}
        </div>

        {/* Upload area */}
        <Card className="border-2 border-dashed border-border bg-card/50 overflow-hidden">
          <CardContent className="p-0">
            {getPhotoForType(activeType) ? (
              <div className="relative aspect-[3/4]">
                <img
                  src={getPhotoForType(activeType)!.preview}
                  alt={`${activeType} Foto`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <button
                  onClick={() => removePhoto(activeType)}
                  className="absolute top-4 right-4 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
                <div className="absolute bottom-4 left-4 right-4">
                  <p className="text-white font-medium">
                    {photoTypes.find(t => t.id === activeType)?.label}-Foto
                  </p>
                  <p className="text-white/70 text-sm">
                    Tippe auf X zum Entfernen
                  </p>
                </div>
              </div>
            ) : (
              <label
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={cn(
                  "flex flex-col items-center justify-center aspect-[3/4] cursor-pointer transition-all",
                  isDragging 
                    ? "bg-primary/10 border-primary" 
                    : "hover:bg-card"
                )}
              >
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileInput}
                  className="hidden"
                />
                <div className={cn(
                  "w-20 h-20 rounded-full flex items-center justify-center mb-4 transition-all",
                  isDragging ? "bg-primary/20" : "bg-muted"
                )}>
                  {isDragging ? (
                    <Upload className="w-8 h-8 text-primary animate-bounce" />
                  ) : (
                    <Camera className="w-8 h-8 text-muted-foreground" />
                  )}
                </div>
                <p className="text-foreground font-medium mb-1">
                  {photoTypes.find(t => t.id === activeType)?.label}-Foto hochladen
                </p>
                <p className="text-muted-foreground text-sm text-center px-8">
                  Drag & Drop oder klicke zum Auswählen
                </p>
                <p className="text-muted-foreground text-xs mt-2">
                  JPG, PNG oder WebP • Max. 5MB
                </p>
              </label>
            )}
          </CardContent>
        </Card>

        {/* Photo previews */}
        <AnimatePresence>
          {photos.length > 0 && (
            <motion.div 
              className="mt-6"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <p className="text-sm text-muted-foreground mb-3">Deine Fotos</p>
              <div className="flex gap-3">
                {photos.map((photo, index) => (
                  <motion.div 
                    key={photo.type}
                    initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    exit={{ opacity: 0, scale: 0.5, rotate: 10 }}
                    transition={{ delay: index * 0.1, type: "spring", stiffness: 300 }}
                    whileHover={{ scale: 1.05, y: -4 }}
                    onClick={() => setActiveType(photo.type)}
                    className={cn(
                      "relative w-16 h-20 rounded-lg overflow-hidden cursor-pointer border-2 transition-all shadow-lg",
                      activeType === photo.type ? "border-primary ring-2 ring-primary/30" : "border-transparent"
                    )}
                  >
                    <img
                      src={photo.preview}
                      alt={photo.type}
                      className="w-full h-full object-cover"
                    />
                    {/* Shimmer effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-shimmer" />
                    <motion.button
                      onClick={(e) => {
                        e.stopPropagation();
                        removePhoto(photo.type);
                      }}
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.8 }}
                      className="absolute top-1 right-1 p-0.5 rounded-full bg-black/50 backdrop-blur-sm"
                    >
                      <X className="w-3 h-3 text-white" />
                    </motion.button>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tips */}
        <div className="mt-8 p-4 rounded-xl bg-primary/5 border border-primary/20">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className="font-medium text-sm">Tipps für bessere Ergebnisse</p>
                <PhotoGuidelinesModal 
                  trigger={
                    <button className="text-xs text-primary hover:underline">
                      Alle Richtlinien
                    </button>
                  }
                />
              </div>
              <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                <li>• Gute Beleuchtung (Tageslicht ist ideal)</li>
                <li>• Neutraler Gesichtsausdruck</li>
                <li>• Haare aus dem Gesicht</li>
                <li>• Keine Filter oder Bearbeitung</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Submit button */}
        <Button
          onClick={uploadPhotos}
          disabled={photos.length === 0 || isUploading}
          variant="hero"
          size="xl"
          className="w-full mt-8"
        >
          {isUploading ? (
            <>
              <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              Wird hochgeladen...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Analyse starten
            </>
          )}
        </Button>

        <p className="text-center text-xs text-muted-foreground mt-4">
          Deine Fotos werden sicher gespeichert und nur für die Analyse verwendet
        </p>
      </main>
    </div>
  );
}
