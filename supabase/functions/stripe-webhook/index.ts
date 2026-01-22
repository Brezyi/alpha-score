import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

const PREMIUM_PRODUCT_ID = "prod_Tq71rp1Davc358";
const LIFETIME_PRODUCT_ID = "prod_Tq71yPs5xPnuYv";

serve(async (req) => {
  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  if (!stripeKey) {
    logStep("ERROR", "STRIPE_SECRET_KEY not set");
    return new Response(JSON.stringify({ error: "Server configuration error" }), { status: 500 });
  }

  const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const body = await req.text();
    const sig = req.headers.get("stripe-signature");

    let event: Stripe.Event;
    
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (webhookSecret && sig) {
      try {
        event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
      } catch (err) {
        logStep("Signature verification failed", { error: String(err) });
        return new Response(JSON.stringify({ error: "Invalid signature" }), { status: 400 });
      }
    } else {
      event = JSON.parse(body) as Stripe.Event;
      logStep("WARNING: Processing without signature verification");
    }

    logStep("Processing event", { type: event.type, id: event.id });

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(supabaseClient, stripe, session);
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionChange(supabaseClient, stripe, subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(supabaseClient, subscription);
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaid(supabaseClient, stripe, invoice);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(supabaseClient, invoice);
        break;
      }

      default:
        logStep("Unhandled event type", { type: event.type });
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), { status: 500 });
  }
});

// deno-lint-ignore no-explicit-any
async function handleCheckoutCompleted(
  supabase: SupabaseClient<any>,
  stripe: Stripe,
  session: Stripe.Checkout.Session
) {
  logStep("Checkout completed", { sessionId: session.id, mode: session.mode });

  const customerId = session.customer as string;
  const customerEmail = session.customer_email || session.customer_details?.email;

  // Find user by email
  let userId: string | null = null;
  if (customerEmail) {
    const { data: users } = await supabase.auth.admin.listUsers();
    const user = users?.users?.find((u: { email?: string }) => u.email === customerEmail);
    userId = user?.id || null;
  }

  if (session.mode === "subscription") {
    logStep("Subscription checkout - will be handled by subscription event");
  } else if (session.mode === "payment") {
    const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
    const isLifetime = lineItems.data.some((item: Stripe.LineItem) => {
      const productId = typeof item.price?.product === "string" 
        ? item.price.product 
        : (item.price?.product as Stripe.Product)?.id;
      return productId === LIFETIME_PRODUCT_ID;
    });

    if (isLifetime) {
      logStep("Lifetime purchase detected", { customerId, userId });

      await supabase.from("subscriptions").upsert({
        stripe_customer_id: customerId,
        stripe_subscription_id: `lifetime_${session.id}`,
        plan_type: "lifetime",
        status: "active",
        amount: session.amount_total || 1999,
        currency: session.currency || "eur",
        customer_email: customerEmail,
        user_id: userId,
      }, { onConflict: "stripe_subscription_id" });

      await supabase.from("payments").insert({
        user_id: userId,
        stripe_payment_intent_id: session.payment_intent as string,
        stripe_customer_id: customerId,
        amount: session.amount_total || 1999,
        currency: session.currency || "eur",
        status: "succeeded",
        payment_type: "one_time",
        customer_email: customerEmail,
        metadata: { session_id: session.id, product: "lifetime" },
      });
    }
  }

  await supabase.rpc("create_audit_log", {
    _action_type: "CHECKOUT_COMPLETED",
    _table_name: "subscriptions",
    _record_id: null,
    _actor_id: userId,
    _target_user_id: userId,
    _old_values: null,
    _new_values: { session_id: session.id, mode: session.mode },
    _metadata: { event: "Stripe checkout completed" },
  });
}

