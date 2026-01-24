import { useState, useEffect, useCallback, useMemo } from "react";
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
  matchScore: number; // How well this product matches user's issues
}

// Normalize issue strings for better matching
const normalizeIssue = (issue: string): string => {
  return issue
    .toLowerCase()
    .replace(/[_-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

// Check if two issues match (with fuzzy matching)
const issuesMatch = (productIssue: string, userIssue: string): boolean => {
  const normalizedProduct = normalizeIssue(productIssue);
  const normalizedUser = normalizeIssue(userIssue);
  
  // Exact match
  if (normalizedProduct === normalizedUser) return true;
  
  // One contains the other
  if (normalizedProduct.includes(normalizedUser) || normalizedUser.includes(normalizedProduct)) return true;
  
  // Word-level matching for compound issues
  const productWords = normalizedProduct.split(" ");
  const userWords = normalizedUser.split(" ");
  
  // Check if key words match
  const keywordMatches = productWords.some(pw => 
    userWords.some(uw => 
      (pw.length > 3 && uw.length > 3) && (pw.includes(uw) || uw.includes(pw))
    )
  );
  
  return keywordMatches;
};

// Calculate match score for a product against user issues
const calculateMatchScore = (productIssues: string[], userIssues: string[]): number => {
  if (!userIssues.length || !productIssues.length) return 0;
  
  let matches = 0;
  for (const userIssue of userIssues) {
    for (const productIssue of productIssues) {
      if (issuesMatch(productIssue, userIssue)) {
        matches++;
        break; // Count each user issue only once
      }
    }
  }
  
  // Score based on percentage of user issues matched, weighted by total matches
  const matchPercentage = matches / userIssues.length;
  const absoluteMatches = matches;
  
  // Combined score: prioritize products that match MORE of the user's issues
  return (matchPercentage * 10) + absoluteMatches;
};

export const useProductRecommendations = (userIssues?: string[]) => {
  const { user } = useAuth();
  const [allProducts, setAllProducts] = useState<ProductRecommendation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecommendations = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("product_recommendations")
        .select("*")
        .eq("is_active", true)
        .order("rating", { ascending: false });

      if (error) throw error;

      const recommendations: ProductRecommendation[] = (data || []).map((p) => ({
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
        matchScore: 0,
      }));

      setAllProducts(recommendations);
    } catch (error) {
      console.error("Error fetching product recommendations:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  // Personalized products: calculate match scores and filter/sort
  const products = useMemo(() => {
    if (!allProducts.length) return [];
    
    // If no user issues, return top-rated products (fallback)
    if (!userIssues || userIssues.length === 0) {
      return allProducts.slice(0, 8);
    }

    // Calculate match score for each product
    const scoredProducts = allProducts.map(product => ({
      ...product,
      matchScore: calculateMatchScore(product.targetIssues, userIssues),
    }));

    // Filter to only products that have at least some relevance
    const relevantProducts = scoredProducts.filter(p => p.matchScore > 0);
    
    // Sort by match score (highest first), then by rating
    const sortedProducts = relevantProducts.sort((a, b) => {
      if (b.matchScore !== a.matchScore) {
        return b.matchScore - a.matchScore;
      }
      return b.rating - a.rating;
    });

    // If we have relevant products, return those; otherwise return top-rated as fallback
    if (sortedProducts.length >= 3) {
      return sortedProducts;
    }
    
    // Mix relevant products with top-rated ones if not enough matches
    const topRated = allProducts
      .filter(p => !sortedProducts.some(sp => sp.id === p.id))
      .slice(0, 8 - sortedProducts.length);
    
    return [...sortedProducts, ...topRated];
  }, [allProducts, userIssues]);

  return {
    products,
    loading,
    refetch: fetchRecommendations,
    hasPersonalizedResults: userIssues && userIssues.length > 0 && products.some(p => p.matchScore > 0),
  };
};
