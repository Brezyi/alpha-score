import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[MANAGE-STRIPE-COUPONS] ${step}${detailsStr}`);
};

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
    if (!user) throw new Error("User not authenticated");

    // Check if user is admin or owner
    const { data: roleData } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (!roleData || !["admin", "owner"].includes(roleData.role)) {
      throw new Error("Unauthorized: Admin or owner role required");
    }

    logStep("User authorized", { userId: user.id, role: roleData.role });

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    const { action, ...params } = await req.json();

    logStep("Processing action", { action });

    switch (action) {
      case "list": {
        const coupons = await stripe.coupons.list({ limit: 100 });
        
        // Get redemption counts for each coupon
        const couponsWithStats = await Promise.all(
          coupons.data.map(async (coupon: Stripe.Coupon) => {
            // Get promotion codes for this coupon
            const promoCodes = await stripe.promotionCodes.list({
              coupon: coupon.id,
              limit: 100,
            });

            return {
              id: coupon.id,
              name: coupon.name,
              percent_off: coupon.percent_off,
              amount_off: coupon.amount_off,
              currency: coupon.currency,
              duration: coupon.duration,
              duration_in_months: coupon.duration_in_months,
              max_redemptions: coupon.max_redemptions,
              times_redeemed: coupon.times_redeemed,
              valid: coupon.valid,
              created: coupon.created,
              redeem_by: coupon.redeem_by,
              promotion_codes: promoCodes.data.map((pc: Stripe.PromotionCode) => ({
                id: pc.id,
                code: pc.code,
                active: pc.active,
                times_redeemed: pc.times_redeemed,
                max_redemptions: pc.max_redemptions,
              })),
            };
          })
        );

        logStep("Listed coupons", { count: couponsWithStats.length });
        return new Response(JSON.stringify({ coupons: couponsWithStats }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      case "create": {
        const { name, percent_off, amount_off, currency, duration, duration_in_months, max_redemptions, redeem_by } = params;

        const couponParams: Stripe.CouponCreateParams = {
          name,
          duration: duration || "once",
        };

        if (percent_off) {
          couponParams.percent_off = percent_off;
        } else if (amount_off) {
          couponParams.amount_off = amount_off;
          couponParams.currency = currency || "eur";
        }

        if (duration === "repeating" && duration_in_months) {
          couponParams.duration_in_months = duration_in_months;
        }

        if (max_redemptions) {
          couponParams.max_redemptions = max_redemptions;
        }

        if (redeem_by) {
          couponParams.redeem_by = Math.floor(new Date(redeem_by).getTime() / 1000);
        }

        const coupon = await stripe.coupons.create(couponParams);
        
        // Create a promotion code for easier use
        const promoCode = await stripe.promotionCodes.create({
          coupon: coupon.id,
          code: name?.replace(/[^a-zA-Z0-9]/g, "").toUpperCase() || coupon.id.toUpperCase(),
        });

        logStep("Created coupon", { couponId: coupon.id, promoCode: promoCode.code });

        return new Response(JSON.stringify({ 
          coupon: {
            ...coupon,
            promotion_code: promoCode.code,
          }
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      case "deactivate": {
        const { coupon_id } = params;
        
        // First deactivate all promotion codes for this coupon
        const promoCodes = await stripe.promotionCodes.list({
          coupon: coupon_id,
          active: true,
        });

        for (const pc of promoCodes.data) {
          await stripe.promotionCodes.update(pc.id, { active: false });
        }

        // Delete the coupon (this prevents new redemptions)
        await stripe.coupons.del(coupon_id);

        logStep("Deactivated coupon", { couponId: coupon_id });

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      case "toggle_promo_code": {
        const { promo_code_id, active } = params;
        
        const updatedPromoCode = await stripe.promotionCodes.update(promo_code_id, {
          active,
        });

        logStep("Toggled promo code", { promoCodeId: promo_code_id, active });

        return new Response(JSON.stringify({ promotion_code: updatedPromoCode }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
