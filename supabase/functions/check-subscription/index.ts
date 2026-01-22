import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

// Product IDs
const PREMIUM_PRODUCT_ID = "prod_Tq71rp1Davc358";
const LIFETIME_PRODUCT_ID = "prod_Tq71yPs5xPnuYv";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });

    if (customers.data.length === 0) {
      logStep("No customer found");
      return new Response(JSON.stringify({ 
        subscribed: false,
        is_premium: false,
        subscription_type: null
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    // Check for active subscriptions (Premium monthly)
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 10,
    });

    let isPremium = false;
    let subscriptionType: string | null = null;
    let subscriptionEnd: string | null = null;

    if (subscriptions.data.length > 0) {
      for (const subscription of subscriptions.data) {
        const productId = subscription.items.data[0].price.product;
        if (productId === PREMIUM_PRODUCT_ID) {
          isPremium = true;
          subscriptionType = "premium";
          subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
          break;
        }
      }
    }

    // Check for lifetime purchases (one-time payments)
    if (!isPremium) {
      const paymentIntents = await stripe.paymentIntents.list({
        customer: customerId,
        limit: 100,
      });

      for (const pi of paymentIntents.data) {
        if (pi.status === "succeeded") {
          // Check if this payment was for lifetime access
          const sessions = await stripe.checkout.sessions.list({
            payment_intent: pi.id as string,
            limit: 1,
          });

          for (const session of sessions.data) {
            if (session.line_items) {
              const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
              for (const item of lineItems.data) {
                if (item.price?.product === LIFETIME_PRODUCT_ID) {
                  isPremium = true;
                  subscriptionType = "lifetime";
                  break;
                }
              }
            }
          }
        }
        if (isPremium) break;
      }
    }

    logStep("Subscription check complete", { isPremium, subscriptionType, subscriptionEnd });

    return new Response(JSON.stringify({
      subscribed: isPremium,
      is_premium: isPremium,
      subscription_type: subscriptionType,
      subscription_end: subscriptionEnd
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
