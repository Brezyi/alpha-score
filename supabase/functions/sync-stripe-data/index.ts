import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PREMIUM_PRODUCT_ID = "prod_Tq71rp1Davc358";
const LIFETIME_PRODUCT_ID = "prod_Tq71yPs5xPnuYv";

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[SYNC-STRIPE-DATA] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Verify the user is an owner
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Auth error: ${userError.message}`);

    const user = userData.user;
    if (!user) throw new Error("User not authenticated");

    const { data: roleData } = await supabaseClient.rpc("get_user_role", {
      _user_id: user.id,
    });

    if (roleData !== "owner") {
      throw new Error("Unauthorized - Owner access required");
    }

    logStep("User authorized as owner");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Sync all active subscriptions
    let syncedSubscriptions = 0;
    let syncedPayments = 0;

    const subscriptions = await stripe.subscriptions.list({
      status: "all",
      limit: 100,
      expand: ["data.customer"],
    });

    logStep("Fetched subscriptions from Stripe", { count: subscriptions.data.length });

    for (const sub of subscriptions.data) {
      const customer = sub.customer as Stripe.Customer;
      const item = sub.items.data[0];
      const productId = typeof item.price.product === "string"
        ? item.price.product
        : item.price.product.id;

      // Find user by email
      let userId: string | null = null;
      if (customer.email) {
        const { data: users } = await supabaseClient.auth.admin.listUsers();
        const foundUser = users?.users?.find((u) => u.email === customer.email);
        userId = foundUser?.id || null;
      }

      const planType = productId === LIFETIME_PRODUCT_ID ? "lifetime" : "premium";

      const { error } = await supabaseClient.from("subscriptions").upsert({
        stripe_customer_id: customer.id,
        stripe_subscription_id: sub.id,
        stripe_price_id: item.price.id,
        plan_type: planType,
        status: sub.status,
        amount: item.price.unit_amount || 0,
        currency: sub.currency,
        current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
        current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
        cancel_at_period_end: sub.cancel_at_period_end,
        canceled_at: sub.canceled_at ? new Date(sub.canceled_at * 1000).toISOString() : null,
        customer_email: customer.email,
        user_id: userId,
      }, { onConflict: "stripe_subscription_id" });

      if (!error) syncedSubscriptions++;
    }

    // Sync lifetime purchases from successful payment intents
    const paymentIntents = await stripe.paymentIntents.list({
      limit: 100,
    });

    for (const pi of paymentIntents.data) {
      if (pi.status !== "succeeded") continue;

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
              let customerEmail: string | null = null;
              let userId: string | null = null;

              if (pi.customer) {
                const customer = await stripe.customers.retrieve(pi.customer as string);
                if (!customer.deleted) {
                  customerEmail = customer.email;
                }
              }

              if (customerEmail) {
                const { data: users } = await supabaseClient.auth.admin.listUsers();
                const foundUser = users?.users?.find((u) => u.email === customerEmail);
                userId = foundUser?.id || null;
              }

              // Insert lifetime subscription
              await supabaseClient.from("subscriptions").upsert({
                stripe_customer_id: pi.customer as string,
                stripe_subscription_id: `lifetime_${session.id}`,
                plan_type: "lifetime",
                status: "active",
                amount: pi.amount || 0,
                currency: pi.currency,
                customer_email: customerEmail,
                user_id: userId,
              }, { onConflict: "stripe_subscription_id" });

              // Insert payment record
              await supabaseClient.from("payments").upsert({
                stripe_payment_intent_id: pi.id,
                stripe_customer_id: pi.customer as string,
                user_id: userId,
                amount: pi.amount || 0,
                currency: pi.currency,
                status: "succeeded",
                payment_type: "one_time",
                customer_email: customerEmail,
                metadata: { session_id: session.id, product: "lifetime" },
              }, { onConflict: "stripe_payment_intent_id" });

              syncedPayments++;
            }
          }
        }
      } catch {
        // Skip errors for individual payment intents
        continue;
      }
    }

    logStep("Sync completed", { syncedSubscriptions, syncedPayments });

    return new Response(
      JSON.stringify({
        success: true,
        syncedSubscriptions,
        syncedPayments,
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
