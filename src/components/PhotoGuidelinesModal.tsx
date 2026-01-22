import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  HelpCircle, 
  Check, 
  X, 
  Sun, 
  Camera, 
  User,
  Glasses,
  Users,
  Smartphone,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";

interface GuidelineItem {
  icon: React.ElementType;
  label: string;
  description: string;
}

const goodExamples: GuidelineItem[] = [
  { 
    icon: User, 
    label: "Frontales Gesicht", 
    description: "Blick direkt in die Kamera" 
  },
  { 
    icon: Sun, 
    label: "Gute Beleuchtung", 
    description: "Natürliches Tageslicht ideal" 
  },
  { 
    icon: Camera, 
    label: "Scharfes Bild", 
    description: "Kein Verwackeln oder Unschärfe" 
  },
  { 
    icon: Sparkles, 
    label: "Neutraler Ausdruck", 
    description: "Entspanntes Gesicht" 
  },
];

const badExamples: GuidelineItem[] = [
  { 
    icon: Glasses, 
    label: "Sonnenbrille/Maske", 
    description: "Gesicht muss sichtbar sein" 
  },
  { 
    icon: Users, 
    label: "Gruppenfotos", 
    description: "Nur dein Gesicht im Bild" 
  },
  { 
    icon: Smartphone, 
    label: "Stark bearbeitet", 
    description: "Keine Filter oder Retusche" 
  },
  { 
    icon: Camera, 
    label: "Schlechte Qualität", 
    description: "Kein Zoom oder Pixelbild" 
  },
];

function GuidelineCard({ 
  item, 
  type 
}: { 
  item: GuidelineItem; 
  type: "good" | "bad";
}) {
  const Icon = item.icon;
  const isGood = type === "good";
  
  return (
    <div className={cn(
      "flex items-start gap-3 p-3 rounded-lg border",
      isGood 
        ? "bg-primary/5 border-primary/20" 
        : "bg-destructive/5 border-destructive/20"
    )}>
      <div className={cn(
        "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
        isGood ? "bg-primary/20" : "bg-destructive/20"
      )}>
        <Icon className={cn(
          "w-5 h-5",
          isGood ? "text-primary" : "text-destructive"
        )} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {isGood ? (
            <Check className="w-4 h-4 text-primary flex-shrink-0" />
          ) : (
            <X className="w-4 h-4 text-destructive flex-shrink-0" />
          )}
          <p className="font-medium text-sm">{item.label}</p>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          {item.description}
        </p>
      </div>
    </div>
  );
}

interface PhotoGuidelinesModalProps {
  trigger?: React.ReactNode;
}

export function PhotoGuidelinesModal({ trigger }: PhotoGuidelinesModalProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="icon" className="text-muted-foreground">
            <HelpCircle className="w-5 h-5" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-primary" />
            Foto-Richtlinien
          </DialogTitle>
          <DialogDescription>
            Für die beste Analyse-Qualität beachte diese Hinweise
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Good Examples */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                <Check className="w-4 h-4 text-primary" />
              </div>
              <h3 className="font-semibold text-primary">So sollte dein Foto aussehen</h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {goodExamples.map((item) => (
                <GuidelineCard key={item.label} item={item} type="good" />
              ))}
            </div>
          </div>

          {/* Bad Examples */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-full bg-destructive/20 flex items-center justify-center">
                <X className="w-4 h-4 text-destructive" />
              </div>
              <h3 className="font-semibold text-destructive">Diese Fotos werden abgelehnt</h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {badExamples.map((item) => (
                <GuidelineCard key={item.label} item={item} type="bad" />
              ))}
            </div>
          </div>

          {/* Visual Example */}
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-sm font-medium mb-3 text-center">Ideales Foto-Beispiel</p>
            <div className="flex justify-center gap-4">
              {/* Good example placeholder */}
              <div className="relative">
                <div className="w-24 h-32 rounded-lg bg-gradient-to-b from-muted to-muted/50 flex items-center justify-center border-2 border-primary">
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-full bg-muted-foreground/20 mx-auto mb-1 flex items-center justify-center">
                      <User className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <p className="text-[10px] text-muted-foreground">Frontal</p>
                  </div>
                </div>
                <div className="absolute -bottom-2 -right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                  <Check className="w-4 h-4 text-primary-foreground" />
                </div>
              </div>
              
              {/* Bad example placeholder */}
              <div className="relative">
                <div className="w-24 h-32 rounded-lg bg-gradient-to-b from-muted to-muted/50 flex items-center justify-center border-2 border-destructive/50 opacity-60">
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-full bg-muted-foreground/20 mx-auto mb-1 flex items-center justify-center">
                      <Glasses className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <p className="text-[10px] text-muted-foreground">Verdeckt</p>
                  </div>
                </div>
                <div className="absolute -bottom-2 -right-2 w-6 h-6 rounded-full bg-destructive flex items-center justify-center">
                  <X className="w-4 h-4 text-destructive-foreground" />
                </div>
              </div>
            </div>
          </div>

          {/* Additional Tips */}
          <div className="rounded-xl bg-primary/5 border border-primary/20 p-4">
            <p className="text-sm font-medium mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Pro-Tipps für beste Ergebnisse
            </p>
            <ul className="text-xs text-muted-foreground space-y-1.5">
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                Fotografiere bei Tageslicht am Fenster
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                Halte die Kamera auf Augenhöhe
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                Haare aus dem Gesicht streichen
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                Neutraler Hintergrund ohne Ablenkung
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                Seitenfoto: 90° Profil zeigen
              </li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
