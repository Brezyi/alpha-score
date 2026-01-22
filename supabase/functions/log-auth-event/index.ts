import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[LOG-AUTH-EVENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { eventType, userId, metadata } = await req.json();
    
    if (!eventType) {
      throw new Error("Event type is required");
    }

    logStep("Logging event", { eventType, userId });

    // Map event types to action descriptions
    const eventDescriptions: Record<string, string> = {
      "LOGIN": "Benutzer angemeldet",
      "LOGOUT": "Benutzer abgemeldet",
      "FAILED_LOGIN": "Fehlgeschlagener Anmeldeversuch",
      "SIGNUP": "Neuer Benutzer registriert",
      "PASSWORD_RESET": "Passwort zurückgesetzt",
      "PROFILE_UPDATE": "Profil aktualisiert",
      "SUBSCRIPTION_CHANGE": "Abo-Änderung",
      "PAYMENT_SUCCESS": "Zahlung erfolgreich",
      "PAYMENT_FAILED": "Zahlung fehlgeschlagen",
    };

    // Create audit log entry using the security definer function
    const { data, error } = await supabaseClient.rpc("create_audit_log", {
      _action_type: eventType,
      _table_name: "auth_events",
      _record_id: null,
      _actor_id: userId || null,
      _target_user_id: userId || null,
      _old_values: null,
      _new_values: metadata ? JSON.stringify(metadata) : null,
      _metadata: JSON.stringify({
        event: eventDescriptions[eventType] || eventType,
        ...metadata,
      }),
    });

    if (error) {
      logStep("Error creating audit log", error);
      throw error;
    }

    logStep("Audit log created", { logId: data });

    return new Response(JSON.stringify({ success: true, logId: data }), {
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
