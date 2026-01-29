import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useFoodDatabase, FoodItem } from "@/hooks/useFoodDatabase";
import { useNutrition } from "@/hooks/useNutrition";
import { Search, Plus, Loader2, Barcode, Check } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface FoodSearchProps {
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
  onAdd?: () => void;
}

export function FoodSearch({ mealType, onAdd }: FoodSearchProps) {
  const { foods, loading, searchFoods, searchByBarcode } = useFoodDatabase();
  const { addMeal, selectedDate } = useNutrition();
  const [query, setQuery] = useState("");
  const [addingId, setAddingId] = useState<string | null>(null);
  const [servingSize, setServingSize] = useState<Record<string, number>>({});
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (debouncedQuery) {
      searchFoods(debouncedQuery);
    }
  }, [debouncedQuery, searchFoods]);

  const handleAdd = async (food: FoodItem) => {
    setAddingId(food.id);
    const serving = servingSize[food.id] || 100;
    const multiplier = serving / 100;

    await addMeal({
      entry_date: format(selectedDate, "yyyy-MM-dd"),
      meal_type: mealType,
      food_name: food.name + (food.brand ? ` (${food.brand})` : ""),
      calories: food.calories_per_100g ? Math.round(food.calories_per_100g * multiplier) : null,
      protein_g: food.protein_per_100g ? Math.round(food.protein_per_100g * multiplier * 10) / 10 : null,
      carbs_g: food.carbs_per_100g ? Math.round(food.carbs_per_100g * multiplier * 10) / 10 : null,
      fat_g: food.fat_per_100g ? Math.round(food.fat_per_100g * multiplier * 10) / 10 : null,
      fiber_g: food.fiber_per_100g ? Math.round(food.fiber_per_100g * multiplier * 10) / 10 : null,
      barcode: food.barcode,
      serving_size: `${serving}g`,
      notes: null
    });

    setAddingId(null);
    setQuery("");
    onAdd?.();
  };

  return (
    <div className="space-y-3">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Lebensmittel suchen..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin" />
        )}
      </div>

      {/* Results */}
      {foods.length > 0 && (
        <div className="max-h-64 overflow-y-auto space-y-2">
          {foods.map((food) => (
            <div
              key={food.id}
              className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium truncate">{food.name}</p>
                  {food.is_verified && (
                    <Check className="h-3 w-3 text-green-500 shrink-0" />
                  )}
                </div>
                {food.brand && (
                  <p className="text-xs text-muted-foreground">{food.brand}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  {food.calories_per_100g} kcal · 
                  P {food.protein_per_100g}g · 
                  C {food.carbs_per_100g}g · 
                  F {food.fat_per_100g}g
                  <span className="opacity-50"> / 100g</span>
                </p>
              </div>

              {/* Serving Size */}
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  className="w-16 h-8 text-xs text-center"
                  value={servingSize[food.id] || 100}
                  onChange={(e) => setServingSize(prev => ({
                    ...prev,
                    [food.id]: parseInt(e.target.value) || 100
                  }))}
                />
                <span className="text-xs text-muted-foreground">g</span>
              </div>

              <Button
                size="sm"
                onClick={() => handleAdd(food)}
                disabled={addingId === food.id}
              >
                {addingId === food.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {query && !loading && foods.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          Keine Ergebnisse für "{query}"
        </p>
      )}
    </div>
  );
}
