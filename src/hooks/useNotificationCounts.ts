import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface NotificationCounts {
  unreadMessages: number;
  pendingFriendRequests: number;
  pendingPartnerRequests: number;
  total: number;
}

export function useNotificationCounts() {
  const { user } = useAuth();
  const [counts, setCounts] = useState<NotificationCounts>({
    unreadMessages: 0,
    pendingFriendRequests: 0,
    pendingPartnerRequests: 0,
    total: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchCounts = useCallback(async () => {
    if (!user) {
      setCounts({ unreadMessages: 0, pendingFriendRequests: 0, pendingPartnerRequests: 0, total: 0 });
      setLoading(false);
      return;
    }

    try {
      // Fetch unread messages count
      const { count: messagesCount } = await supabase
        .from("friend_messages")
        .select("*", { count: "exact", head: true })
        .eq("receiver_id", user.id)
        .eq("is_read", false);

      // Fetch pending friend requests
      const { count: friendRequestsCount } = await supabase
        .from("friend_connections")
        .select("*", { count: "exact", head: true })
        .eq("addressee_id", user.id)
        .eq("status", "pending");

      // Fetch pending partner requests
      const { count: partnerRequestsCount } = await supabase
        .from("partner_requests")
        .select("*", { count: "exact", head: true })
        .eq("addressee_id", user.id)
        .eq("status", "pending");

      const unreadMessages = messagesCount || 0;
      const pendingFriendRequests = friendRequestsCount || 0;
      const pendingPartnerRequests = partnerRequestsCount || 0;

      setCounts({
        unreadMessages,
        pendingFriendRequests,
        pendingPartnerRequests,
        total: unreadMessages + pendingFriendRequests + pendingPartnerRequests,
      });
    } catch (error) {
      console.error("Error fetching notification counts:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Initial fetch
  useEffect(() => {
    fetchCounts();
  }, [fetchCounts]);

  // Realtime subscription for updates
  useEffect(() => {
    if (!user) return;

    // Subscribe to friend_messages changes
    const messagesChannel = supabase
      .channel("notification_messages")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "friend_messages",
          filter: `receiver_id=eq.${user.id}`,
        },
        () => {
          fetchCounts();
        }
      )
      .subscribe();

    // Subscribe to friend_connections changes
    const friendsChannel = supabase
      .channel("notification_friends")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "friend_connections",
          filter: `addressee_id=eq.${user.id}`,
        },
        () => {
          fetchCounts();
        }
      )
      .subscribe();

    // Subscribe to partner_requests changes
    const partnerChannel = supabase
      .channel("notification_partners")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "partner_requests",
          filter: `addressee_id=eq.${user.id}`,
        },
        () => {
          fetchCounts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(friendsChannel);
      supabase.removeChannel(partnerChannel);
    };
  }, [user, fetchCounts]);

  return {
    ...counts,
    loading,
    refetch: fetchCounts,
  };
}
