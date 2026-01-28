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

  const handleWhatsApp = () => {
    const shareLink = getShareLink();
    if (shareLink) {
      const text = encodeURIComponent(`Hey! Schau dir diese App an – analysiere dein Gesicht mit KI und entdecke dein Potenzial! 🔥\n\n${shareLink}`);
      window.open(`https://wa.me/?text=${text}`, '_blank');
    }
  };

  const handleTelegram = () => {
    const shareLink = getShareLink();
    if (shareLink) {
      const text = encodeURIComponent("Hey! Schau dir diese App an – analysiere dein Gesicht mit KI!");
      const url = encodeURIComponent(shareLink);
      window.open(`https://t.me/share/url?url=${url}&text=${text}`, '_blank');
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

        {/* Referral code display */}
        {referralCode && (
          <div className="text-center mb-6 p-4 rounded-xl bg-primary/5 border border-primary/20">
            <p className="text-xs text-muted-foreground mb-2">Dein Code</p>
            <code className="text-3xl font-bold tracking-[0.3em] text-primary">
              {referralCode}
            </code>
          </div>
        )}

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
            <div className="grid grid-cols-2 gap-3 mb-4">
              <Button onClick={handleCopy} variant="outline" className="gap-2">
                <Copy className="w-4 h-4" />
                Link kopieren
              </Button>
              <Button onClick={handleShare} variant="hero" className="gap-2">
                <Share2 className="w-4 h-4" />
                Teilen
              </Button>
            </div>

            {/* WhatsApp & Telegram */}
            <div className="grid grid-cols-2 gap-3">
              <Button 
                onClick={handleWhatsApp} 
                className="gap-2 bg-[#25D366] hover:bg-[#20BD5A] text-white"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                WhatsApp
              </Button>
              <Button 
                onClick={handleTelegram} 
                className="gap-2 bg-[#0088cc] hover:bg-[#0077b5] text-white"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                </svg>
                Telegram
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
      </motion.div>
    </div>
  );
}
