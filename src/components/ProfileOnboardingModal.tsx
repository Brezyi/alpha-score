import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { User, MapPin, ArrowRight, Sparkles, Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const REGIONS = [
  { value: "westeuropa", label: "Westeuropa" },
  { value: "osteuropa", label: "Osteuropa" },
  { value: "nordeuropa", label: "Nordeuropa" },
  { value: "suedeuropa", label: "Südeuropa" },
  { value: "naher-osten", label: "Naher Osten" },
  { value: "nordafrika", label: "Nordafrika" },
  { value: "subsahara-afrika", label: "Subsahara-Afrika" },
  { value: "suedasien", label: "Südasien" },
  { value: "suedostasien", label: "Südostasien" },
  { value: "ostasien", label: "Ostasien" },
  { value: "zentralasien", label: "Zentralasien" },
  { value: "nordamerika", label: "Nordamerika" },
  { value: "lateinamerika", label: "Lateinamerika" },
  { value: "ozeanien", label: "Ozeanien" },
] as const;

interface ProfileOnboardingModalProps {
  open: boolean;
  onComplete: (data: { gender: "male" | "female"; country: string }) => void;
}

export function ProfileOnboardingModal({ open, onComplete }: ProfileOnboardingModalProps) {
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [gender, setGender] = useState<"male" | "female" | null>(null);
  const [region, setRegion] = useState("");

  const handleGenderSelect = (selectedGender: "male" | "female") => {
    setGender(selectedGender);
    setStep(2);
  };

  const handleComplete = () => {
    if (gender && region) {
      const selectedRegion = REGIONS.find(r => r.value === region);
      onComplete({ gender, country: selectedRegion?.label || region });
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" hideCloseButton>
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <DialogTitle>
              {step === 0 ? "Willkommen!" : "Kurze Fragen für bessere Ergebnisse"}
            </DialogTitle>
          </div>
          <DialogDescription>
            {step === 0 
              ? "Lass uns dein Profil personalisieren – dauert nur 30 Sekunden."
              : "Diese Infos helfen uns, deine Analyse präziser zu gestalten."
            }
          </DialogDescription>
        </DialogHeader>

        {step === 0 ? (
          /* Welcome / App Explanation Step */
          <div className="space-y-6 py-4">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Was ist diese App?</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Diese App analysiert deine Gesichtszüge mit KI und erstellt einen 
                  <span className="text-foreground font-medium"> personalisierten Plan</span>, 
                  um dein Aussehen zu optimieren – wissenschaftlich fundiert.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-primary">1</span>
                </div>
                <div>
                  <p className="text-sm font-medium">Fotos hochladen</p>
                  <p className="text-xs text-muted-foreground">Die KI analysiert deine Proportionen</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-primary">2</span>
                </div>
                <div>
                  <p className="text-sm font-medium">Score & Potential erhalten</p>
                  <p className="text-xs text-muted-foreground">Sieh dein aktuelles Level und was möglich ist</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-primary">3</span>
                </div>
                <div>
                  <p className="text-sm font-medium">Plan umsetzen</p>
                  <p className="text-xs text-muted-foreground">Konkrete Schritte für sichtbare Verbesserungen</p>
                </div>
              </div>
            </div>

            <Button onClick={() => setStep(1)} className="w-full gap-2" size="lg">
              Los geht's
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        ) : step === 1 ? (
          /* Gender Selection Step */
          <div className="space-y-6 py-4">
            <div className="text-center space-y-2">
              <User className="w-12 h-12 mx-auto text-primary" />
              <h3 className="text-lg font-semibold">Geschlecht</h3>
              <p className="text-sm text-muted-foreground">
                Bewertungskriterien unterscheiden sich je nach Geschlecht.
              </p>
            </div>

            {/* Context explanation */}
            <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20">
              <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">
                <span className="text-foreground font-medium">Warum?</span> Attraktivitätsmerkmale 
                werden unterschiedlich bewertet – z.B. Kieferlinie bei Männern vs. Gesichtsweichheit bei Frauen.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                size="lg"
                className={cn(
                  "h-24 flex-col gap-2 transition-all",
                  gender === "male" && "border-primary bg-primary/10"
                )}
                onClick={() => handleGenderSelect("male")}
              >
                <span className="text-2xl">♂️</span>
                <span>Mann</span>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className={cn(
                  "h-24 flex-col gap-2 transition-all",
                  gender === "female" && "border-primary bg-primary/10"
                )}
                onClick={() => handleGenderSelect("female")}
              >
                <span className="text-2xl">♀️</span>
                <span>Frau</span>
              </Button>
            </div>
          </div>
        ) : (
          /* Region Selection Step */
          <div className="space-y-6 py-4">
            <div className="text-center space-y-2">
              <MapPin className="w-12 h-12 mx-auto text-primary" />
              <h3 className="text-lg font-semibold">Region</h3>
              <p className="text-sm text-muted-foreground">
                Ethnische Merkmale beeinflussen die optimale Strategie.
              </p>
            </div>

            {/* Context explanation */}
            <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20">
              <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">
                <span className="text-foreground font-medium">Warum?</span> Die KI passt ihre 
                Empfehlungen an – z.B. Hautpflege, Haarstruktur und Gesichtszüge variieren je nach Herkunft.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="region">Wähle deine Region</Label>
                <Select value={region} onValueChange={setRegion}>
                  <SelectTrigger>
                    <SelectValue placeholder="Region auswählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    {REGIONS.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  onClick={() => setStep(1)}
                  className="flex-1"
                >
                  Zurück
                </Button>
                <Button
                  onClick={handleComplete}
                  disabled={!region}
                  className="flex-1 gap-2"
                >
                  Fertig
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
