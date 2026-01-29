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
      // First, try to get current session
      let { data: { session } } = await supabase.auth.getSession();
      
      // If no session or session might be stale, try to refresh proactively
      if (session) {
        // Check if access token is about to expire (within 60 seconds)
        const expiresAt = session.expires_at;
        const now = Math.floor(Date.now() / 1000);
        const isExpiringSoon = expiresAt && (expiresAt - now) < 60;
        
        if (isExpiringSoon) {
          console.log("Token expiring soon, refreshing proactively...");
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
          
          if (refreshError) {
            console.error("Session refresh failed:", refreshError);
            // Refresh token is also expired - user needs to login again
            await supabase.auth.signOut();
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
          
          session = refreshData.session;
        }
      }
      
      if (!session) {
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
        _user_id: session.user.id
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

      // Handle token expiration errors
      if (error) {
        const errorMessage = error.message || '';
        const isTokenError = errorMessage.includes("401") || 
                            errorMessage.includes("expired") ||
                            errorMessage.includes("Token");
        
        if (isTokenError && retryCount < 1) {
          console.log("Token error detected, attempting refresh...", { retryCount });
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
          
          if (refreshError) {
            console.error("Session refresh failed, signing out:", refreshError);
            await supabase.auth.signOut();
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
          
          if (refreshData.session) {
            // Wait for new token to be used
            await new Promise(resolve => setTimeout(resolve, 200));
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

      // Check for token_expired in response body
      if (data?.token_expired && retryCount < 1) {
        console.log("Token expired flag in response, attempting refresh...");
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError) {
          console.error("Session refresh failed, signing out:", refreshError);
          await supabase.auth.signOut();
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
        
        if (refreshData.session) {
          await new Promise(resolve => setTimeout(resolve, 200));
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
