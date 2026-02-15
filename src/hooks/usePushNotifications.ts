import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export function usePushNotifications() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [loading, setLoading] = useState(true);
  const [permission, setPermission] = useState<NotificationPermission>("default");

  useEffect(() => {
    // Check if push notifications are supported
    const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
    setIsSupported(supported);
    
    if (supported) {
      setPermission(Notification.permission);
    }
    
    checkSubscription();
  }, [user]);

  const checkSubscription = useCallback(async () => {
    if (!user || !("serviceWorker" in navigator)) {
      setLoading(false);
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await (registration as any).pushManager.getSubscription();
      
      if (subscription) {
        // Check if it's stored in our database
        const { data } = await supabase
          .from("push_subscriptions")
          .select("id")
          .eq("user_id", user.id)
          .eq("endpoint", subscription.endpoint)
          .single();
        
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
    if (!user || !isSupported) return false;

    try {
      // Request notification permission
      const permission = await Notification.requestPermission();
      setPermission(permission);
      
      if (permission !== "granted") {
        toast({
          title: "Benachrichtigungen blockiert",
          description: "Bitte erlaube Benachrichtigungen in deinen Browser-Einstellungen.",
          variant: "destructive",
        });
        return false;
      }

      // Register service worker if not already
      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      // Get VAPID public key from environment
      const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      
      if (!vapidPublicKey) {
        console.error("VAPID public key not configured");
        toast({
          title: "Konfigurationsfehler",
          description: "Push-Benachrichtigungen sind nicht konfiguriert.",
          variant: "destructive",
        });
        return false;
      }

      // Subscribe to push
      const subscription = await (registration as any).pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidPublicKey,
      });

      // Extract keys
      const p256dhKey = subscription.getKey("p256dh");
      const authKey = subscription.getKey("auth");
      
      if (!p256dhKey || !authKey) {
        throw new Error("Failed to get subscription keys");
      }
      
      const p256dh = btoa(String.fromCharCode(...new Uint8Array(p256dhKey)));
      const auth = btoa(String.fromCharCode(...new Uint8Array(authKey)));

      // Save to database
      const { error } = await supabase
        .from("push_subscriptions")
        .upsert({
          user_id: user.id,
          endpoint: subscription.endpoint,
          p256dh,
          auth,
        }, { onConflict: "user_id,endpoint" });

      if (error) throw error;

      setIsSubscribed(true);
      toast({
        title: "Benachrichtigungen aktiviert ✓",
        description: "Du erhältst jetzt Erinnerungen.",
      });
      
      return true;
    } catch (error) {
      console.error("Error subscribing:", error);
      toast({
        title: "Fehler",
        description: "Benachrichtigungen konnten nicht aktiviert werden.",
        variant: "destructive",
      });
      return false;
    }
  }, [user, isSupported, toast]);

  const unsubscribe = useCallback(async () => {
    if (!user) return false;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await (registration as any).pushManager.getSubscription();
      
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
        title: "Benachrichtigungen deaktiviert",
      });
      
      return true;
    } catch (error) {
      console.error("Error unsubscribing:", error);
      return false;
    }
  }, [user, toast]);

  return {
    isSubscribed,
    isSupported,
    loading,
    permission,
    subscribe,
    unsubscribe,
    checkSubscription,
  };
}

// Helper function to convert VAPID key
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
