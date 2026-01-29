import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useMealPlanner, MealPlan } from "@/hooks/useMealPlanner";
import { useRecipes } from "@/hooks/useRecipes";
import { Calendar, ChevronLeft, ChevronRight, Plus, Coffee, Sun, Moon, Cookie, Trash2 } from "lucide-react";
import { format, addDays, isSameDay } from "date-fns";
import { de } from "date-fns/locale";
import { cn } from "@/lib/utils";

const MEAL_TYPES: { type: MealPlan["meal_type"]; icon: typeof Coffee; label: string }[] = [
  { type: "breakfast", icon: Coffee, label: "Frühstück" },
  { type: "lunch", icon: Sun, label: "Mittagessen" },
  { type: "dinner", icon: Moon, label: "Abendessen" },
  { type: "snack", icon: Cookie, label: "Snack" }
];

export function MealPlanner() {
  const { 
    weekPlans, 
    loading, 
    selectedWeekStart,
    addMealPlan, 
    removeMealPlan,
    getMealsForDate,
    goToNextWeek,
    goToPrevWeek 
  } = useMealPlanner();
  const { recipes } = useRecipes();
  const [selectedDay, setSelectedDay] = useState(new Date());
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState<MealPlan["meal_type"]>("lunch");
  const [customMealName, setCustomMealName] = useState("");
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(selectedWeekStart, i));

  const handleAddMeal = async () => {
    if (!customMealName && !selectedRecipeId) return;

    await addMealPlan(
      selectedDay,
      selectedMealType,
      selectedRecipeId || undefined,
      customMealName || undefined
    );

    setAddDialogOpen(false);
    setCustomMealName("");
    setSelectedRecipeId(null);
  };

  if (loading) {
    return <Card className="animate-pulse"><CardContent className="h-64" /></Card>;
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Mahlzeitenplaner
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goToPrevWeek}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm min-w-[100px] text-center">
              {format(selectedWeekStart, "dd. MMM", { locale: de })} - {format(addDays(selectedWeekStart, 6), "dd. MMM", { locale: de })}
            </span>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goToNextWeek}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Week Days */}
        <div className="grid grid-cols-7 gap-1">
          {weekDays.map((day) => {
            const isSelected = isSameDay(day, selectedDay);
            const isToday = isSameDay(day, new Date());
            const meals = getMealsForDate(day);
            
            return (
              <Button
                key={day.toISOString()}
                variant={isSelected ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedDay(day)}
                className={cn(
                  "flex flex-col h-auto py-2",
                  isToday && !isSelected && "border-primary"
                )}
              >
                <span className="text-[10px] text-muted-foreground">
                  {format(day, "EEE", { locale: de })}
                </span>
                <span className="text-sm font-bold">{format(day, "d")}</span>
                {meals.length > 0 && (
                  <div className="flex gap-0.5 mt-1">
                    {meals.length > 3 ? (
                      <span className="text-[10px]">{meals.length}</span>
                    ) : (
                      meals.slice(0, 3).map((_, i) => (
                        <div key={i} className="w-1 h-1 rounded-full bg-primary" />
                      ))
                    )}
                  </div>
                )}
              </Button>
            );
          })}
        </div>

        {/* Selected Day Meals */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">
              {format(selectedDay, "EEEE, dd. MMMM", { locale: de })}
            </h4>
            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="gap-1">
                  <Plus className="h-3 w-3" />
                  Hinzufügen
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Mahlzeit planen</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  {/* Meal Type */}
                  <div className="grid grid-cols-4 gap-2">
                    {MEAL_TYPES.map(({ type, icon: Icon, label }) => (
                      <Button
                        key={type}
                        variant={selectedMealType === type ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedMealType(type)}
                        className="flex flex-col h-auto py-2"
                      >
                        <Icon className="h-4 w-4 mb-1" />
                        <span className="text-[10px]">{label}</span>
                      </Button>
                    ))}
                  </div>

                  {/* Custom Meal or Recipe */}
                  <div className="space-y-2">
                    <Input
                      placeholder="Eigene Mahlzeit eingeben..."
                      value={customMealName}
                      onChange={(e) => {
                        setCustomMealName(e.target.value);
                        setSelectedRecipeId(null);
                      }}
                    />
                    <p className="text-xs text-center text-muted-foreground">oder aus Rezepten wählen</p>
                    <div className="max-h-40 overflow-y-auto space-y-1">
                      {recipes.slice(0, 10).map((recipe) => (
                        <Button
                          key={recipe.id}
                          variant={selectedRecipeId === recipe.id ? "secondary" : "ghost"}
                          size="sm"
                          className="w-full justify-start text-sm"
                          onClick={() => {
                            setSelectedRecipeId(recipe.id);
                            setCustomMealName("");
                          }}
                        >
                          {recipe.name}
                          {recipe.calories_per_serving && (
                            <span className="ml-auto text-xs text-muted-foreground">
                              {recipe.calories_per_serving} kcal
                            </span>
                          )}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <Button 
                    className="w-full" 
                    onClick={handleAddMeal}
                    disabled={!customMealName && !selectedRecipeId}
                  >
                    Planen
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Meals List */}
          <div className="space-y-2">
            {MEAL_TYPES.map(({ type, icon: Icon, label }) => {
              const meals = getMealsForDate(selectedDay, type);
              return (
                <div key={type} className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Icon className="h-3 w-3" />
                    {label}
                  </div>
                  {meals.length === 0 ? (
                    <p className="text-xs text-muted-foreground/50 pl-5">Keine Mahlzeit geplant</p>
                  ) : (
                    meals.map((meal) => (
                      <div
                        key={meal.id}
                        className="flex items-center justify-between p-2 bg-muted/50 rounded-lg ml-5"
                      >
                        <span className="text-sm">
                          {meal.recipe?.name || meal.custom_meal_name}
                        </span>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={() => removeMealPlan(meal.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
