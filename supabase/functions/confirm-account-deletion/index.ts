import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ConfirmDeleteBody {
  token: string;
  password: string;
}

const logStep = (step: string, details?: unknown) => {
  console.log(`[CONFIRM-ACCOUNT-DELETION] ${step}`, details ? JSON.stringify(details) : "");
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

    // Delete user data from all tables
    const deletionSteps = [
      { table: "mfa_backup_codes", column: "user_id" },
      { table: "user_streaks", column: "user_id" },
      { table: "user_tasks", column: "user_id" },
      { table: "ticket_messages", column: "sender_id" },
      { table: "support_tickets", column: "user_id" },
      { table: "user_testimonials", column: "user_id" },
      { table: "analyses", column: "user_id" },
      { table: "subscriptions", column: "user_id" },
      { table: "payments", column: "user_id" },
      { table: "profiles", column: "user_id" },
      { table: "user_roles", column: "user_id" },
      { table: "failed_login_attempts", column: "email" }, // Special case: uses email
    ];

    for (const step of deletionSteps) {
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
