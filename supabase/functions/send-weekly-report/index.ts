import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get users who opted in for weekly reports and haven't received one this week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const { data: eligibleUsers, error: usersError } = await supabase
      .from("user_email_preferences")
      .select(`
        user_id,
        last_weekly_report_sent
      `)
      .eq("weekly_report", true)
      .or(`last_weekly_report_sent.is.null,last_weekly_report_sent.lt.${oneWeekAgo.toISOString()}`);

    if (usersError) throw usersError;

    console.log(`Found ${eligibleUsers?.length || 0} eligible users for weekly report`);

    let sentCount = 0;
    let errorCount = 0;

    for (const userPref of eligibleUsers || []) {
      try {
        // Get user email from auth
        const { data: userData } = await supabase.auth.admin.getUserById(userPref.user_id);
        if (!userData?.user?.email) continue;

        // Get user's analyses from last week
        const { data: analyses } = await supabase
          .from("analyses")
          .select("looks_score, potential_score, created_at")
          .eq("user_id", userPref.user_id)
          .eq("status", "completed")
          .gte("created_at", oneWeekAgo.toISOString())
          .order("created_at", { ascending: false });

        // Get user's streak
        const { data: streak } = await supabase
          .from("user_streaks")
          .select("current_streak, longest_streak")
          .eq("user_id", userPref.user_id)
          .maybeSingle();

        // Get user's XP
        const { data: xp } = await supabase
          .from("user_xp")
          .select("current_xp, level")
          .eq("user_id", userPref.user_id)
          .maybeSingle();

        // Get completed challenges this week
        const { data: challenges } = await supabase
          .from("user_challenge_progress")
          .select("completed")
          .eq("user_id", userPref.user_id)
          .eq("completed", true)
          .gte("assigned_date", oneWeekAgo.toISOString().split("T")[0]);

        // Get user profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("display_name")
          .eq("user_id", userPref.user_id)
          .maybeSingle();

        const userName = profile?.display_name?.split(" ")[0] || "Champion";
        const latestScore = analyses?.[0]?.looks_score || null;
        const oldestScoreThisWeek = analyses?.[analyses.length - 1]?.looks_score || null;
        const scoreChange = latestScore && oldestScoreThisWeek 
          ? (latestScore - oldestScoreThisWeek).toFixed(1) 
          : null;

        // Build email HTML
        const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0a0a0a; color: #fff; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #111; border-radius: 16px; padding: 32px; }
    .header { text-align: center; margin-bottom: 32px; }
    .logo { font-size: 24px; font-weight: bold; color: #00FF88; }
    .title { font-size: 28px; margin: 16px 0 8px; }
    .subtitle { color: #888; font-size: 14px; }
    .stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin: 24px 0; }
    .stat-card { background: #1a1a1a; border-radius: 12px; padding: 20px; text-align: center; }
    .stat-value { font-size: 32px; font-weight: bold; color: #00FF88; }
    .stat-label { font-size: 12px; color: #888; margin-top: 4px; }
    .cta { display: block; background: linear-gradient(135deg, #00FF88, #00CC6A); color: #000; text-decoration: none; padding: 16px 32px; border-radius: 12px; text-align: center; font-weight: bold; margin: 24px 0; }
    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 32px; }
    .highlight { color: #00FF88; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">⚡ GLOWMAXXED AI</div>
      <h1 class="title">Hey ${userName}! 👋</h1>
      <p class="subtitle">Dein wöchentlicher Fortschritts-Report</p>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-value">${latestScore?.toFixed(1) || "—"}</div>
        <div class="stat-label">Aktueller Score</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${scoreChange ? (parseFloat(scoreChange) >= 0 ? "+" : "") + scoreChange : "—"}</div>
        <div class="stat-label">Veränderung diese Woche</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">🔥 ${streak?.current_streak || 0}</div>
        <div class="stat-label">Tage Streak</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">⭐ ${xp?.level || 1}</div>
        <div class="stat-label">Level (${xp?.current_xp || 0} XP)</div>
      </div>
    </div>

    <p style="text-align: center; color: #ccc;">
      ${analyses?.length || 0} Analysen · ${challenges?.length || 0} Challenges abgeschlossen
    </p>

    <a href="https://glowmaxxed.ai/dashboard" class="cta">
      Dashboard öffnen →
    </a>

    <div class="footer">
      <p>Du erhältst diese E-Mail, weil du den wöchentlichen Report aktiviert hast.</p>
      <p>© ${new Date().getFullYear()} GLOWMAXXED AI. Alle Rechte vorbehalten.</p>
    </div>
  </div>
</body>
</html>
        `;

        // Send email via Resend
        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "GLOWMAXXED AI <noreply@glowmaxxed.ai>",
            to: [userData.user.email],
            subject: `📊 Dein Wöchentlicher GLOWMAXXED AI Report`,
            html: emailHtml,
          }),
        });

        if (emailResponse.ok) {
          // Update last sent timestamp
          await supabase
            .from("user_email_preferences")
            .update({ last_weekly_report_sent: new Date().toISOString() })
            .eq("user_id", userPref.user_id);
          
          sentCount++;
          console.log(`Sent weekly report to user ${userPref.user_id}`);
        } else {
          const error = await emailResponse.text();
          console.error(`Failed to send email to user ${userPref.user_id}:`, error);
          errorCount++;
        }
      } catch (userError) {
        console.error(`Error processing user ${userPref.user_id}:`, userError);
        errorCount++;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        sent: sentCount,
        errors: errorCount,
        message: `Sent ${sentCount} weekly reports with ${errorCount} errors`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Weekly report error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
