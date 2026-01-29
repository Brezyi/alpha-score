import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCalorieCalculator, CalorieSettings } from "@/hooks/useCalorieCalculator";
import { Calculator, Flame, Target, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

const ACTIVITY_LEVELS = [
  { value: "sedentary", label: "Sitzend", desc: "Wenig/keine Bewegung" },
  { value: "light", label: "Leicht aktiv", desc: "1-3 Tage/Woche" },
  { value: "moderate", label: "Moderat aktiv", desc: "3-5 Tage/Woche" },
  { value: "active", label: "Sehr aktiv", desc: "6-7 Tage/Woche" },
  { value: "very_active", label: "Extrem aktiv", desc: "Athleten/körperliche Arbeit" }
];

const GOALS = [
  { value: "lose", label: "Abnehmen", icon: TrendingDown, color: "text-red-400" },
  { value: "maintain", label: "Halten", icon: Minus, color: "text-amber-400" },
  { value: "gain", label: "Zunehmen", icon: TrendingUp, color: "text-green-400" }
];

export function CalorieCalculator() {
  const { settings, loading, saveSettings, quickCalculate } = useCalorieCalculator();
  const [formData, setFormData] = useState<Partial<CalorieSettings>>({
    height_cm: null,
    current_weight_kg: null,
    target_weight_kg: null,
    birth_date: null,
    gender: null,
    activity_level: "moderate",
    goal_type: "maintain",
    weekly_goal_kg: 0.5
  });
  const [previewCalories, setPreviewCalories] = useState<{
    bmr: number;
    tdee: number;
    dailyCalories: number;
  } | null>(null);

  useEffect(() => {
    if (settings) {
      setFormData({
        height_cm: settings.height_cm,
        current_weight_kg: settings.current_weight_kg,
        target_weight_kg: settings.target_weight_kg,
        birth_date: settings.birth_date,
        gender: settings.gender,
        activity_level: settings.activity_level,
        goal_type: settings.goal_type,
        weekly_goal_kg: settings.weekly_goal_kg
      });
    }
  }, [settings]);

  const handleCalculate = () => {
    if (!formData.gender || !formData.current_weight_kg || !formData.height_cm || !formData.birth_date) {
      return;
    }

    const birthDate = new Date(formData.birth_date);
    const age = new Date().getFullYear() - birthDate.getFullYear();

    const result = quickCalculate(
      formData.gender as "male" | "female" | "other",
      formData.current_weight_kg,
      formData.height_cm,
      age,
      formData.activity_level || "moderate",
      formData.goal_type || "maintain",
      formData.weekly_goal_kg || 0.5
    );

    setPreviewCalories(result);
  };

  const handleSave = async () => {
    await saveSettings(formData);
  };

  if (loading) {
    return <Card className="animate-pulse"><CardContent className="h-96" /></Card>;
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Calculator className="h-5 w-5 text-primary" />
          Kalorienrechner
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Personal Info */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Geschlecht</Label>
            <Select
              value={formData.gender || ""}
              onValueChange={(v) => setFormData({ ...formData, gender: v as CalorieSettings["gender"] })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Wählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Männlich</SelectItem>
                <SelectItem value="female">Weiblich</SelectItem>
                <SelectItem value="other">Divers</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Geburtsdatum</Label>
            <Input
              type="date"
              value={formData.birth_date || ""}
              onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Größe (cm)</Label>
            <Input
              type="number"
              placeholder="175"
              value={formData.height_cm || ""}
              onChange={(e) => setFormData({ ...formData, height_cm: parseInt(e.target.value) || null })}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Gewicht (kg)</Label>
            <Input
              type="number"
              step="0.1"
              placeholder="75"
              value={formData.current_weight_kg || ""}
              onChange={(e) => setFormData({ ...formData, current_weight_kg: parseFloat(e.target.value) || null })}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Ziel (kg)</Label>
            <Input
              type="number"
              step="0.1"
              placeholder="70"
              value={formData.target_weight_kg || ""}
              onChange={(e) => setFormData({ ...formData, target_weight_kg: parseFloat(e.target.value) || null })}
            />
          </div>
        </div>

        {/* Activity Level */}
        <div className="space-y-2">
          <Label className="text-xs">Aktivitätslevel</Label>
          <Select
            value={formData.activity_level}
            onValueChange={(v) => setFormData({ ...formData, activity_level: v as CalorieSettings["activity_level"] })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ACTIVITY_LEVELS.map((level) => (
                <SelectItem key={level.value} value={level.value}>
                  <div>
                    <span>{level.label}</span>
                    <span className="text-xs text-muted-foreground ml-2">{level.desc}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Goal Type */}
        <div className="space-y-2">
          <Label className="text-xs">Ziel</Label>
          <div className="grid grid-cols-3 gap-2">
            {GOALS.map(({ value, label, icon: Icon, color }) => (
              <Button
                key={value}
                variant={formData.goal_type === value ? "default" : "outline"}
                size="sm"
                onClick={() => setFormData({ ...formData, goal_type: value as CalorieSettings["goal_type"] })}
                className="flex flex-col h-auto py-2"
              >
                <Icon className={cn("h-4 w-4 mb-1", formData.goal_type !== value && color)} />
                <span className="text-xs">{label}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Weekly Goal */}
        {formData.goal_type !== "maintain" && (
          <div className="space-y-2">
            <Label className="text-xs">Pro Woche: {formData.weekly_goal_kg || 0.5} kg</Label>
            <div className="grid grid-cols-4 gap-2">
              {[0.25, 0.5, 0.75, 1].map((val) => (
                <Button
                  key={val}
                  variant={formData.weekly_goal_kg === val ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFormData({ ...formData, weekly_goal_kg: val })}
                >
                  {val} kg
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Calculate Button */}
        <Button className="w-full" onClick={handleCalculate}>
          <Calculator className="h-4 w-4 mr-2" />
          Berechnen
        </Button>

        {/* Results */}
        {(previewCalories || settings?.calculated_daily_calories) && (
          <div className="space-y-3 pt-2">
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Grundumsatz</p>
                <p className="font-bold">{previewCalories?.bmr || settings?.calculated_bmr}</p>
                <p className="text-xs text-muted-foreground">kcal</p>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Gesamtumsatz</p>
                <p className="font-bold">{previewCalories?.tdee || settings?.calculated_tdee}</p>
                <p className="text-xs text-muted-foreground">kcal</p>
              </div>
              <div className="text-center p-3 bg-primary/10 rounded-lg border border-primary/20">
                <p className="text-xs text-primary mb-1">Dein Ziel</p>
                <div className="flex items-center justify-center gap-1">
                  <Flame className="h-4 w-4 text-primary" />
                  <p className="font-bold text-lg">{previewCalories?.dailyCalories || settings?.calculated_daily_calories}</p>
                </div>
                <p className="text-xs text-muted-foreground">kcal/Tag</p>
              </div>
            </div>

            <Button variant="outline" className="w-full" onClick={handleSave}>
              <Target className="h-4 w-4 mr-2" />
              Als Ziel speichern
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
