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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");

    if (!vapidPublicKey || !vapidPrivateKey) {
      throw new Error("VAPID keys not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get current time in HH:MM format
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
    
    // Calculate reminder times (e.g., 30 minutes before bedtime)
    // We check for users whose bedtime minus reminder_minutes_before equals current time
    const { data: usersToRemind, error: fetchError } = await supabase
      .from("user_sleep_goals")
      .select(`
        user_id,
        target_bedtime,
        reminder_minutes_before
      `)
      .eq("reminder_enabled", true)
      .not("target_bedtime", "is", null);

    if (fetchError) {
      throw fetchError;
    }

    console.log(`Found ${usersToRemind?.length || 0} users with reminders enabled`);

    const notificationsSent: string[] = [];

    for (const goal of usersToRemind || []) {
      // Calculate reminder time
      const [bedHour, bedMin] = goal.target_bedtime.split(":").map(Number);
      const reminderMinutes = goal.reminder_minutes_before || 30;
      
      let reminderHour = bedHour;
      let reminderMin = bedMin - reminderMinutes;
      
      if (reminderMin < 0) {
        reminderMin += 60;
        reminderHour -= 1;
        if (reminderHour < 0) reminderHour += 24;
      }
      
      const reminderTime = `${reminderHour.toString().padStart(2, "0")}:${reminderMin.toString().padStart(2, "0")}`;
      
      // Check if current time matches reminder time (within 1 minute window)
      if (currentTime === reminderTime) {
        // Get user's push subscription
        const { data: subscriptions } = await supabase
          .from("push_subscriptions")
          .select("endpoint, p256dh, auth")
          .eq("user_id", goal.user_id);

        if (!subscriptions || subscriptions.length === 0) {
          console.log(`No push subscription for user ${goal.user_id}`);
          continue;
        }

        // Send notification to each subscription
        for (const sub of subscriptions) {
          try {
            const payload = JSON.stringify({
              title: "🌙 Schlafenszeit",
              body: `In ${reminderMinutes} Minuten ist Bettzeit! Bereite dich auf erholsamen Schlaf vor.`,
              url: "/lifestyle",
            });

            // Use web-push compatible endpoint
            const response = await fetch(sub.endpoint, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "TTL": "60",
              },
              body: payload,
            });

            if (response.ok) {
              notificationsSent.push(goal.user_id);
              console.log(`Notification sent to user ${goal.user_id}`);
            } else {
              console.error(`Failed to send to ${goal.user_id}: ${response.status}`);
            }
          } catch (pushError) {
            console.error(`Push error for user ${goal.user_id}:`, pushError);
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        notificationsSent: notificationsSent.length,
        checkedUsers: usersToRemind?.length || 0,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error:", message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
