import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNutrition, MealEntry } from "@/hooks/useNutrition";
import { 
  UtensilsCrossed, 
  Plus, 
  Trash2, 
  Apple, 
  Beef, 
  Wheat, 
  Droplet,
  Coffee,
  Sun,
  Moon,
  Cookie
} from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { cn } from "@/lib/utils";

const MEAL_ICONS = {
  breakfast: Coffee,
  lunch: Sun,
  dinner: Moon,
  snack: Cookie,
};

const MEAL_LABELS = {
  breakfast: "Frühstück",
  lunch: "Mittagessen",
  dinner: "Abendessen",
  snack: "Snack",
};

export function NutritionTracker() {
  const {
    meals,
    goals,
    dailyTotals,
    loading,
    selectedDate,
    addMeal,
    deleteMeal,
    getMealsByType,
  } = useNutrition();

  const [showAddForm, setShowAddForm] = useState(false);
  const [mealType, setMealType] = useState<MealEntry["meal_type"]>("breakfast");
  const [formData, setFormData] = useState({
    food_name: "",
    calories: "",
    protein_g: "",
    carbs_g: "",
    fat_g: "",
  });

  const handleSubmit = async () => {
    if (!formData.food_name) return;

    await addMeal({
      entry_date: format(selectedDate, "yyyy-MM-dd"),
      meal_type: mealType,
      food_name: formData.food_name,
      calories: formData.calories ? parseInt(formData.calories) : null,
      protein_g: formData.protein_g ? parseFloat(formData.protein_g) : null,
      carbs_g: formData.carbs_g ? parseFloat(formData.carbs_g) : null,
      fat_g: formData.fat_g ? parseFloat(formData.fat_g) : null,
      fiber_g: null,
      barcode: null,
      serving_size: null,
      notes: null,
    });

    setFormData({ food_name: "", calories: "", protein_g: "", carbs_g: "", fat_g: "" });
    setShowAddForm(false);
  };

  const macroData = [
    {
      label: "Kalorien",
      current: dailyTotals.calories,
      goal: goals.daily_calories,
      unit: "kcal",
      color: "bg-orange-500",
      icon: Apple,
    },
    {
      label: "Protein",
      current: dailyTotals.protein,
      goal: goals.daily_protein_g,
      unit: "g",
      color: "bg-red-500",
      icon: Beef,
    },
    {
      label: "Carbs",
      current: dailyTotals.carbs,
      goal: goals.daily_carbs_g,
      unit: "g",
      color: "bg-amber-500",
      icon: Wheat,
    },
    {
      label: "Fett",
      current: dailyTotals.fat,
      goal: goals.daily_fat_g,
      unit: "g",
      color: "bg-blue-500",
      icon: Droplet,
    },
  ];

  if (loading) {
    return <Card className="animate-pulse"><CardContent className="h-64" /></Card>;
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <UtensilsCrossed className="h-5 w-5 text-primary" />
            Ernährung
          </CardTitle>
          <span className="text-sm text-muted-foreground">
            {format(selectedDate, "EEEE, dd. MMM", { locale: de })}
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Macro Overview */}
        <div className="grid grid-cols-2 gap-3">
          {macroData.map((macro) => {
            const percent = Math.min(100, (macro.current / macro.goal) * 100);
            const Icon = macro.icon;
            return (
              <div key={macro.label} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1">
                    <Icon className="h-3 w-3" />
                    {macro.label}
                  </span>
                  <span className="text-muted-foreground">
                    {Math.round(macro.current)}/{macro.goal}{macro.unit}
                  </span>
                </div>
                <Progress 
                  value={percent} 
                  className={cn("h-2", `[&>div]:${macro.color}`)}
                />
              </div>
            );
          })}
        </div>

        {/* Meals by Type */}
        <Tabs defaultValue="breakfast" className="w-full">
          <TabsList className="grid w-full grid-cols-4 h-auto">
            {(["breakfast", "lunch", "dinner", "snack"] as const).map((type) => {
              const Icon = MEAL_ICONS[type];
              const typeMeals = getMealsByType(type);
              return (
                <TabsTrigger
                  key={type}
                  value={type}
                  className="flex flex-col gap-0.5 py-2"
                  onClick={() => setMealType(type)}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-xs">{typeMeals.length > 0 && `(${typeMeals.length})`}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {(["breakfast", "lunch", "dinner", "snack"] as const).map((type) => (
            <TabsContent key={type} value={type} className="space-y-2 mt-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{MEAL_LABELS[type]}</span>
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={() => {
                    setMealType(type);
                    setShowAddForm(true);
                  }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {getMealsByType(type).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Noch keine Einträge
                </p>
              ) : (
                <div className="space-y-2">
                  {getMealsByType(type).map((meal) => (
                    <div
                      key={meal.id}
                      className="flex items-center justify-between p-2 bg-muted/50 rounded-lg"
                    >
                      <div>
                        <p className="text-sm font-medium">{meal.food_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {meal.calories && `${meal.calories} kcal`}
                          {meal.protein_g && ` · ${meal.protein_g}g P`}
                          {meal.carbs_g && ` · ${meal.carbs_g}g C`}
                          {meal.fat_g && ` · ${meal.fat_g}g F`}
                        </p>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => deleteMeal(meal.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>

        {/* Add Form */}
        {showAddForm && (
          <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
            <div className="flex items-center justify-between">
              <Label className="font-medium">{MEAL_LABELS[mealType]} hinzufügen</Label>
              <Button size="sm" variant="ghost" onClick={() => setShowAddForm(false)}>
                ✕
              </Button>
            </div>

            <Input
              placeholder="Lebensmittel Name"
              value={formData.food_name}
              onChange={(e) => setFormData({ ...formData, food_name: e.target.value })}
            />

            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                placeholder="Kalorien"
                value={formData.calories}
                onChange={(e) => setFormData({ ...formData, calories: e.target.value })}
              />
              <Input
                type="number"
                placeholder="Protein (g)"
                value={formData.protein_g}
                onChange={(e) => setFormData({ ...formData, protein_g: e.target.value })}
              />
              <Input
                type="number"
                placeholder="Carbs (g)"
                value={formData.carbs_g}
                onChange={(e) => setFormData({ ...formData, carbs_g: e.target.value })}
              />
              <Input
                type="number"
                placeholder="Fett (g)"
                value={formData.fat_g}
                onChange={(e) => setFormData({ ...formData, fat_g: e.target.value })}
              />
            </div>

            <Button className="w-full" onClick={handleSubmit} disabled={!formData.food_name}>
              Hinzufügen
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
