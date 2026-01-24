import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface ProductRecommendation {
  id: string;
  name: string;
  brand: string;
  category: string;
  description: string | null;
  targetIssues: string[];
  skinTypes: string[];
  priceRange: string;
  affiliateLink: string | null;
  imageUrl: string | null;
  rating: number;
}

export const useProductRecommendations = (userIssues?: string[]) => {
  const { user } = useAuth();
  const [products, setProducts] = useState<ProductRecommendation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecommendations = useCallback(async () => {
    try {
      let query = supabase
        .from("product_recommendations")
        .select("*")
        .eq("is_active", true)
        .order("rating", { ascending: false });

      const { data, error } = await query;

      if (error) throw error;

      let recommendations: ProductRecommendation[] = (data || []).map((p) => ({
        id: p.id,
        name: p.name,
        brand: p.brand,
        category: p.category,
        description: p.description,
        targetIssues: p.target_issues || [],
        skinTypes: p.skin_types || [],
        priceRange: p.price_range,
        affiliateLink: p.affiliate_link,
        imageUrl: p.image_url,
        rating: p.rating,
      }));

      // If user has specific issues, prioritize matching products
      if (userIssues && userIssues.length > 0) {
        recommendations = recommendations.sort((a, b) => {
          const aMatches = a.targetIssues.filter((issue) =>
            userIssues.some((ui) => ui.toLowerCase().includes(issue.toLowerCase()) || issue.toLowerCase().includes(ui.toLowerCase()))
          ).length;
          const bMatches = b.targetIssues.filter((issue) =>
            userIssues.some((ui) => ui.toLowerCase().includes(issue.toLowerCase()) || issue.toLowerCase().includes(ui.toLowerCase()))
          ).length;
          return bMatches - aMatches;
        });
      }

      setProducts(recommendations);
    } catch (error) {
      console.error("Error fetching product recommendations:", error);
    } finally {
      setLoading(false);
    }
  }, [userIssues]);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  return {
    products,
    loading,
    refetch: fetchRecommendations,
  };
};
