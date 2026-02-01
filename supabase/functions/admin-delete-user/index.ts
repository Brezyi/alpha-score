import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface AdminDeleteBody {
  targetUserId: string;
}

const logStep = (step: string, details?: unknown) => {
  console.log(`[ADMIN-DELETE-USER] ${step}`, details ? JSON.stringify(details) : "");
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

    // Verify the caller is authenticated and is an owner
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Nicht authentifiziert");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user: caller }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !caller) {
      throw new Error("Nicht authentifiziert");
    }

    // Check if caller is owner
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .single();

    if (roleError || roleData?.role !== "owner") {
      logStep("Unauthorized attempt", { callerId: caller.id, role: roleData?.role });
      throw new Error("Nur Owner können Nutzer löschen");
    }

    const { targetUserId }: AdminDeleteBody = await req.json();
    logStep("Admin deletion request", { callerId: caller.id, targetUserId });

    if (!targetUserId) {
      throw new Error("Keine User ID angegeben");
    }

    // Prevent self-deletion
    if (targetUserId === caller.id) {
      throw new Error("Du kannst dein eigenes Konto nicht über diesen Weg löschen");
    }

    // Prevent deletion of other owners
    const { data: targetRole } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", targetUserId)
      .single();

    if (targetRole?.role === "owner") {
      throw new Error("Owner-Konten können nicht gelöscht werden");
    }

    // Get target user info
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(targetUserId);
    
    if (userError || !userData?.user) {
      logStep("Target user not found", userError);
      throw new Error("Benutzer nicht gefunden");
    }

    const userEmail = userData.user.email || "unknown";
    logStep("Proceeding with deletion", { targetUserId, email: userEmail });

    // Delete user data from all tables (order matters due to foreign keys)
    const deletionSteps = [
      // Coach data
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
      { table: "admin_password_reset_requests", column: "user_id" },
      { table: "push_subscriptions", column: "user_id" },
      { table: "user_sensitive_data", column: "user_id" },
      { table: "user_email_preferences", column: "user_id" },
      { table: "account_deletion_tokens", column: "user_id" },
      // Friends & Partners
      { table: "friend_connections", column: "requester_id" },
      { table: "friend_connections", column: "addressee_id" },
      { table: "friend_messages", column: "sender_id" },
      { table: "friend_messages", column: "receiver_id" },
      { table: "friend_codes", column: "user_id" },
      { table: "friend_privacy_settings", column: "user_id" },
      { table: "accountability_partners", column: "user_id" },
      { table: "accountability_partners", column: "partner_id" },
      { table: "partner_requests", column: "requester_id" },
      { table: "partner_requests", column: "addressee_id" },
      { table: "partner_check_ins", column: "user_id" },
      // Lifestyle
      { table: "lifestyle_entries", column: "user_id" },
      { table: "meal_entries", column: "user_id" },
      { table: "meal_plans", column: "user_id" },
      { table: "nutrition_goals", column: "user_id" },
      { table: "fasting_sessions", column: "user_id" },
      { table: "mood_entries", column: "user_id" },
      { table: "activities", column: "user_id" },
      { table: "body_measurements", column: "user_id" },
      { table: "progress_photos", column: "user_id" },
      { table: "water_intake_logs", column: "user_id" },
      { table: "supplement_logs", column: "user_id" },
      { table: "grocery_items", column: "user_id" },
      { table: "grocery_lists", column: "user_id" },
      { table: "saved_recipes", column: "user_id" },
      { table: "health_connections", column: "user_id" },
      { table: "calorie_adjustments", column: "user_id" },
      // Face fitness
      { table: "face_fitness_sessions", column: "user_id" },
      // Referrals
      { table: "referrals", column: "referrer_id" },
      { table: "referrals", column: "referred_id" },
      { table: "user_referral_codes", column: "user_id" },
      // Affiliate
      { table: "affiliate_earnings", column: "referrer_id" },
      { table: "affiliate_earnings", column: "referred_id" },
      // Goals
      { table: "user_goals", column: "user_id" },
      // Notifications
      { table: "notification_counts", column: "user_id" },
      // Profile & Roles (last)
      { table: "public_profiles", column: "user_id" },
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
        .eq("user_id", targetUserId);
      
      if (conversations?.length) {
        const conversationIds = conversations.map(c => c.id);
        await supabaseAdmin
          .from("coach_messages")
          .delete()
          .in("conversation_id", conversationIds);
        logStep("Deleted coach_messages", { count: conversationIds.length });
      }
    } catch (e) {
      logStep("Error deleting coach_messages (may not exist)", e);
    }

    // Delete from all other tables
    for (const step of deletionSteps) {
      try {
        if (step.table === "failed_login_attempts") {
          await supabaseAdmin.from(step.table).delete().eq(step.column, userEmail);
        } else {
          await supabaseAdmin.from(step.table).delete().eq(step.column, targetUserId);
        }
        logStep(`Deleted from ${step.table}`);
      } catch (e: any) {
        // Table might not exist or have no data - that's okay
        logStep(`Note: ${step.table} - ${e.message || 'skipped'}`);
      }
    }

    // Delete storage files
    try {
      // Delete analysis photos
      const { data: analysisFiles } = await supabaseAdmin.storage
        .from("analysis-photos")
        .list(targetUserId);
      
      if (analysisFiles?.length) {
        const filePaths = analysisFiles.map(f => `${targetUserId}/${f.name}`);
        await supabaseAdmin.storage.from("analysis-photos").remove(filePaths);
        logStep("Deleted analysis photos", { count: filePaths.length });
      }

      // Delete avatar
      const { data: avatarFiles } = await supabaseAdmin.storage
        .from("avatars")
        .list(targetUserId);
      
      if (avatarFiles?.length) {
        const filePaths = avatarFiles.map(f => `${targetUserId}/${f.name}`);
        await supabaseAdmin.storage.from("avatars").remove(filePaths);
        logStep("Deleted avatars");
      }

      // Delete progress photos
      const { data: progressFiles } = await supabaseAdmin.storage
        .from("progress-photos")
        .list(targetUserId);
      
      if (progressFiles?.length) {
        const filePaths = progressFiles.map(f => `${targetUserId}/${f.name}`);
        await supabaseAdmin.storage.from("progress-photos").remove(filePaths);
        logStep("Deleted progress photos");
      }
    } catch (e) {
      logStep("Error deleting storage files (may not exist)", e);
    }

    // Log audit event before deleting user
    await supabaseAdmin.rpc("create_audit_log", {
      _action_type: "ACCOUNT_DELETED_BY_ADMIN",
      _table_name: "auth_events",
      _record_id: null,
      _actor_id: caller.id,
      _target_user_id: targetUserId,
      _old_values: { email: userEmail },
      _new_values: null,
      _metadata: { deleted_by: caller.email, admin_deletion: true },
    });

    // Finally, delete the auth user
    const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(targetUserId);
    
    if (deleteUserError) {
      logStep("Error deleting auth user", deleteUserError);
      throw new Error("Fehler beim Löschen des Kontos");
    }

    logStep("Account successfully deleted by admin", { targetUserId, deletedBy: caller.id });

    return new Response(
      JSON.stringify({ success: true, message: "Konto erfolgreich gelöscht" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    logStep("Error in admin-delete-user", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
