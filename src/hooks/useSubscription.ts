import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { AppRole } from "./useUserRole";

export interface SubscriptionState {
  isPremium: boolean;
  subscriptionType: "premium" | "lifetime" | "owner" | null;
  subscriptionEnd: string | null;
  isAdminGranted: boolean; // True if subscription was granted by admin (not via Stripe)
  loading: boolean;
  error: string | null;
}

// Stripe Price IDs
export const STRIPE_PRICES = {
  premium: {
    priceId: "price_1SsQn33ow7tNlFpffGJ1wKa9",
    productId: "prod_Tq71rp1Davc358",
    name: "Premium",
    price: "9,99€",
    interval: "Monat",
    mode: "subscription" as const,
  },
  lifetime: {
    priceId: "price_1Sssap3ow7tNlFpflpmlbVCk",
    productId: "prod_TqZkimNgj9qCeV",
    name: "Lifetime",
    price: "49,99€",
    interval: "einmalig",
    mode: "payment" as const,
  },
};

export function useSubscription() {
  const [state, setState] = useState<SubscriptionState>({
    isPremium: false,
    subscriptionType: null,
    subscriptionEnd: null,
    isAdminGranted: false,
    loading: true,
    error: null,
  });

  const checkSubscription = useCallback(async (retryCount = 0) => {
    try {
      // First, try to get a fresh session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        // Try to refresh the session if we have a stored refresh token
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError || !refreshData.session) {
          setState({
            isPremium: false,
            subscriptionType: null,
            subscriptionEnd: null,
            isAdminGranted: false,
            loading: false,
            error: null,
          });
          return;
        }
      }

      // Get the current valid session
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      if (!currentSession) {
        setState({
          isPremium: false,
          subscriptionType: null,
          subscriptionEnd: null,
          isAdminGranted: false,
          loading: false,
          error: null,
        });
        return;
      }

      // Check if user is owner - owners get full premium access
      const { data: roleData } = await supabase.rpc('get_user_role', {
        _user_id: currentSession.user.id
      });

      if (roleData === 'owner') {
        setState({
          isPremium: true,
          subscriptionType: "owner",
          subscriptionEnd: null,
          isAdminGranted: false,
          loading: false,
          error: null,
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke("check-subscription");

      // Handle token expiration - the error context contains the response
      if (error) {
        const errorMessage = error.message || '';
        const isTokenError = errorMessage.includes("401") || 
                            errorMessage.includes("expired") ||
                            errorMessage.includes("Token");
        
        if (isTokenError && retryCount < 2) {
          console.log("Token expired, refreshing session...", { retryCount });
          const { error: refreshError } = await supabase.auth.refreshSession();
          
          if (!refreshError) {
            // Wait a moment for the new token to propagate
            await new Promise(resolve => setTimeout(resolve, 100));
            return checkSubscription(retryCount + 1);
          }
        }
        
        // Set as not premium but don't show error for auth issues
        setState({
          isPremium: false,
          subscriptionType: null,
          subscriptionEnd: null,
          isAdminGranted: false,
          loading: false,
          error: null,
        });
        return;
      }

      // Check for token_expired in successful response (edge function returns 401 with body)
      if (data?.token_expired && retryCount < 2) {
        console.log("Token expired flag in response, refreshing...", { retryCount });
        const { error: refreshError } = await supabase.auth.refreshSession();
        
        if (!refreshError) {
          await new Promise(resolve => setTimeout(resolve, 100));
          return checkSubscription(retryCount + 1);
        }
      }

      setState({
        isPremium: data?.is_premium || false,
        subscriptionType: data?.subscription_type || null,
        subscriptionEnd: data?.subscription_end || null,
        isAdminGranted: data?.is_admin_granted || false,
        loading: false,
        error: null,
      });
    } catch (error: any) {
      console.error("Subscription check failed:", error);
      setState({
        isPremium: false,
        subscriptionType: null,
        subscriptionEnd: null,
        isAdminGranted: false,
        loading: false,
        error: null,
      });
    }
  }, []);

  useEffect(() => {
    checkSubscription();

    // Refresh every minute
    const interval = setInterval(checkSubscription, 60000);

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkSubscription();
    });

    return () => {
      clearInterval(interval);
      subscription.unsubscribe();
    };
  }, [checkSubscription]);

  const createCheckout = async (plan: "premium" | "lifetime", discountCode?: string) => {
    try {
      const priceConfig = STRIPE_PRICES[plan];
      
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: {
          priceId: priceConfig.priceId,
          mode: priceConfig.mode,
          discountCode: discountCode || undefined,
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (error: any) {
      console.error("Checkout error:", error);
      throw error;
    }
  };

  const openCustomerPortal = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (error: any) {
      console.error("Customer portal error:", error);
      throw error;
    }
  };

  return {
    ...state,
    checkSubscription,
    createCheckout,
    openCustomerPortal,
  };
}
