import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface CleanupResult {
  deletedCount: number;
  deletedUsers: string[];
  errors: string[];
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // This function should be called via cron or manually by admin
    // It requires service role to delete users from auth.users
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Get expired unconfirmed users (older than 7 days)
    const { data: expiredUsers, error: fetchError } = await supabaseAdmin.rpc(
      "get_expired_unconfirmed_user_ids"
    );

    if (fetchError) {
      console.error("Error fetching expired users:", fetchError);
      throw fetchError;
    }

    const result: CleanupResult = {
      deletedCount: 0,
      deletedUsers: [],
      errors: [],
    };

    if (!expiredUsers || expiredUsers.length === 0) {
      console.log("No expired unconfirmed users found");
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "No expired users to clean up",
          ...result 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    console.log(`Found ${expiredUsers.length} expired unconfirmed users`);

    // Delete each user
    for (const user of expiredUsers) {
      try {
        // First, clean up any related data in public tables
        // (Most tables have ON DELETE CASCADE, but let's be thorough)
        
        // Delete from profiles
        await supabaseAdmin
          .from("profiles")
          .delete()
          .eq("user_id", user.user_id);
        
        // Delete from user_roles
        await supabaseAdmin
          .from("user_roles")
          .delete()
          .eq("user_id", user.user_id);
        
        // Delete from user_referral_codes
        await supabaseAdmin
          .from("user_referral_codes")
          .delete()
          .eq("user_id", user.user_id);
        
        // Delete the auth user
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(
          user.user_id
        );

        if (deleteError) {
          console.error(`Error deleting user ${user.email}:`, deleteError);
          result.errors.push(`${user.email}: ${deleteError.message}`);
        } else {
          console.log(`Deleted unconfirmed user: ${user.email}`);
          result.deletedCount++;
          result.deletedUsers.push(user.email);
        }
      } catch (err: any) {
        console.error(`Exception deleting user ${user.email}:`, err);
        result.errors.push(`${user.email}: ${err.message}`);
      }
    }

    // Log the cleanup action
    await supabaseAdmin.from("audit_logs").insert({
      action_type: "CLEANUP_UNCONFIRMED_USERS",
      table_name: "auth.users",
      metadata: {
        deleted_count: result.deletedCount,
        deleted_users: result.deletedUsers,
        errors: result.errors,
      },
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Cleaned up ${result.deletedCount} unconfirmed users`,
        ...result 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error: any) {
    console.error("Error in cleanup-unconfirmed-users:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
};

serve(handler);
