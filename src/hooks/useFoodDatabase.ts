import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface FoodItem {
  id: string;
  name: string;
  brand: string | null;
  barcode: string | null;
  calories_per_100g: number | null;
  protein_per_100g: number | null;
  carbs_per_100g: number | null;
  fat_per_100g: number | null;
  fiber_per_100g: number | null;
  serving_size_g: number | null;
  category: string | null;
  is_verified: boolean;
}

export function useFoodDatabase() {
  const { user } = useAuth();
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(false);

  const searchFoods = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setFoods([]);
      return [];
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("food_database")
        .select("*")
        .or(`name.ilike.%${query}%,brand.ilike.%${query}%,barcode.eq.${query}`)
        .order("is_verified", { ascending: false })
        .order("name")
        .limit(20);

      if (error) throw error;
      setFoods(data || []);
      return data || [];
    } catch (error) {
      console.error("Error searching foods:", error);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const searchByBarcode = useCallback(async (barcode: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("food_database")
        .select("*")
        .eq("barcode", barcode)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      return data;
    } catch (error) {
      console.error("Error searching by barcode:", error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const addCustomFood = useCallback(async (food: Omit<FoodItem, "id" | "is_verified">) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from("food_database")
        .insert({
          ...food,
          created_by: user.id,
          is_verified: false
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error adding custom food:", error);
      return null;
    }
  }, [user]);

  const getFoodsByCategory = useCallback(async (category: string) => {
    try {
      const { data, error } = await supabase
        .from("food_database")
        .select("*")
        .eq("category", category)
        .order("name")
        .limit(50);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error getting foods by category:", error);
      return [];
    }
  }, []);

  return {
    foods,
    loading,
    searchFoods,
    searchByBarcode,
    addCustomFood,
    getFoodsByCategory
  };
}