// deno-lint-ignore no-explicit-any
async function handleSubscriptionChange(
  supabase: SupabaseClient<any>,
  stripe: Stripe,
  subscription: Stripe.Subscription
) {
  logStep("Subscription change", { 
    subscriptionId: subscription.id, 
    status: subscription.status 
  });

  const customerId = subscription.customer as string;
  const customer = await stripe.customers.retrieve(customerId);
  const customerEmail = !customer.deleted ? customer.email : null;

  let userId: string | null = null;
  if (customerEmail) {
    const { data: users } = await supabase.auth.admin.listUsers();
    const user = users?.users?.find((u: { email?: string }) => u.email === customerEmail);
    userId = user?.id || null;
  }

  const item = subscription.items.data[0];
  const priceId = item?.price?.id;
  const productId = typeof item?.price?.product === "string" 
    ? item.price.product 
    : (item?.price?.product as Stripe.Product)?.id;

  const planType = productId === LIFETIME_PRODUCT_ID ? "lifetime" : "premium";

  const { error } = await supabase.from("subscriptions").upsert({
    stripe_customer_id: customerId,
    stripe_subscription_id: subscription.id,
    stripe_price_id: priceId,
    plan_type: planType,
    status: subscription.status,
    amount: item?.price?.unit_amount || 0,
    currency: subscription.currency,
    current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    cancel_at_period_end: subscription.cancel_at_period_end,
    canceled_at: subscription.canceled_at 
      ? new Date(subscription.canceled_at * 1000).toISOString() 
      : null,
    customer_email: customerEmail,
    user_id: userId,
  }, { onConflict: "stripe_subscription_id" });

  if (error) {
    logStep("Error upserting subscription", { error });
  } else {
    logStep("Subscription upserted successfully");
  }
}

// deno-lint-ignore no-explicit-any
async function handleSubscriptionDeleted(
  supabase: SupabaseClient<any>,
  subscription: Stripe.Subscription
) {
  logStep("Subscription deleted", { subscriptionId: subscription.id });

  const { error } = await supabase
    .from("subscriptions")
    .update({ 
      status: "canceled",
      canceled_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscription.id);

  if (error) {
    logStep("Error updating canceled subscription", { error });
  }
}

// deno-lint-ignore no-explicit-any
async function handleInvoicePaid(
  supabase: SupabaseClient<any>,
  stripe: Stripe,
  invoice: Stripe.Invoice
) {
  logStep("Invoice paid", { invoiceId: invoice.id, amount: invoice.amount_paid });

  const customerId = invoice.customer as string;
  const customer = await stripe.customers.retrieve(customerId);
  const customerEmail = !customer.deleted ? customer.email : null;

  let userId: string | null = null;
  if (customerEmail) {
    const { data: users } = await supabase.auth.admin.listUsers();
    const user = users?.users?.find((u: { email?: string }) => u.email === customerEmail);
    userId = user?.id || null;
  }

  await supabase.from("payments").insert({
    user_id: userId,
    stripe_payment_intent_id: invoice.payment_intent as string,
    stripe_customer_id: customerId,
    amount: invoice.amount_paid,
    currency: invoice.currency,
    status: "succeeded",
    payment_type: "subscription",
    customer_email: customerEmail,
    metadata: { invoice_id: invoice.id },
  });
}

// deno-lint-ignore no-explicit-any
async function handlePaymentFailed(
  supabase: SupabaseClient<any>,
  invoice: Stripe.Invoice
) {
  logStep("Payment failed", { invoiceId: invoice.id });

  if (invoice.subscription) {
    await supabase
      .from("subscriptions")
      .update({ status: "past_due" })
      .eq("stripe_subscription_id", invoice.subscription);
  }

  await supabase.rpc("create_audit_log", {
    _action_type: "PAYMENT_FAILED",
    _table_name: "payments",
    _record_id: null,
    _actor_id: null,
    _target_user_id: null,
    _old_values: null,
    _new_values: { invoice_id: invoice.id, amount: invoice.amount_due },
    _metadata: { event: "Payment failed" },
  });
}
