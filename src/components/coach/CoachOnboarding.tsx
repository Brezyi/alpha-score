import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { User, MapPin, ArrowRight } from "lucide-react";

interface CoachOnboardingProps {
  onComplete: (data: { gender: "male" | "female"; country: string }) => void;
}

export function CoachOnboarding({ onComplete }: CoachOnboardingProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [gender, setGender] = useState<"male" | "female" | null>(null);
  const [country, setCountry] = useState("");

  const handleGenderSelect = (selectedGender: "male" | "female") => {
    setGender(selectedGender);
    setStep(2);
  };

  const handleComplete = () => {
    if (gender && country.trim()) {
      onComplete({ gender, country: country.trim() });
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
      <Card className="w-full max-w-md p-6 space-y-6 bg-card/80 backdrop-blur border-border">
        {step === 1 ? (
          <>
            <div className="text-center space-y-2">
              <User className="w-12 h-12 mx-auto text-primary" />
              <h2 className="text-xl font-bold">Geschlecht</h2>
              <p className="text-sm text-muted-foreground">
                Für eine präzisere Bewertung brauche ich diese Info.
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
          </>
        ) : (
          <>
            <div className="text-center space-y-2">
              <MapPin className="w-12 h-12 mx-auto text-primary" />
              <h2 className="text-xl font-bold">Herkunft</h2>
              <p className="text-sm text-muted-foreground">
                Ethnische Merkmale beeinflussen die optimale Strategie.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="country">Land / Region</Label>
                <Input
                  id="country"
                  placeholder="z.B. Deutschland, Türkei, Korea..."
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && country.trim()) {
                      handleComplete();
                    }
                  }}
                  autoFocus
                />
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
                  disabled={!country.trim()}
                  className="flex-1 gap-2"
                >
                  Weiter
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
