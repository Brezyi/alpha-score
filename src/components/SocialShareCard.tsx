import { useState } from "react";
import { Share2, Download, Copy, Check, Instagram, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface SocialShareCardProps {
  score: number;
  potentialScore?: number | null;
  displayName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SocialShareCard({ score, potentialScore, displayName, open, onOpenChange }: SocialShareCardProps) {
  const [copied, setCopied] = useState(false);

  const shareText = `🔥 Mein GLOWMAXXED Score: ${score.toFixed(1)}/10${potentialScore ? ` (Potenzial: ${potentialScore.toFixed(1)})` : ""}! Starte deine eigene Transformation! 💪`;
  const shareUrl = window.location.origin;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      setCopied(true);
      toast.success("In Zwischenablage kopiert!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Kopieren fehlgeschlagen");
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "GLOWMAXXED Score",
          text: shareText,
          url: shareUrl,
        });
      } catch {
        // User cancelled
      }
    } else {
      handleCopy();
    }
  };

  const handleWhatsApp = () => {
    const encoded = encodeURIComponent(`${shareText}\n${shareUrl}`);
    window.location.href = `whatsapp://send?text=${encoded}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ergebnis teilen</DialogTitle>
          <DialogDescription>Teile deinen Score mit Freunden</DialogDescription>
        </DialogHeader>

        {/* Preview Card */}
        <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-background via-card to-primary/10 border border-border p-6 text-center space-y-4">
          <div className="text-xs text-muted-foreground uppercase tracking-widest">GLOWMAXXED AI Score</div>
          <div className="text-6xl font-black text-primary">{score.toFixed(1)}</div>
          <div className="text-sm text-muted-foreground">von 10</div>
          {potentialScore && (
            <div className="flex items-center justify-center gap-2 text-sm">
              <span className="text-muted-foreground">Potenzial:</span>
              <span className="font-bold text-primary">{potentialScore.toFixed(1)}</span>
            </div>
          )}
          <div className="text-xs text-muted-foreground">{displayName}</div>
        </div>

        {/* Share Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" className="gap-2" onClick={handleWhatsApp}>
            <MessageCircle className="w-4 h-4 text-green-500" />
            WhatsApp
          </Button>
          <Button variant="outline" className="gap-2" onClick={handleCopy}>
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            {copied ? "Kopiert!" : "Kopieren"}
          </Button>
        </div>
        
        {navigator.share && (
          <Button className="w-full gap-2" onClick={handleNativeShare}>
            <Share2 className="w-4 h-4" />
            Teilen
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}
