import { useState, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useMood } from "@/hooks/useMood";
import { 
  Smile, 
  Meh, 
  Frown, 
  Zap, 
  Brain,
  AlertCircle,
  Check,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const MOOD_OPTIONS = [
  { value: 1, icon: Frown, label: "Schlecht", color: "text-red-500" },
  { value: 2, icon: Frown, label: "Nicht gut", color: "text-orange-500" },
  { value: 3, icon: Meh, label: "Okay", color: "text-yellow-500" },
  { value: 4, icon: Smile, label: "Gut", color: "text-lime-500" },
  { value: 5, icon: Smile, label: "Super", color: "text-green-500" },
];

const ENERGY_OPTIONS = [
  { value: 1, label: "Erschöpft" },
  { value: 2, label: "Müde" },
  { value: 3, label: "Normal" },
  { value: 4, label: "Energisch" },
  { value: 5, label: "Voller Energie" },
];

const STRESS_OPTIONS = [
  { value: 1, label: "Entspannt" },
  { value: 2, label: "Leicht gestresst" },
  { value: 3, label: "Moderat" },
  { value: 4, label: "Gestresst" },
  { value: 5, label: "Sehr gestresst" },
];

export function MoodTracker() {
  const { 
    todayEntry, 
    symptomsList, 
    saveMoodEntry, 
    toggleSymptom,
    loading 
  } = useMood();
  
  const [notes, setNotes] = useState(todayEntry?.notes || "");
  const [saving, setSaving] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleValueChange = useCallback(async (field: string, value: number | string | string[]) => {
    setSaving(true);
    await saveMoodEntry({ [field]: value });
    setSaving(false);
    setShowSaved(true);
    setTimeout(() => setShowSaved(false), 2000);
  }, [saveMoodEntry]);

  const handleNotesChange = useCallback((value: string) => {
    setNotes(value);
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(async () => {
      setSaving(true);
      await saveMoodEntry({ notes: value });
      setSaving(false);
      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 2000);
    }, 1000);
  }, [saveMoodEntry]);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Smile className="h-5 w-5 text-primary" />
          Stimmung & Wohlbefinden
          <AnimatePresence>
            {saving && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="ml-auto"
              >
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              </motion.span>
            )}
            {showSaved && !saving && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="ml-auto flex items-center gap-1 text-xs text-green-500 font-normal"
              >
                <Check className="w-3 h-3" />
                Gespeichert
              </motion.span>
            )}
          </AnimatePresence>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Mood Score */}
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Smile className="w-4 h-4" />
            Wie fühlst du dich heute?
          </Label>
          <div className="flex justify-between gap-2">
            {MOOD_OPTIONS.map((option) => {
              const Icon = option.icon;
              const isSelected = todayEntry?.mood_score === option.value;
              return (
                <button
                  key={option.value}
                  onClick={() => handleValueChange("mood_score", option.value)}
                  className={cn(
                    "flex flex-col items-center gap-1 p-3 rounded-lg border transition-all flex-1",
                    isSelected
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50 hover:bg-muted/50"
                  )}
                >
                  <Icon className={cn("w-6 h-6", option.color)} />
                  <span className="text-[10px] text-muted-foreground">{option.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Energy Level */}
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Energielevel
          </Label>
          <div className="flex gap-2 flex-wrap">
            {ENERGY_OPTIONS.map((option) => (
              <Button
                key={option.value}
                variant={todayEntry?.energy_level === option.value ? "default" : "outline"}
                size="sm"
                onClick={() => handleValueChange("energy_level", option.value)}
                className="text-xs"
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Stress Level */}
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Brain className="w-4 h-4" />
            Stresslevel
          </Label>
          <div className="flex gap-2 flex-wrap">
            {STRESS_OPTIONS.map((option) => (
              <Button
                key={option.value}
                variant={todayEntry?.stress_level === option.value ? "default" : "outline"}
                size="sm"
                onClick={() => handleValueChange("stress_level", option.value)}
                className="text-xs"
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Symptoms */}
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Symptome (optional)
          </Label>
          <div className="flex gap-2 flex-wrap">
            {symptomsList.map((symptom) => {
              const isSelected = todayEntry?.symptoms?.includes(symptom);
              return (
                <Badge
                  key={symptom}
                  variant={isSelected ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleSymptom(symptom)}
                >
                  {symptom}
                </Badge>
              );
            })}
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Notizen</Label>
          <Textarea
            placeholder="Wie war dein Tag? Was beschäftigt dich?"
            value={notes}
            onChange={(e) => handleNotesChange(e.target.value)}
            rows={3}
          />
        </div>
      </CardContent>
    </Card>
  );
}
