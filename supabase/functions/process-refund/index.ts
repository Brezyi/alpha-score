import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const REFUND_PERIOD_DAYS = 14;

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[PROCESS-REFUND] ${step}${detailsStr}`);
};

const sendRefundEmail = async (
  email: string,
  status: "auto_refunded" | "pending" | "approved" | "rejected",
  amount: number,
  currency: string,
  adminNotes?: string
) => {
  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (!resendKey) {
    logStep("Warning: RESEND_API_KEY not set, skipping email");
    return;
  }

  const resend = new Resend(resendKey);
  const formattedAmount = new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount / 100);

  let subject = "";
  let content = "";

  switch (status) {
    case "auto_refunded":
      subject = "Dein Widerruf wurde verarbeitet";
      content = `
        <h1 style="color: #22c55e;">✓ Widerruf erfolgreich</h1>
        <p>Dein Widerrufsantrag über <strong>${formattedAmount}</strong> wurde automatisch genehmigt und verarbeitet.</p>
        <p>Die Rückerstattung erfolgt innerhalb von 5-10 Werktagen auf dein ursprüngliches Zahlungsmittel.</p>
        <p>Dein Abonnement wurde deaktiviert.</p>
      `;
      break;
    case "pending":
      subject = "Dein Widerrufsantrag ist eingegangen";
      content = `
        <h1 style="color: #f59e0b;">⏳ Antrag eingegangen</h1>
        <p>Dein Widerrufsantrag über <strong>${formattedAmount}</strong> wurde eingereicht.</p>
        <p>Da die 14-tägige Widerrufsfrist überschritten wurde, wird dein Antrag von unserem Team geprüft.</p>
        <p>Du erhältst eine weitere E-Mail, sobald eine Entscheidung getroffen wurde.</p>
      `;
      break;
    case "approved":
      subject = "Dein Widerrufsantrag wurde genehmigt";
      content = `
        <h1 style="color: #22c55e;">✓ Antrag genehmigt</h1>
        <p>Dein Widerrufsantrag über <strong>${formattedAmount}</strong> wurde genehmigt.</p>
        <p>Die Rückerstattung erfolgt innerhalb von 5-10 Werktagen auf dein ursprüngliches Zahlungsmittel.</p>
        <p>Dein Abonnement wurde deaktiviert.</p>
        ${adminNotes ? `<p><em>Hinweis vom Team: ${adminNotes}</em></p>` : ""}
      `;
      break;
    case "rejected":
      subject = "Dein Widerrufsantrag wurde abgelehnt";
      content = `
        <h1 style="color: #ef4444;">✗ Antrag abgelehnt</h1>
        <p>Dein Widerrufsantrag über <strong>${formattedAmount}</strong> konnte leider nicht genehmigt werden.</p>
        ${adminNotes ? `<p><strong>Begründung:</strong> ${adminNotes}</p>` : ""}
        <p>Bei Fragen wende dich bitte an unseren Support.</p>
      `;
      break;
  }

  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px 12px 0 0;">
        <h2 style="color: white; margin: 0;">Widerrufsrecht</h2>
      </div>
      <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none;">
        ${content}
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="color: #6b7280; font-size: 14px;">
          Diese E-Mail wurde automatisch generiert. Bei Fragen wende dich an unseren Support.
        </p>
      </div>
    </body>
    </html>
  `;

  try {
    await resend.emails.send({
      from: "GlowUp <noreply@glowup-ai.de>",
      to: [email],
      subject,
      html: emailHtml,
    });
    logStep("Email sent successfully", { email, status });
  } catch (error) {
    logStep("Error sending email", { error: String(error) });
  }
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

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    const { action, ...params } = await req.json();

    logStep("Processing action", { action, userId: user.id });

    // Check if user is admin/owner for certain actions
    const { data: roleData } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    const isAdmin = roleData && ["admin", "owner"].includes(roleData.role);

    switch (action) {
      case "request_refund": {
        const { payment_intent_id, reason } = params;

        // Get payment info from Stripe
        const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id);
        
        if (!paymentIntent) {
          throw new Error("Zahlung nicht gefunden");
        }

        // Verify user owns this payment (check by email)
        const customers = await stripe.customers.list({ email: user.email!, limit: 1 });
        if (customers.data.length === 0 || paymentIntent.customer !== customers.data[0].id) {
          throw new Error("Keine Berechtigung für diese Zahlung");
        }

        // Calculate if within refund period
        const paymentDate = new Date(paymentIntent.created * 1000);
        const now = new Date();
        const daysSincePayment = Math.floor((now.getTime() - paymentDate.getTime()) / (1000 * 60 * 60 * 24));
        const isWithinPeriod = daysSincePayment <= REFUND_PERIOD_DAYS;

        logStep("Refund request check", { 
          paymentDate: paymentDate.toISOString(), 
          daysSincePayment, 
          isWithinPeriod 
        });

        // Check if already requested
        const { data: existingRequest } = await supabaseClient
          .from("refund_requests")
          .select("id, status")
          .eq("payment_intent_id", payment_intent_id)
          .maybeSingle();

        if (existingRequest) {
          throw new Error(`Widerrufsantrag bereits gestellt (Status: ${existingRequest.status})`);
        }

        // If within period, process automatically
        if (isWithinPeriod) {
          // Process refund via Stripe
          const refund = await stripe.refunds.create({
            payment_intent: payment_intent_id,
            reason: "requested_by_customer",
          });

          logStep("Auto-refund processed", { refundId: refund.id });

          // Record the refund request
          await supabaseClient
            .from("refund_requests")
            .insert({
              user_id: user.id,
              payment_intent_id,
              amount: paymentIntent.amount,
              currency: paymentIntent.currency,
              reason,
              status: "auto_refunded",
              payment_date: paymentDate.toISOString(),
              is_within_period: true,
              processed_at: new Date().toISOString(),
            });

          // Deactivate subscription
          const { error: subError } = await supabaseClient
            .from("subscriptions")
            .update({ 
              status: "canceled", 
              canceled_at: new Date().toISOString() 
            })
            .eq("user_id", user.id);

          if (subError) {
            logStep("Warning: Could not deactivate subscription", { error: subError.message });
          }

          // Send confirmation email
          await sendRefundEmail(user.email!, "auto_refunded", paymentIntent.amount, paymentIntent.currency);

          return new Response(JSON.stringify({ 
            success: true, 
            auto_refunded: true,
            message: "Dein Widerruf wurde automatisch verarbeitet. Die Rückerstattung erfolgt in 5-10 Werktagen."
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          });
        } else {
          // Create pending request for admin review
          await supabaseClient
            .from("refund_requests")
            .insert({
              user_id: user.id,
              payment_intent_id,
              amount: paymentIntent.amount,
              currency: paymentIntent.currency,
              reason,
              status: "pending",
              payment_date: paymentDate.toISOString(),
              is_within_period: false,
            });

          // Send pending notification email
          await sendRefundEmail(user.email!, "pending", paymentIntent.amount, paymentIntent.currency);

          return new Response(JSON.stringify({ 
            success: true, 
            auto_refunded: false,
            message: "Dein Widerrufsantrag wurde eingereicht und wird von unserem Team geprüft."
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          });
        }
      }

      case "list_requests": {
        if (!isAdmin) {
          throw new Error("Keine Berechtigung");
        }

        const { data: requests, error: listError } = await supabaseClient
          .from("refund_requests")
          .select(`
            *,
            profiles:user_id (display_name)
          `)
          .order("created_at", { ascending: false });

        if (listError) throw new Error(listError.message || "Fehler beim Laden der Anträge");

        // Enrich with user email
        const enrichedRequests = await Promise.all(
          (requests || []).map(async (req) => {
            const { data: authUser } = await supabaseClient.auth.admin.getUserById(req.user_id);
            return {
              ...req,
              user_email: authUser?.user?.email || "Unbekannt",
            };
          })
        );

        return new Response(JSON.stringify({ requests: enrichedRequests }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      case "process_request": {
        if (!isAdmin) {
          throw new Error("Keine Berechtigung");
        }

        const { request_id, approve, admin_notes } = params;

        const { data: request, error: fetchError } = await supabaseClient
          .from("refund_requests")
          .select("*")
          .eq("id", request_id)
          .single();

        if (fetchError || !request) {
          throw new Error("Antrag nicht gefunden");
        }

        if (request.status !== "pending") {
          throw new Error("Antrag wurde bereits bearbeitet");
        }

        if (approve) {
          // Process refund via Stripe
          const refund = await stripe.refunds.create({
            payment_intent: request.payment_intent_id,
            reason: "requested_by_customer",
          });

          logStep("Admin approved refund", { refundId: refund.id, requestId: request_id });

          // Update request
          await supabaseClient
            .from("refund_requests")
            .update({
              status: "approved",
              processed_at: new Date().toISOString(),
              processed_by: user.id,
              admin_notes,
            })
            .eq("id", request_id);

          // Deactivate subscription
          await supabaseClient
            .from("subscriptions")
            .update({ 
              status: "canceled", 
              canceled_at: new Date().toISOString() 
            })
            .eq("user_id", request.user_id);

          // Get user email and send approval notification
          const { data: approvedUser } = await supabaseClient.auth.admin.getUserById(request.user_id);
          if (approvedUser?.user?.email) {
            await sendRefundEmail(approvedUser.user.email, "approved", request.amount, request.currency, admin_notes);
          }

        } else {
          // Reject request
          await supabaseClient
            .from("refund_requests")
            .update({
              status: "rejected",
              processed_at: new Date().toISOString(),
              processed_by: user.id,
              admin_notes,
            })
            .eq("id", request_id);

          // Get user email and send rejection notification
          const { data: rejectedUser } = await supabaseClient.auth.admin.getUserById(request.user_id);
          if (rejectedUser?.user?.email) {
            await sendRefundEmail(rejectedUser.user.email, "rejected", request.amount, request.currency, admin_notes);
          }
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      case "get_user_payments": {
        // Get user's payments that can be refunded
        const customers = await stripe.customers.list({ email: user.email!, limit: 1 });
        
        if (customers.data.length === 0) {
          return new Response(JSON.stringify({ payments: [] }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          });
        }

        const paymentIntents = await stripe.paymentIntents.list({
          customer: customers.data[0].id,
          limit: 20,
        });

        // Get existing refund requests
        const { data: existingRequests } = await supabaseClient
          .from("refund_requests")
          .select("payment_intent_id, status")
          .eq("user_id", user.id);

        const requestMap = new Map(
          (existingRequests || []).map(r => [r.payment_intent_id, r.status])
        );

        const payments = (paymentIntents.data as Stripe.PaymentIntent[])
          .filter((pi: Stripe.PaymentIntent) => pi.status === "succeeded")
          .map((pi: Stripe.PaymentIntent) => {
            const paymentDate = new Date(pi.created * 1000);
            const now = new Date();
            const daysSincePayment = Math.floor((now.getTime() - paymentDate.getTime()) / (1000 * 60 * 60 * 24));
            
            return {
              id: pi.id,
              amount: pi.amount,
              currency: pi.currency,
              created: pi.created,
              payment_date: paymentDate.toISOString(),
              days_since_payment: daysSincePayment,
              is_within_period: daysSincePayment <= REFUND_PERIOD_DAYS,
              refund_status: requestMap.get(pi.id) || null,
              description: pi.description || "Premium Zugang",
            };
          });

        return new Response(JSON.stringify({ payments }), {
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
