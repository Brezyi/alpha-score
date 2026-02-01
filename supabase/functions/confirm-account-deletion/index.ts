import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const sendEmail = async (to: string, subject: string, html: string): Promise<{ success: boolean; error?: string }> => {
  if (!RESEND_API_KEY) {
    console.log("[CONFIRM-ACCOUNT-DELETION] RESEND_API_KEY not configured");
    return { success: false, error: "RESEND_API_KEY not configured" };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "GLOWMAXXED AI <onboarding@resend.dev>",
        to: [to],
        subject,
        html,
      }),
    });

    const responseText = await response.text();
    console.log("[CONFIRM-ACCOUNT-DELETION] Resend API response:", response.status, responseText);

    if (!response.ok) {
      return { success: false, error: `Resend API error: ${response.status} - ${responseText}` };
    }

    return { success: true };
  } catch (error: any) {
    console.log("[CONFIRM-ACCOUNT-DELETION] Email send error:", error.message);
    return { success: false, error: error.message };
  }
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ConfirmDeleteBody {
  token: string;
  password: string;
}

const logStep = (step: string, details?: unknown) => {
  console.log(`[CONFIRM-ACCOUNT-DELETION] ${step}`, details ? JSON.stringify(details) : "");
};

const generateDeletionConfirmationEmail = (appName: string) => {
  const deletedDataCategories = [
    { icon: "📊", title: "Analysen & Ergebnisse", items: ["Alle Gesichtsanalysen", "Score-Verlauf", "Detaillierte Bewertungen", "Potenzial-Bilder"] },
    { icon: "📸", title: "Medien & Uploads", items: ["Hochgeladene Fotos", "Profilbilder", "Analyse-Bilder"] },
    { icon: "💬", title: "Kommunikation", items: ["KI-Coach Gespräche", "Support-Tickets", "Nachrichten"] },
    { icon: "🎮", title: "Gamification", items: ["XP & Level", "Achievements", "Tägliche Challenges", "Streak-Daten", "Meilensteine"] },
    { icon: "📝", title: "Nutzerdaten", items: ["Profil & Einstellungen", "Aufgaben & To-Dos", "E-Mail-Präferenzen", "Testimonials"] },
    { icon: "💳", title: "Zahlungen & Abos", items: ["Zahlungshistorie", "Abonnement-Daten", "Promo-Code-Einlösungen"] },
    { icon: "🔐", title: "Sicherheit", items: ["2FA & Backup-Codes", "Admin-Passwörter", "Push-Benachrichtigungen", "Sensible Daten"] },
  ];

  const categoriesHtml = deletedDataCategories.map(cat => `
    <div style="background: #f8f9fa; border-radius: 8px; padding: 16px; margin-bottom: 12px;">
      <div style="font-weight: 600; margin-bottom: 8px; font-size: 14px;">
        ${cat.icon} ${cat.title}
      </div>
      <ul style="margin: 0; padding-left: 20px; color: #6b7280; font-size: 13px;">
        ${cat.items.map(item => `<li style="margin-bottom: 4px;">✓ ${item}</li>`).join("")}
      </ul>
    </div>
  `).join("");

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <div style="background: linear-gradient(135deg, #3b82f6, #8b5cf6); padding: 32px; text-align: center;">
          <div style="width: 64px; height: 64px; background: rgba(255,255,255,0.2); border-radius: 50%; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
            <span style="font-size: 32px;">✓</span>
          </div>
          <h1 style="color: white; margin: 0; font-size: 24px;">Konto erfolgreich gelöscht</h1>
        </div>
        
        <div style="padding: 32px;">
          <p style="color: #374151; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">
            Dein Konto bei <strong>${appName}</strong> wurde erfolgreich gelöscht. Alle zugehörigen Daten wurden gemäß DSGVO vollständig und unwiderruflich aus unseren Systemen entfernt.
          </p>
          
          <h2 style="color: #1f2937; font-size: 16px; margin-bottom: 16px;">Folgende Daten wurden gelöscht:</h2>
          
          ${categoriesHtml}
          
          <div style="background: #ecfdf5; border: 1px solid #10b981; border-radius: 8px; padding: 16px; margin-top: 24px;">
            <p style="color: #065f46; font-size: 14px; margin: 0;">
              ✓ Alle Daten wurden gemäß DSGVO vollständig und unwiderruflich aus unseren Systemen entfernt.
            </p>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; margin-top: 24px; text-align: center;">
            Vielen Dank, dass du unseren Service genutzt hast.<br>
            Du kannst jederzeit ein neues Konto erstellen.
          </p>
        </div>
        
        <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            Diese E-Mail wurde automatisch versendet. Bitte antworte nicht auf diese Nachricht.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { token, password }: ConfirmDeleteBody = await req.json();
    logStep("Received deletion confirmation", { token: token?.slice(0, 8) + "..." });

    if (!token || !password) {
      throw new Error("Token und Passwort erforderlich");
    }

    // Validate the token
    const { data: tokenData, error: tokenError } = await supabaseAdmin
      .from("account_deletion_tokens")
      .select("*")
      .eq("token", token)
      .eq("used", false)
      .single();

    if (tokenError || !tokenData) {
      logStep("Invalid or expired token", tokenError);
      return new Response(
        JSON.stringify({ error: "Ungültiger oder abgelaufener Link. Bitte fordere einen neuen an." }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if token is expired
    if (new Date(tokenData.expires_at) < new Date()) {
      logStep("Token expired");
      return new Response(
        JSON.stringify({ error: "Der Link ist abgelaufen. Bitte fordere einen neuen an." }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const userId = tokenData.user_id;
    logStep("Token valid, fetching user", { userId });

    // Get user email for password verification
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
    
    if (userError || !userData?.user?.email) {
      logStep("User not found", userError);
      throw new Error("Benutzer nicht gefunden");
    }

    const userEmail = userData.user.email;

    // Verify password by attempting to sign in
    const { error: signInError } = await supabaseAdmin.auth.signInWithPassword({
      email: userEmail,
      password: password,
    });

    if (signInError) {
      logStep("Password verification failed", signInError);
      return new Response(
        JSON.stringify({ error: "Falsches Passwort. Bitte versuche es erneut." }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    logStep("Password verified, proceeding with deletion", { userId });

    // Mark token as used
    await supabaseAdmin
      .from("account_deletion_tokens")
      .update({ used: true })
      .eq("token", token);

    // Delete user data from all tables (order matters due to foreign keys)
    const deletionSteps = [
      // Coach data
      { table: "coach_messages", column: "conversation_id", via: "coach_conversations" },
      { table: "coach_conversations", column: "user_id" },
      // Gamification
      { table: "user_challenge_progress", column: "user_id" },
      { table: "user_achievements", column: "user_id" },
      { table: "user_xp", column: "user_id" },
      { table: "user_milestones", column: "user_id" },
      { table: "user_streaks", column: "user_id" },
      // Tasks & Support
      { table: "user_tasks", column: "user_id" },
      { table: "ticket_messages", column: "sender_id" },
      { table: "support_tickets", column: "user_id" },
      // Testimonials & Reports
      { table: "user_testimonials", column: "user_id" },
      { table: "reports", column: "reporter_id" },
      // Promo codes
      { table: "promo_code_redemptions", column: "user_id" },
      // Analyses
      { table: "analyses", column: "user_id" },
      // Subscriptions & Payments
      { table: "subscriptions", column: "user_id" },
      { table: "payments", column: "user_id" },
      // Security
      { table: "mfa_backup_codes", column: "user_id" },
      { table: "admin_passwords", column: "user_id" },
      { table: "admin_password_reset_tokens", column: "user_id" },
      { table: "push_subscriptions", column: "user_id" },
      { table: "user_sensitive_data", column: "user_id" },
      { table: "user_email_preferences", column: "user_id" },
      // Profile & Roles (last)
      { table: "profiles", column: "user_id" },
      { table: "user_roles", column: "user_id" },
      // Failed logins (by email)
      { table: "failed_login_attempts", column: "email" },
    ];

    // First, delete coach_messages via coach_conversations (foreign key constraint)
    try {
      const { data: conversations } = await supabaseAdmin
        .from("coach_conversations")
        .select("id")
        .eq("user_id", userId);
      
      if (conversations?.length) {
        const conversationIds = conversations.map(c => c.id);
        await supabaseAdmin
          .from("coach_messages")
          .delete()
          .in("conversation_id", conversationIds);
        logStep("Deleted coach_messages", { count: conversationIds.length });
      }
    } catch (e) {
      logStep("Error deleting coach_messages", e);
    }

    // Delete from all other tables
    for (const step of deletionSteps) {
      // Skip coach_messages as we handled it above
      if (step.table === "coach_messages") continue;
      
      try {
        if (step.table === "failed_login_attempts") {
          await supabaseAdmin.from(step.table).delete().eq(step.column, userEmail);
        } else {
          await supabaseAdmin.from(step.table).delete().eq(step.column, userId);
        }
        logStep(`Deleted from ${step.table}`);
      } catch (e) {
        logStep(`Error deleting from ${step.table}`, e);
        // Continue with other deletions
      }
    }

    // Delete storage files
    try {
      // Delete analysis photos
      const { data: analysisFiles } = await supabaseAdmin.storage
        .from("analysis-photos")
        .list(userId);
      
      if (analysisFiles?.length) {
        const filePaths = analysisFiles.map(f => `${userId}/${f.name}`);
        await supabaseAdmin.storage.from("analysis-photos").remove(filePaths);
        logStep("Deleted analysis photos", { count: filePaths.length });
      }

      // Delete avatar
      const { data: avatarFiles } = await supabaseAdmin.storage
        .from("avatars")
        .list(userId);
      
      if (avatarFiles?.length) {
        const filePaths = avatarFiles.map(f => `${userId}/${f.name}`);
        await supabaseAdmin.storage.from("avatars").remove(filePaths);
        logStep("Deleted avatars");
      }
    } catch (e) {
      logStep("Error deleting storage files", e);
    }

    // Delete the deletion token
    await supabaseAdmin
      .from("account_deletion_tokens")
      .delete()
      .eq("user_id", userId);

    // Log audit event before deleting user
    await supabaseAdmin.rpc("create_audit_log", {
      _action_type: "ACCOUNT_DELETED",
      _table_name: "auth_events",
      _record_id: null,
      _actor_id: userId,
      _target_user_id: userId,
      _old_values: { email: userEmail },
      _new_values: null,
      _metadata: { deletion_confirmed: true },
    });

    // Get app name for email
    let appName = "GLOWMAXXED AI";
    try {
      const { data: settingsData } = await supabaseAdmin
        .from("system_settings")
        .select("value")
        .eq("key", "app_name")
        .single();
      if (settingsData?.value) {
        appName = String(settingsData.value).replace(/"/g, "");
      }
    } catch (e) {
      logStep("Could not fetch app name, using default");
    }

    // Send confirmation email before deleting the user
    try {
      logStep("Attempting to send deletion confirmation email", { to: userEmail, appName });
      
      const emailHtml = generateDeletionConfirmationEmail(appName);
      const emailResult = await sendEmail(
        userEmail,
        `Dein Konto wurde erfolgreich gelöscht - ${appName}`,
        emailHtml
      );
      
      if (emailResult.success) {
        logStep("Deletion confirmation email sent successfully");
      } else {
        logStep("Failed to send deletion confirmation email", emailResult.error);
      }
    } catch (emailError: any) {
      logStep("Error sending confirmation email", { message: emailError.message });
      // Continue with deletion even if email fails
    }

    // Finally, delete the auth user
    const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    
    if (deleteUserError) {
      logStep("Error deleting auth user", deleteUserError);
      throw new Error("Fehler beim Löschen des Kontos");
    }

    logStep("Account successfully deleted", { userId });

    return new Response(
      JSON.stringify({ success: true, message: "Konto erfolgreich gelöscht" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    logStep("Error in confirm-account-deletion", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
