import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Json } from "@/integrations/supabase/types";

export interface RecipeIngredient {
  name: string;
  amount: string;
  unit: string;
}

export interface Recipe {
  id: string;
  name: string;
  description: string | null;
  category: string;
  cuisine: string | null;
  prep_time_minutes: number | null;
  cook_time_minutes: number | null;
  servings: number;
  difficulty: string;
  calories_per_serving: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  fiber_g: number | null;
  ingredients: RecipeIngredient[];
  instructions: string[];
  image_url: string | null;
  is_system: boolean;
  created_by: string | null;
  tags: string[];
  created_at: string;
}

export interface SavedRecipe {
  id: string;
  user_id: string;
  recipe_id: string;
  saved_at: string;
  recipe?: Recipe;
}

const CATEGORIES = [
  { value: "breakfast", label: "Frühstück" },
  { value: "main", label: "Hauptgericht" },
  { value: "salad", label: "Salat" },
  { value: "soup", label: "Suppe" },
  { value: "snack", label: "Snack" },
  { value: "dessert", label: "Dessert" },
  { value: "drink", label: "Getränk" },
];

const DIFFICULTIES = [
  { value: "easy", label: "Einfach" },
  { value: "medium", label: "Mittel" },
  { value: "hard", label: "Schwer" },
];

// Helper function to convert JSONB to RecipeIngredient array
function parseIngredients(ingredients: Json): RecipeIngredient[] {
  if (!ingredients) return [];
  if (Array.isArray(ingredients)) {
    return ingredients.map((ing: unknown) => {
      const item = ing as Record<string, unknown>;
      return {
        name: String(item.name || ''),
        amount: String(item.amount || ''),
        unit: String(item.unit || '')
      };
    });
  }
  return [];
}

// Helper function to convert RecipeIngredient array to JSON
function serializeIngredients(ingredients: RecipeIngredient[]): Json {
  return ingredients.map(ing => ({
    name: ing.name,
    amount: ing.amount,
    unit: ing.unit
  })) as unknown as Json;
}

export function useRecipes() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [savedRecipes, setSavedRecipes] = useState<SavedRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const fetchRecipes = useCallback(async () => {
    try {
      let query = supabase
        .from("recipes")
        .select("*")
        .order("name");
      
      if (selectedCategory) {
        query = query.eq("category", selectedCategory);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Parse ingredients from JSONB
      const parsedRecipes = (data || []).map(r => ({
        ...r,
        ingredients: parseIngredients(r.ingredients)
      }));
      
      setRecipes(parsedRecipes);
    } catch (error) {
      console.error("Error fetching recipes:", error);
    }
  }, [selectedCategory]);

  const fetchSavedRecipes = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("saved_recipes")
        .select(`
          *,
          recipe:recipes(*)
        `)
        .eq("user_id", user.id);

      if (error) throw error;
      
      // Parse ingredients in saved recipes
      const parsedSaved = (data || []).map(s => ({
        ...s,
        recipe: s.recipe ? {
          ...s.recipe,
          ingredients: parseIngredients(s.recipe.ingredients)
        } : undefined
      }));
      
      setSavedRecipes(parsedSaved);
    } catch (error) {
      console.error("Error fetching saved recipes:", error);
    }
  }, [user]);

  const saveRecipe = async (recipeId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from("saved_recipes")
        .insert({
          user_id: user.id,
          recipe_id: recipeId
        });

      if (error) throw error;
      
      await fetchSavedRecipes();
      toast({ title: "Rezept gespeichert ✓" });
      return true;
    } catch (error) {
      console.error("Error saving recipe:", error);
      toast({
        title: "Fehler",
        description: "Rezept konnte nicht gespeichert werden.",
        variant: "destructive"
      });
      return false;
    }
  };

  const unsaveRecipe = async (recipeId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from("saved_recipes")
        .delete()
        .eq("user_id", user.id)
        .eq("recipe_id", recipeId);

      if (error) throw error;
      
      await fetchSavedRecipes();
      toast({ title: "Rezept entfernt ✓" });
      return true;
    } catch (error) {
      console.error("Error removing recipe:", error);
      toast({
        title: "Fehler",
        description: "Rezept konnte nicht entfernt werden.",
        variant: "destructive"
      });
      return false;
    }
  };

  const isRecipeSaved = (recipeId: string) => {
    return savedRecipes.some(s => s.recipe_id === recipeId);
  };

  const createRecipe = async (recipe: Omit<Recipe, "id" | "created_at" | "is_system" | "created_by">) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from("recipes")
        .insert({
          ...recipe,
          ingredients: serializeIngredients(recipe.ingredients),
          is_system: false,
          created_by: user.id
        })
        .select()
        .single();

      if (error) throw error;
      
      await fetchRecipes();
      toast({ title: "Rezept erstellt ✓" });
      return data;
    } catch (error) {
      console.error("Error creating recipe:", error);
      toast({
        title: "Fehler",
        description: "Rezept konnte nicht erstellt werden.",
        variant: "destructive"
      });
      return null;
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchRecipes(), fetchSavedRecipes()]);
      setLoading(false);
    };

    init();
  }, [fetchRecipes, fetchSavedRecipes]);

  return {
    recipes,
    savedRecipes,
    loading,
    categories: CATEGORIES,
    difficulties: DIFFICULTIES,
    selectedCategory,
    setSelectedCategory,
    saveRecipe,
    unsaveRecipe,
    isRecipeSaved,
    createRecipe,
    refetch: async () => {
      await Promise.all([fetchRecipes(), fetchSavedRecipes()]);
    }
  };
}
