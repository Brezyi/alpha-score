import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PushSubscription {
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

interface StreakData {
  current_streak: number;
  last_activity_date: string | null;
}

// Web Push implementation using web-push compatible approach
async function sendWebPush(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: { title: string; body: string; icon?: string; badge?: string; data?: Record<string, unknown> },
  vapidPublicKey: string,
  vapidPrivateKey: string
): Promise<Response> {
  // Import web-push for Deno
  const webpush = await import("https://esm.sh/web-push@3.6.7");
  
  webpush.setVapidDetails(
    "mailto:support@facerank.app",
    vapidPublicKey,
    vapidPrivateKey
  );

  const pushSubscription = {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscription.p256dh,
      auth: subscription.auth,
    },
  };

  try {
    await webpush.sendNotification(
      pushSubscription,
      JSON.stringify(payload),
      {
        TTL: 86400,
        urgency: "normal",
      }
    );
    return new Response(null, { status: 201 });
  } catch (error: unknown) {
    const err = error as { statusCode?: number; message?: string };
    if (err.statusCode === 410 || err.statusCode === 404) {
      return new Response(null, { status: err.statusCode });
    }
    console.error("Web push error:", err.message || error);
    return new Response(null, { status: 500 });
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");
    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");

    if (!vapidPrivateKey || !vapidPublicKey) {
      throw new Error("VAPID keys not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

    // Get all push subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from("push_subscriptions")
      .select("user_id, endpoint, p256dh, auth");

    if (subError) throw subError;

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ message: "No subscriptions found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get streak data for users with subscriptions
    const userIds = [...new Set(subscriptions.map((s: PushSubscription) => s.user_id))];

    const { data: streaks, error: streakError } = await supabase
      .from("user_streaks")
      .select("user_id, current_streak, last_activity_date")
      .in("user_id", userIds);

    if (streakError) throw streakError;

    const streakMap = new Map<string, StreakData>();
    (streaks || []).forEach((s: StreakData & { user_id: string }) => {
      streakMap.set(s.user_id, {
        current_streak: s.current_streak,
        last_activity_date: s.last_activity_date,
      });
    });

    // Send notifications to users who haven't been active today
    const results: { success: number; failed: number; skipped: number } = {
      success: 0,
      failed: 0,
      skipped: 0,
    };

    for (const sub of subscriptions as PushSubscription[]) {
      const streak = streakMap.get(sub.user_id);

      // Skip if user was already active today
      if (streak?.last_activity_date === today) {
        results.skipped++;
        continue;
      }

      const currentStreak = streak?.current_streak || 0;
      const isAtRisk = streak?.last_activity_date === yesterday && currentStreak > 0;

      let title: string;
      let body: string;

      if (isAtRisk) {
        title = `🔥 Deine ${currentStreak}-Tage Streak ist in Gefahr!`;
        body = "Werde heute noch aktiv, um deinen Streak zu behalten!";
      } else if (currentStreak === 0) {
        title = "💪 Zeit für einen Neuanfang!";
        body = "Starte heute eine neue Streak und verbessere dein Aussehen!";
      } else {
        title = `🔥 ${currentStreak} Tage Streak!`;
        body = "Vergiss nicht, heute aktiv zu werden!";
      }

      try {
        console.log(`Sending push to ${sub.user_id}: ${title}`);

        const response = await sendWebPush(
          { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
          {
            title,
            body,
            icon: "/favicon.ico",
            badge: "/favicon.ico",
            data: { url: "/dashboard" },
          },
          vapidPublicKey,
          vapidPrivateKey
        );

        if (response.ok || response.status === 201) {
          results.success++;
          console.log(`Push sent successfully to ${sub.user_id}`);
        } else if (response.status === 410 || response.status === 404) {
          // Subscription expired or invalid, remove it
          await supabase
            .from("push_subscriptions")
            .delete()
            .eq("endpoint", sub.endpoint);
          console.log(`Removed expired subscription for ${sub.user_id}`);
          results.failed++;
        } else {
          console.error(`Push failed for ${sub.user_id}: ${response.status}`);
          results.failed++;
        }
      } catch (pushError) {
        console.error(`Error sending push to ${sub.user_id}:`, pushError);
        results.failed++;
      }
    }

    return new Response(
      JSON.stringify({
        message: "Streak reminders processed",
        success: results.success,
        failed: results.failed,
        skipped: results.skipped,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in send-streak-reminder:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
