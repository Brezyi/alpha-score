import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify the user is authenticated and is an owner
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user is owner
    const { data: roleData, error: roleError } = await supabase.rpc("get_user_role", {
      _user_id: user.id,
    });

    if (roleError || roleData !== "owner") {
      return new Response(
        JSON.stringify({ error: "Only owners can request admin password reset via email" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if there's a target user (owner sending to admin)
    let body: { target_user_id?: string } = {};
    try {
      body = await req.json();
    } catch {
      // No body, self-reset
    }

    const targetUserId = body.target_user_id;
    let targetEmail = user.email!;
    let isAdminReset = false;

    if (targetUserId && targetUserId !== user.id) {
      // Owner is sending reset to another admin
      isAdminReset = true;
      
      // Get target user's email using service role
      const supabaseAdmin = createClient(
        supabaseUrl,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );
      
      const { data: targetUser, error: targetError } = await supabaseAdmin.auth.admin.getUserById(targetUserId);
      if (targetError || !targetUser?.user?.email) {
        return new Response(
          JSON.stringify({ error: "Target user not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      // Verify target is admin or owner
      const { data: targetRole } = await supabaseAdmin
        .from("user_roles")
        .select("role")
        .eq("user_id", targetUserId)
        .single();
      
      if (!targetRole || (targetRole.role !== "admin" && targetRole.role !== "owner")) {
        return new Response(
          JSON.stringify({ error: "Target user is not an admin" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      targetEmail = targetUser.user.email;
    }

    // Generate reset token for target user
    const supabaseAdmin = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    
    const { data: token, error: tokenError } = await supabaseAdmin.rpc(
      "request_admin_password_reset_for_user",
      { _target_user_id: targetUserId || user.id }
    );
    
    if (tokenError || !token) {
      // Fallback to old function if new one doesn't exist
      const { data: fallbackToken, error: fallbackError } = await supabase.rpc("request_admin_password_reset");
      if (fallbackError || !fallbackToken) {
        console.error("Error generating reset token:", tokenError || fallbackError);
        return new Response(
          JSON.stringify({ error: "Failed to generate reset token" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const finalToken = token || (await supabase.rpc("request_admin_password_reset")).data;

    // Get the origin from the request for the reset URL
    const origin = req.headers.get("origin") || "https://glowalyze.com";
    const resetUrl = `${origin}/admin-password-reset?token=${finalToken}`;

    // Send email to target user
    const emailSubject = isAdminReset 
      ? "Admin-Passwort Reset-Link von Owner"
      : "Admin-Passwort zurücksetzen";
    
    const emailIntro = isAdminReset
      ? "Der Owner hat dir einen Reset-Link für dein Admin-Passwort gesendet."
      : "Du hast angefordert, dein Admin-Passwort für den geschützten Bereich zurückzusetzen.";

    const emailResponse = await resend.emails.send({
      from: "Glowalyze Security <noreply@glowalyze.com>",
      to: [targetEmail],
      subject: emailSubject,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #667eea; color: white !important; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
            .warning { background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 8px; margin: 20px 0; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Admin-Passwort zurücksetzen</h1>
            </div>
            <div class="content">
              <p>Hallo,</p>
              <p>${emailIntro}</p>
              
              <p style="text-align: center;">
                <a href="${resetUrl}" class="button">Passwort zurücksetzen</a>
              </p>
              
              <div class="warning">
                <strong>⚠️ Wichtig:</strong>
                <ul>
                  <li>Dieser Link ist <strong>1 Stunde</strong> gültig</li>
                  <li>Der Link kann nur <strong>einmal</strong> verwendet werden</li>
                  <li>Falls du diese Anfrage nicht erwartet hast, kontaktiere den Owner</li>
                </ul>
              </div>
              
              <p>Falls der Button nicht funktioniert, kopiere diesen Link in deinen Browser:</p>
              <p style="word-break: break-all; font-size: 12px; color: #666;">${resetUrl}</p>
            </div>
            <div class="footer">
              <p>Diese E-Mail wurde automatisch von Glowalyze gesendet.</p>
              <p>© ${new Date().getFullYear()} Glowalyze. Alle Rechte vorbehalten.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Admin password reset email sent to:", targetEmail, emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: isAdminReset ? `Reset email sent to admin` : "Reset email sent" 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in send-admin-password-reset:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
