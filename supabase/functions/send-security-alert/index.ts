import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[SECURITY-ALERT] ${step}${detailsStr}`);
};

interface SecurityAlertRequest {
  alertType: "ACCOUNT_LOCKED" | "SUSPICIOUS_LOGIN" | "NEW_DEVICE" | "PASSWORD_CHANGED" | "MFA_DISABLED";
  email: string;
  userId?: string;
  metadata?: {
    failedAttempts?: number;
    lockoutMinutes?: number;
    ipAddress?: string;
    userAgent?: string;
    location?: string;
  };
}

const getAlertContent = (alertType: string, metadata?: SecurityAlertRequest["metadata"]) => {
  const templates: Record<string, { subject: string; title: string; message: string; action: string }> = {
    ACCOUNT_LOCKED: {
      subject: "⚠️ Sicherheitswarnung: Dein Konto wurde gesperrt",
      title: "Konto vorübergehend gesperrt",
      message: `Nach ${metadata?.failedAttempts || 5} fehlgeschlagenen Anmeldeversuchen wurde dein Konto für ${metadata?.lockoutMinutes || 5} Minuten gesperrt. Falls du das nicht warst, empfehlen wir dir, dein Passwort zu ändern.`,
      action: "Falls du diese Anmeldeversuche nicht unternommen hast, ändere bitte umgehend dein Passwort und aktiviere die Zwei-Faktor-Authentifizierung.",
    },
    SUSPICIOUS_LOGIN: {
      subject: "🔐 Verdächtige Anmeldeaktivität erkannt",
      title: "Ungewöhnliche Aktivität festgestellt",
      message: "Wir haben verdächtige Anmeldeaktivität in deinem Konto festgestellt.",
      action: "Überprüfe deine letzten Aktivitäten und ändere dein Passwort, wenn du diese Aktivität nicht erkennst.",
    },
    NEW_DEVICE: {
      subject: "📱 Anmeldung von neuem Gerät",
      title: "Neue Geräteanmeldung",
      message: "Jemand hat sich von einem neuen Gerät in dein Konto angemeldet.",
      action: "Falls du dich nicht von einem neuen Gerät angemeldet hast, ändere bitte sofort dein Passwort.",
    },
    PASSWORD_CHANGED: {
      subject: "🔑 Dein Passwort wurde geändert",
      title: "Passwort erfolgreich geändert",
      message: "Dein Passwort wurde kürzlich geändert.",
      action: "Falls du diese Änderung nicht vorgenommen hast, kontaktiere uns umgehend.",
    },
    MFA_DISABLED: {
      subject: "⚠️ Zwei-Faktor-Authentifizierung deaktiviert",
      title: "2FA wurde deaktiviert",
      message: "Die Zwei-Faktor-Authentifizierung wurde für dein Konto deaktiviert.",
      action: "Falls du diese Änderung nicht vorgenommen hast, aktiviere 2FA erneut und ändere dein Passwort.",
    },
  };

  return templates[alertType] || templates.SUSPICIOUS_LOGIN;
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

    const { alertType, email, userId, metadata }: SecurityAlertRequest = await req.json();

    if (!alertType || !email) {
      throw new Error("alertType and email are required");
    }

    logStep("Processing alert", { alertType, email });

    const content = getAlertContent(alertType, metadata);

    // Get app name from system settings
    let appName = "GlowUp";
    try {
      const { data: settingsData } = await supabaseClient
        .from("system_settings")
        .select("value")
        .eq("key", "app_name")
        .maybeSingle();
      
      if (settingsData?.value) {
        appName = String(settingsData.value);
      }
    } catch (e) {
      logStep("Could not fetch app name, using default");
    }

    const currentYear = new Date().getFullYear();
    const timestamp = new Date().toLocaleString("de-DE", {
      dateStyle: "full",
      timeStyle: "short",
    });

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; background-color: #1a1a1a; border-radius: 16px; overflow: hidden; border: 1px solid #333;">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 40px; background: linear-gradient(135deg, #00ff88 0%, #00cc6a 100%);">
              <h1 style="margin: 0; color: #000; font-size: 24px; font-weight: 700;">${appName}</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <div style="background-color: #2a2a2a; border-radius: 12px; padding: 24px; margin-bottom: 24px; border-left: 4px solid #ff6b6b;">
                <h2 style="margin: 0 0 16px 0; color: #ff6b6b; font-size: 20px;">⚠️ ${content.title}</h2>
                <p style="margin: 0; color: #e0e0e0; font-size: 16px; line-height: 1.6;">
                  ${content.message}
                </p>
              </div>
              
              ${metadata?.ipAddress || metadata?.location ? `
              <div style="background-color: #2a2a2a; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                <p style="margin: 0 0 12px 0; color: #888; font-size: 14px; font-weight: 600; text-transform: uppercase;">Details</p>
                <table style="width: 100%;">
                  ${metadata?.ipAddress ? `<tr><td style="color: #888; padding: 4px 0;">IP-Adresse:</td><td style="color: #fff; padding: 4px 0;">${metadata.ipAddress}</td></tr>` : ""}
                  ${metadata?.location ? `<tr><td style="color: #888; padding: 4px 0;">Standort:</td><td style="color: #fff; padding: 4px 0;">${metadata.location}</td></tr>` : ""}
                  <tr><td style="color: #888; padding: 4px 0;">Zeitpunkt:</td><td style="color: #fff; padding: 4px 0;">${timestamp}</td></tr>
                </table>
              </div>
              ` : ""}
              
              <div style="background-color: #1e3a2f; border-radius: 12px; padding: 20px; border: 1px solid #00ff88;">
                <p style="margin: 0; color: #00ff88; font-size: 14px; line-height: 1.6;">
                  <strong>Empfohlene Maßnahme:</strong><br>
                  ${content.action}
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #111; border-top: 1px solid #333;">
              <p style="margin: 0; color: #666; font-size: 12px; text-align: center;">
                Diese E-Mail wurde automatisch gesendet, weil in deinem ${appName}-Konto eine sicherheitsrelevante Aktivität erkannt wurde.
              </p>
              <p style="margin: 12px 0 0 0; color: #444; font-size: 11px; text-align: center;">
                © ${currentYear} ${appName}. Alle Rechte vorbehalten.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const emailResponse = await resend.emails.send({
      from: `${appName} Security <onboarding@resend.dev>`,
      to: [email],
      subject: content.subject,
      html: emailHtml,
    });

    logStep("Email sent successfully", emailResponse);

    // Log the security alert to audit log
    await supabaseClient.rpc("create_audit_log", {
      _action_type: "SECURITY_ALERT_SENT",
      _table_name: "security_alerts",
      _record_id: null,
      _actor_id: userId || null,
      _target_user_id: userId || null,
      _old_values: null,
      _new_values: JSON.stringify({ alertType, email }),
      _metadata: JSON.stringify({
        event: `Security alert sent: ${alertType}`,
        ...metadata,
      }),
    });

    return new Response(JSON.stringify({ success: true, emailId: emailResponse.data?.id }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
