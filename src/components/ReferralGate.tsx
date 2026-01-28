import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useReferral } from "@/hooks/useReferral";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, 
  Copy, 
  Share2, 
  Check, 
  Lock, 
  Sparkles,
  Gift,
  ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ReferralGateProps {
  onUnlocked?: () => void;
}

export function ReferralGate({ onUnlocked }: ReferralGateProps) {
  const { toast } = useToast();
  const { 
    referralCode, 
    referralCount, 
    requiredReferrals, 
    hasEnoughReferrals,
    loading,
    copyShareLink,
    getShareLink 
  } = useReferral();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const success = await copyShareLink();
    if (success) {
      setCopied(true);
      toast({
        title: "Link kopiert!",
        description: "Teile den Link mit deinen Freunden.",
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    const shareLink = getShareLink();
    if (shareLink && navigator.share) {
      try {
        await navigator.share({
          title: "Probier diese App aus!",
          text: "Analysiere dein Gesicht mit KI und entdecke dein volles Potenzial!",
          url: shareLink,
        });
      } catch (error) {
        // User cancelled or share failed - fallback to copy
        handleCopy();
      }
    } else {
      handleCopy();
    }
  };

  // Check if unlocked
  if (hasEnoughReferrals) {
    onUnlocked?.();
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const progress = (referralCount / requiredReferrals) * 100;
  const remaining = requiredReferrals - referralCount;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-primary/5 rounded-full blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 4, repeat: Infinity }}
        />
        <motion.div 
          className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-primary/10 rounded-full blur-3xl"
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.5, 0.3, 0.5] }}
          transition={{ duration: 4, repeat: Infinity }}
        />
      </div>

      <motion.div 
        className="max-w-md w-full relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Lock Icon */}
        <motion.div 
          className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center"
          animate={{ 
            boxShadow: [
              "0 0 0 0 hsl(var(--primary) / 0)",
              "0 0 30px 10px hsl(var(--primary) / 0.2)",
              "0 0 0 0 hsl(var(--primary) / 0)"
            ]
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Lock className="w-10 h-10 text-primary" />
        </motion.div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-center mb-2">
          Analyse abgeschlossen! 🎉
        </h1>
        <p className="text-muted-foreground text-center mb-6">
          Lade {remaining} {remaining === 1 ? "Freund" : "Freunde"} ein, um dein Ergebnis freizuschalten
        </p>

        {/* Progress Card */}
        <Card className="mb-6 bg-card/50 backdrop-blur-sm border-primary/20">
          <CardContent className="p-6">
            {/* Progress indicators */}
            <div className="flex justify-center gap-3 mb-4">
              {[...Array(requiredReferrals)].map((_, i) => (
                <motion.div
                  key={i}
                  className={cn(
                    "w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all",
                    i < referralCount 
                      ? "bg-primary border-primary text-primary-foreground" 
                      : "border-border bg-muted/50"
                  )}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: i * 0.1, type: "spring" }}
                >
                  {i < referralCount ? (
                    <Check className="w-6 h-6" />
                  ) : (
                    <Users className="w-5 h-5 text-muted-foreground" />
                  )}
                </motion.div>
              ))}
            </div>

            {/* Progress bar */}
            <div className="h-2 bg-muted rounded-full overflow-hidden mb-3">
              <motion.div 
                className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>

            <p className="text-center text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{referralCount}</span> von {requiredReferrals} Freunden eingeladen
            </p>
          </CardContent>
        </Card>

        {/* Share Section */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Gift className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Dein Einladungslink</h3>
                <p className="text-xs text-muted-foreground">Teile diesen Link mit Freunden</p>
              </div>
            </div>

            {/* Link display */}
            <div className="flex gap-2 mb-4">
              <Input 
                value={getShareLink() || ""} 
                readOnly 
                className="text-xs bg-muted/50"
              />
              <Button 
                variant="outline" 
                size="icon"
                onClick={handleCopy}
                className="shrink-0"
              >
                {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>

            {/* Share buttons */}
            <div className="grid grid-cols-2 gap-3">
              <Button onClick={handleCopy} variant="outline" className="gap-2">
                <Copy className="w-4 h-4" />
                Link kopieren
              </Button>
              <Button onClick={handleShare} variant="hero" className="gap-2">
                <Share2 className="w-4 h-4" />
                Teilen
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Info */}
        <motion.div 
          className="flex items-start gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium mb-1">Warum Freunde einladen?</p>
            <p className="text-muted-foreground">
              Sobald {requiredReferrals} deiner Freunde sich registrieren, wird dein Analyse-Ergebnis 
              automatisch freigeschaltet – kostenlos!
            </p>
          </div>
        </motion.div>

        {/* Referral code display */}
        {referralCode && (
          <p className="text-center text-xs text-muted-foreground mt-4">
            Dein Code: <span className="font-mono font-bold text-foreground">{referralCode}</span>
          </p>
        )}
      </motion.div>
    </div>
  );
}
