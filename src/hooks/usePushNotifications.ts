import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

// VAPID public key - should be set via environment variable
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || "";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const usePushNotifications = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supported = "serviceWorker" in navigator && "PushManager" in window;
    setIsSupported(supported);

    if (supported && user) {
      checkSubscription();
    } else {
      setLoading(false);
    }
  }, [user]);

  const checkSubscription = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // Check if subscription exists in database
        const { data } = await supabase
          .from("push_subscriptions")
          .select("id")
          .eq("user_id", user.id)
          .eq("endpoint", subscription.endpoint)
          .maybeSingle();

        setIsSubscribed(!!data);
      } else {
        setIsSubscribed(false);
      }
    } catch (error) {
      console.error("Error checking subscription:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const subscribe = useCallback(async () => {
    if (!user || !isSupported || !VAPID_PUBLIC_KEY) {
      toast({
        title: "Fehler",
        description: "Push-Benachrichtigungen sind nicht verfügbar.",
        variant: "destructive",
      });
      return false;
    }

    try {
      setLoading(true);

      // Register service worker
      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      // Request notification permission
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        toast({
          title: "Berechtigung verweigert",
          description: "Bitte erlaube Push-Benachrichtigungen in deinen Browser-Einstellungen.",
          variant: "destructive",
        });
        return false;
      }

      // Subscribe to push
      const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey.buffer as ArrayBuffer,
      });

      const subscriptionJson = subscription.toJSON();
      
      if (!subscriptionJson.keys?.p256dh || !subscriptionJson.keys?.auth) {
        throw new Error("Invalid subscription keys");
      }

      // Save to database
      const { error } = await supabase.from("push_subscriptions").upsert({
        user_id: user.id,
        endpoint: subscription.endpoint,
        p256dh: subscriptionJson.keys.p256dh,
        auth: subscriptionJson.keys.auth,
      }, {
        onConflict: "user_id,endpoint",
      });

      if (error) throw error;

      setIsSubscribed(true);
      toast({
        title: "Aktiviert!",
        description: "Du erhältst jetzt tägliche Streak-Erinnerungen.",
      });
      return true;
    } catch (error) {
      console.error("Error subscribing to push:", error);
      toast({
        title: "Fehler",
        description: "Push-Benachrichtigungen konnten nicht aktiviert werden.",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, isSupported, toast]);

  const unsubscribe = useCallback(async () => {
    if (!user) return false;

    try {
      setLoading(true);

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();

        // Remove from database
        await supabase
          .from("push_subscriptions")
          .delete()
          .eq("user_id", user.id)
          .eq("endpoint", subscription.endpoint);
      }

      setIsSubscribed(false);
      toast({
        title: "Deaktiviert",
        description: "Du erhältst keine Streak-Erinnerungen mehr.",
      });
      return true;
    } catch (error) {
      console.error("Error unsubscribing:", error);
      toast({
        title: "Fehler",
        description: "Benachrichtigungen konnten nicht deaktiviert werden.",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  return {
    isSupported,
    isSubscribed,
    loading,
    subscribe,
    unsubscribe,
  };
};
