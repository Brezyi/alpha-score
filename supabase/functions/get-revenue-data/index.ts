import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PREMIUM_PRODUCT_ID = "prod_Tq71rp1Davc358";
const LIFETIME_PRODUCT_ID = "prod_Tq71yPs5xPnuYv";

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[GET-REVENUE-DATA] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    // Verify the user is an owner
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Auth error: ${userError.message}`);

    const user = userData.user;
    if (!user) throw new Error("User not authenticated");

    // Check if user is owner
    const { data: roleData } = await supabaseClient.rpc("get_user_role", {
      _user_id: user.id,
    });

    if (roleData !== "owner") {
      throw new Error("Unauthorized - Owner access required");
    }

    logStep("User authorized as owner");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Get all active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      status: "active",
      limit: 100,
      expand: ["data.customer"],
    });

    logStep("Fetched subscriptions", { count: subscriptions.data.length });

    // Get successful payments for lifetime purchases
    const paymentIntents = await stripe.paymentIntents.list({
      limit: 100,
    });

    const successfulPayments = paymentIntents.data.filter(
      (pi: Stripe.PaymentIntent) => pi.status === "succeeded"
    );

    logStep("Fetched payment intents", { successfulCount: successfulPayments.length });

    // Calculate stats
    let totalRevenue = 0;
    let monthlyRevenue = 0;
    let activeSubscriptions = 0;
    let lifetimePurchases = 0;

    const subscriptionData: any[] = [];

    // Process subscriptions
    for (const sub of subscriptions.data) {
      const customer = sub.customer as Stripe.Customer;
      const item = sub.items.data[0];
      const productId = typeof item.price.product === "string" 
        ? item.price.product 
        : item.price.product.id;

      if (productId === PREMIUM_PRODUCT_ID) {
        activeSubscriptions++;
        const amount = item.price.unit_amount || 0;
        monthlyRevenue += amount;
        totalRevenue += amount;

        subscriptionData.push({
          id: sub.id,
          customer_email: customer.email || "Unknown",
          status: sub.status,
          plan: "premium",
          amount: amount,
          current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
          created: new Date(sub.created * 1000).toISOString(),
        });
      }
    }

    // Process lifetime purchases (check checkout sessions)
    for (const pi of successfulPayments) {
      try {
        const sessions = await stripe.checkout.sessions.list({
          payment_intent: pi.id,
          limit: 1,
        });

        if (sessions.data.length > 0) {
          const session = sessions.data[0];
          const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
          
          for (const item of lineItems.data) {
            const productId = typeof item.price?.product === "string"
              ? item.price.product
              : item.price?.product?.id;

            if (productId === LIFETIME_PRODUCT_ID) {
              lifetimePurchases++;
              totalRevenue += pi.amount || 0;

              // Get customer email
              let customerEmail = "Unknown";
              if (pi.customer) {
                const customer = await stripe.customers.retrieve(pi.customer as string);
                if (!customer.deleted) {
                  customerEmail = customer.email || "Unknown";
                }
              }

              subscriptionData.push({
                id: pi.id,
                customer_email: customerEmail,
                status: "active",
                plan: "lifetime",
                amount: pi.amount || 0,
                created: new Date(pi.created * 1000).toISOString(),
              });
            }
          }
        }
      } catch (err) {
        // Skip if we can't get session details
        const errorMsg = err instanceof Error ? err.message : String(err);
        logStep("Error processing payment intent", { id: pi.id, error: errorMsg });
      }
    }

    logStep("Stats calculated", {
      totalRevenue,
      monthlyRevenue,
      activeSubscriptions,
      lifetimePurchases,
    });

    return new Response(
      JSON.stringify({
        stats: {
          totalRevenue,
          monthlyRevenue,
          activeSubscriptions,
          lifetimePurchases,
        },
        subscriptions: subscriptionData,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
