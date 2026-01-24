import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    logStep("Function started");

    const { priceId, mode, discountCode } = await req.json();
    logStep("Request body", { priceId, mode, discountCode: discountCode ? "provided" : "none" });

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { 
      apiVersion: "2025-08-27.basil" 
    });

    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Existing customer found", { customerId });
    }

    const origin = req.headers.get("origin") || "https://d30bdb3d-7c6b-4134-bde1-3d141f10bbeb.lovableproject.com";

    // Build session options
    const sessionOptions: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: mode || "subscription",
      success_url: `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing`,
      metadata: {
        user_id: user.id,
      },
      allow_promotion_codes: true, // Allow users to enter codes on Stripe checkout page
    };

    // If a discount code is provided, validate and apply it
    if (discountCode && discountCode.trim()) {
      try {
        // Try to find the coupon by ID (Stripe coupon codes)
        const coupon = await stripe.coupons.retrieve(discountCode.trim());
        if (coupon && coupon.valid) {
          sessionOptions.discounts = [{ coupon: coupon.id }];
          logStep("Discount code applied", { couponId: coupon.id, percentOff: coupon.percent_off, amountOff: coupon.amount_off });
        }
      } catch (couponError) {
        // Coupon not found or invalid - try as promotion code
        try {
          const promotionCodes = await stripe.promotionCodes.list({
            code: discountCode.trim(),
            active: true,
            limit: 1,
          });
          
          if (promotionCodes.data.length > 0) {
            sessionOptions.discounts = [{ promotion_code: promotionCodes.data[0].id }];
            logStep("Promotion code applied", { promoCodeId: promotionCodes.data[0].id });
          } else {
            logStep("Discount code not found or invalid", { code: discountCode });
          }
        } catch (promoError) {
          logStep("Promotion code lookup failed", { error: String(promoError) });
        }
      }
    }

    const session = await stripe.checkout.sessions.create(sessionOptions);

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    return new Response(JSON.stringify({ url: session.url }), {
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
