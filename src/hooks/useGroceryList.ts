import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface GroceryList {
  id: string;
  user_id: string;
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface GroceryItem {
  id: string;
  list_id: string;
  user_id: string;
  item_name: string;
  quantity: number;
  unit: string | null;
  category: string;
  is_checked: boolean;
  recipe_id: string | null;
  created_at: string;
}

const ITEM_CATEGORIES = [
  { value: "produce", label: "Obst & Gemüse", icon: "🥬" },
  { value: "dairy", label: "Milchprodukte", icon: "🥛" },
  { value: "meat", label: "Fleisch & Fisch", icon: "🥩" },
  { value: "bakery", label: "Backwaren", icon: "🥖" },
  { value: "pantry", label: "Vorrat", icon: "🥫" },
  { value: "frozen", label: "Tiefkühl", icon: "❄️" },
  { value: "beverages", label: "Getränke", icon: "🥤" },
  { value: "other", label: "Sonstiges", icon: "📦" },
];

export function useGroceryList() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [lists, setLists] = useState<GroceryList[]>([]);
  const [activeList, setActiveList] = useState<GroceryList | null>(null);
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLists = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("grocery_lists")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setLists(data || []);
      
      // Set active list
      const active = data?.find(l => l.is_active) || data?.[0];
      setActiveList(active || null);
    } catch (error) {
      console.error("Error fetching grocery lists:", error);
    }
  }, [user]);

  const fetchItems = useCallback(async () => {
    if (!user || !activeList) return;

    try {
      const { data, error } = await supabase
        .from("grocery_items")
        .select("*")
        .eq("list_id", activeList.id)
        .order("is_checked", { ascending: true })
        .order("category")
        .order("item_name");

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error("Error fetching grocery items:", error);
    }
  }, [user, activeList]);

  const createList = async (name: string) => {
    if (!user) return null;

    try {
      // Deactivate other lists
      await supabase
        .from("grocery_lists")
        .update({ is_active: false })
        .eq("user_id", user.id);

      const { data, error } = await supabase
        .from("grocery_lists")
        .insert({
          user_id: user.id,
          name,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;
      
      await fetchLists();
      toast({ title: "Einkaufsliste erstellt ✓" });
      return data;
    } catch (error) {
      console.error("Error creating grocery list:", error);
      toast({
        title: "Fehler",
        description: "Liste konnte nicht erstellt werden.",
        variant: "destructive"
      });
      return null;
    }
  };

  const addItem = async (item: Omit<GroceryItem, "id" | "list_id" | "user_id" | "created_at" | "is_checked">) => {
    if (!user || !activeList) return null;

    try {
      const { data, error } = await supabase
        .from("grocery_items")
        .insert({
          list_id: activeList.id,
          user_id: user.id,
          is_checked: false,
          ...item
        })
        .select()
        .single();

      if (error) throw error;
      
      await fetchItems();
      toast({ title: "Artikel hinzugefügt ✓" });
      return data;
    } catch (error) {
      console.error("Error adding grocery item:", error);
      toast({
        title: "Fehler",
        description: "Artikel konnte nicht hinzugefügt werden.",
        variant: "destructive"
      });
      return null;
    }
  };

  const toggleItem = async (id: string, checked: boolean) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from("grocery_items")
        .update({ is_checked: checked })
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;
      
      await fetchItems();
      return true;
    } catch (error) {
      console.error("Error toggling item:", error);
      return false;
    }
  };

  const deleteItem = async (id: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from("grocery_items")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;
      
      await fetchItems();
      toast({ title: "Artikel entfernt ✓" });
      return true;
    } catch (error) {
      console.error("Error deleting item:", error);
      toast({
        title: "Fehler",
        description: "Artikel konnte nicht entfernt werden.",
        variant: "destructive"
      });
      return false;
    }
  };

  const clearCheckedItems = async () => {
    if (!user || !activeList) return false;

    try {
      const { error } = await supabase
        .from("grocery_items")
        .delete()
        .eq("list_id", activeList.id)
        .eq("user_id", user.id)
        .eq("is_checked", true);

      if (error) throw error;
      
      await fetchItems();
      toast({ title: "Erledigte Artikel entfernt ✓" });
      return true;
    } catch (error) {
      console.error("Error clearing checked items:", error);
      toast({
        title: "Fehler",
        description: "Artikel konnten nicht entfernt werden.",
        variant: "destructive"
      });
      return false;
    }
  };

  // Group items by category
  const itemsByCategory = ITEM_CATEGORIES.reduce((acc, cat) => {
    acc[cat.value] = items.filter(i => i.category === cat.value);
    return acc;
  }, {} as Record<string, GroceryItem[]>);

  // Stats
  const stats = {
    total: items.length,
    checked: items.filter(i => i.is_checked).length,
    unchecked: items.filter(i => !i.is_checked).length,
  };

  useEffect(() => {
    const init = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      await fetchLists();
      setLoading(false);
    };

    init();
  }, [user, fetchLists]);

  useEffect(() => {
    if (activeList) {
      fetchItems();
    }
  }, [activeList, fetchItems]);

  return {
    lists,
    activeList,
    items,
    itemsByCategory,
    stats,
    loading,
    categories: ITEM_CATEGORIES,
    createList,
    addItem,
    toggleItem,
    deleteItem,
    clearCheckedItems,
    setActiveList,
    refetch: async () => {
      await Promise.all([fetchLists(), fetchItems()]);
    }
  };
}
