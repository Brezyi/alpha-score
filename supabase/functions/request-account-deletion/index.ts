import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DeleteRequestBody {
  userId: string;
  email: string;
}

const logStep = (step: string, details?: unknown) => {
  console.log(`[REQUEST-ACCOUNT-DELETION] ${step}`, details ? JSON.stringify(details) : "");
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { userId, email }: DeleteRequestBody = await req.json();
    logStep("Received deletion request", { userId, email });

    if (!userId || !email) {
      throw new Error("Missing userId or email");
    }

    // Generate a secure token
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store the token in the database
    const { error: tokenError } = await supabaseClient
      .from("account_deletion_tokens")
      .upsert({
        user_id: userId,
        token: token,
        expires_at: expiresAt.toISOString(),
        used: false,
      }, {
        onConflict: "user_id"
      });

    if (tokenError) {
      logStep("Error storing token", tokenError);
      throw new Error("Failed to create deletion token");
    }

    // Get app name from system settings
    const { data: appNameSetting } = await supabaseClient
      .from("system_settings")
      .select("value")
      .eq("key", "app_name")
      .single();
    
    const appName = appNameSetting?.value || "LooksMax AI";

    // Build confirmation URL
    const baseUrl = Deno.env.get("SUPABASE_URL")?.replace(".supabase.co", ".lovable.app")
      || "https://id-preview--d30bdb3d-7c6b-4134-bde1-3d141f10bbeb.lovable.app";
    const confirmUrl = `${baseUrl}/confirm-deletion?token=${token}`;

    logStep("Sending deletion confirmation email", { email, confirmUrl });

    // Send confirmation email
    const emailResponse = await resend.emails.send({
      from: `${appName} <noreply@resend.dev>`,
      to: [email],
      subject: `${appName} - Konto-Löschung bestätigen`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0a0a0a; color: #fafafa; padding: 40px 20px; margin: 0;">
          <div style="max-width: 480px; margin: 0 auto; background: linear-gradient(135deg, #1a1a1a 0%, #0d0d0d 100%); border-radius: 16px; padding: 40px; border: 1px solid #2a2a2a;">
            <div style="text-align: center; margin-bottom: 32px;">
              <div style="width: 64px; height: 64px; background: linear-gradient(135deg, #ff4444 0%, #cc0000 100%); border-radius: 50%; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 28px;">⚠️</span>
              </div>
              <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #ff4444;">Konto-Löschung bestätigen</h1>
            </div>
            
            <p style="color: #a1a1aa; line-height: 1.6; margin-bottom: 24px;">
              Du hast die Löschung deines ${appName} Kontos angefordert. Diese Aktion ist <strong style="color: #fafafa;">unwiderruflich</strong> und löscht:
            </p>
            
            <ul style="color: #a1a1aa; line-height: 1.8; margin-bottom: 32px; padding-left: 20px;">
              <li>Alle deine Analysen und Ergebnisse</li>
              <li>Deinen Fortschritt und deine Streak</li>
              <li>Dein Profil und alle persönlichen Daten</li>
              <li>Deine Chat-Verläufe mit dem AI Coach</li>
            </ul>
            
            <p style="color: #fafafa; font-weight: 600; margin-bottom: 24px; text-align: center;">
              Um fortzufahren, klicke auf den Button und gib dein Passwort ein:
            </p>
            
            <div style="text-align: center; margin-bottom: 32px;">
              <a href="${confirmUrl}" style="display: inline-block; background: linear-gradient(135deg, #ff4444 0%, #cc0000 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                Löschung bestätigen
              </a>
            </div>
            
            <div style="background: #1f1f1f; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
              <p style="color: #71717a; font-size: 13px; margin: 0; text-align: center;">
                ⏰ Dieser Link ist <strong style="color: #a1a1aa;">1 Stunde</strong> gültig.
              </p>
            </div>
            
            <p style="color: #71717a; font-size: 13px; line-height: 1.6; text-align: center;">
              Falls du diese Anfrage nicht gestellt hast, ignoriere diese E-Mail. 
              Dein Konto bleibt sicher.
            </p>
          </div>
          
          <p style="text-align: center; color: #52525b; font-size: 12px; margin-top: 24px;">
            © ${new Date().getFullYear()} ${appName}. Alle Rechte vorbehalten.
          </p>
        </body>
        </html>
      `,
    });

    logStep("Email sent successfully", emailResponse);

    // Log audit event
    await supabaseClient.rpc("create_audit_log", {
      _action_type: "ACCOUNT_DELETION_REQUESTED",
      _table_name: "auth_events",
      _record_id: null,
      _actor_id: userId,
      _target_user_id: userId,
      _old_values: null,
      _new_values: null,
      _metadata: { email, token_expires: expiresAt.toISOString() },
    });

    return new Response(
      JSON.stringify({ success: true, message: "Bestätigungs-E-Mail gesendet" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    logStep("Error in request-account-deletion", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
