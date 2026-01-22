import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SubscriptionState {
  isPremium: boolean;
  subscriptionType: "premium" | "lifetime" | null;
  subscriptionEnd: string | null;
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
    priceId: "price_1SsQnE3ow7tNlFpfMzBTVPrm",
    productId: "prod_Tq71yPs5xPnuYv",
    name: "Lifetime",
    price: "19,99€",
    interval: "einmalig",
    mode: "payment" as const,
  },
};

export function useSubscription() {
  const [state, setState] = useState<SubscriptionState>({
    isPremium: false,
    subscriptionType: null,
    subscriptionEnd: null,
    loading: true,
    error: null,
  });

  const checkSubscription = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setState({
          isPremium: false,
          subscriptionType: null,
          subscriptionEnd: null,
          loading: false,
          error: null,
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke("check-subscription");

      if (error) {
        console.error("Subscription check error:", error);
        setState(prev => ({ ...prev, loading: false, error: error.message }));
        return;
      }

      setState({
        isPremium: data.is_premium || false,
        subscriptionType: data.subscription_type || null,
        subscriptionEnd: data.subscription_end || null,
        loading: false,
        error: null,
      });
    } catch (error: any) {
      console.error("Subscription check failed:", error);
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error.message || "Failed to check subscription" 
      }));
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

  const createCheckout = async (plan: "premium" | "lifetime") => {
    try {
      const priceConfig = STRIPE_PRICES[plan];
      
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: {
          priceId: priceConfig.priceId,
          mode: priceConfig.mode,
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
