import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useRecipes, Recipe } from "@/hooks/useRecipes";
import { 
  ChefHat, 
  Clock, 
  Users,
  Heart,
  HeartOff,
  Flame,
  Beef,
  Wheat,
  Droplet,
  Loader2,
  Filter
} from "lucide-react";
import { cn } from "@/lib/utils";

export function RecipeDatabase() {
  const { 
    recipes, 
    savedRecipes,
    categories,
    loading,
    selectedCategory,
    setSelectedCategory,
    saveRecipe,
    unsaveRecipe,
    isRecipeSaved
  } = useRecipes();

  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [showSavedOnly, setShowSavedOnly] = useState(false);

  const displayedRecipes = showSavedOnly 
    ? recipes.filter(r => isRecipeSaved(r.id))
    : recipes;

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
    <>
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <ChefHat className="h-5 w-5 text-primary" />
              Rezepte
            </CardTitle>
            <Button
              size="sm"
              variant={showSavedOnly ? "default" : "outline"}
              onClick={() => setShowSavedOnly(!showSavedOnly)}
            >
              <Heart className={cn("h-4 w-4 mr-1", showSavedOnly && "fill-current")} />
              {savedRecipes.length}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Category Filter */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            <Button
              size="sm"
              variant={selectedCategory === null ? "default" : "outline"}
              onClick={() => setSelectedCategory(null)}
            >
              Alle
            </Button>
            {categories.map((cat) => (
              <Button
                key={cat.value}
                size="sm"
                variant={selectedCategory === cat.value ? "default" : "outline"}
                onClick={() => setSelectedCategory(cat.value)}
              >
                {cat.label}
              </Button>
            ))}
          </div>

          {/* Recipe Grid */}
          <div className="grid gap-3">
            {displayedRecipes.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Keine Rezepte gefunden
              </p>
            ) : (
              displayedRecipes.map((recipe) => (
                <div
                  key={recipe.id}
                  className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => setSelectedRecipe(recipe)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm mb-1">{recipe.name}</h4>
                      <p className="text-xs text-muted-foreground line-clamp-1 mb-2">
                        {recipe.description}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {recipe.prep_time_minutes && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {recipe.prep_time_minutes + (recipe.cook_time_minutes || 0)} Min
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {recipe.servings}
                        </span>
                        {recipe.calories_per_serving && (
                          <span className="flex items-center gap-1">
                            <Flame className="h-3 w-3" />
                            {recipe.calories_per_serving} kcal
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        isRecipeSaved(recipe.id) 
                          ? unsaveRecipe(recipe.id)
                          : saveRecipe(recipe.id);
                      }}
                    >
                      {isRecipeSaved(recipe.id) ? (
                        <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                      ) : (
                        <Heart className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {recipe.tags && recipe.tags.length > 0 && (
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {recipe.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-[10px]">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recipe Detail Dialog */}
      <Dialog open={!!selectedRecipe} onOpenChange={() => setSelectedRecipe(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedRecipe?.name}
              <Button
                size="icon"
                variant="ghost"
                className="shrink-0 ml-auto"
                onClick={() => {
                  if (selectedRecipe) {
                    isRecipeSaved(selectedRecipe.id) 
                      ? unsaveRecipe(selectedRecipe.id)
                      : saveRecipe(selectedRecipe.id);
                  }
                }}
              >
                {selectedRecipe && isRecipeSaved(selectedRecipe.id) ? (
                  <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                ) : (
                  <Heart className="h-4 w-4" />
                )}
              </Button>
            </DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="flex-1">
            {selectedRecipe && (
              <div className="space-y-4 pr-4">
                {/* Meta Info */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  {selectedRecipe.prep_time_minutes && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {selectedRecipe.prep_time_minutes + (selectedRecipe.cook_time_minutes || 0)} Min
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {selectedRecipe.servings} Portionen
                  </span>
                  <Badge variant="outline">{selectedRecipe.difficulty}</Badge>
                </div>

                {/* Description */}
                {selectedRecipe.description && (
                  <p className="text-sm text-muted-foreground">
                    {selectedRecipe.description}
                  </p>
                )}

                {/* Nutrition */}
                <div className="grid grid-cols-4 gap-2">
                  <div className="p-2 rounded-lg bg-muted/50 text-center">
                    <Flame className="h-4 w-4 mx-auto mb-1 text-orange-500" />
                    <div className="text-sm font-bold">{selectedRecipe.calories_per_serving}</div>
                    <div className="text-[10px] text-muted-foreground">kcal</div>
                  </div>
                  <div className="p-2 rounded-lg bg-muted/50 text-center">
                    <Beef className="h-4 w-4 mx-auto mb-1 text-red-500" />
                    <div className="text-sm font-bold">{selectedRecipe.protein_g}g</div>
                    <div className="text-[10px] text-muted-foreground">Protein</div>
                  </div>
                  <div className="p-2 rounded-lg bg-muted/50 text-center">
                    <Wheat className="h-4 w-4 mx-auto mb-1 text-amber-500" />
                    <div className="text-sm font-bold">{selectedRecipe.carbs_g}g</div>
                    <div className="text-[10px] text-muted-foreground">Carbs</div>
                  </div>
                  <div className="p-2 rounded-lg bg-muted/50 text-center">
                    <Droplet className="h-4 w-4 mx-auto mb-1 text-blue-500" />
                    <div className="text-sm font-bold">{selectedRecipe.fat_g}g</div>
                    <div className="text-[10px] text-muted-foreground">Fett</div>
                  </div>
                </div>

                {/* Ingredients */}
                <div>
                  <h4 className="font-medium mb-2">Zutaten</h4>
                  <ul className="space-y-1">
                    {selectedRecipe.ingredients.map((ing, i) => (
                      <li key={i} className="text-sm flex items-center gap-2">
                        <span className="w-16 text-muted-foreground">
                          {ing.amount} {ing.unit}
                        </span>
                        <span>{ing.name}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Instructions */}
                <div>
                  <h4 className="font-medium mb-2">Zubereitung</h4>
                  <ol className="space-y-2">
                    {selectedRecipe.instructions.map((step, i) => (
                      <li key={i} className="text-sm flex gap-3">
                        <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 text-xs font-bold">
                          {i + 1}
                        </span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}
