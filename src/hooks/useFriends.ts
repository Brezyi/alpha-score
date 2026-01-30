import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface Friend {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  friend_code: string;
  privacy_settings: {
    show_score: "none" | "delta_only" | "full";
    show_streak: boolean;
    show_challenges: boolean;
  };
  connection_id: string;
  connected_since: string;
}

export interface FriendRequest {
  id: string;
  requester_id: string;
  requester_name: string | null;
  requester_avatar: string | null;
  created_at: string;
}

export interface PrivacySettings {
  show_score: "none" | "delta_only" | "full";
  show_streak: boolean;
  show_challenges: boolean;
  allow_challenge_invites: boolean;
}

export function useFriends() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<string[]>([]);
  const [myFriendCode, setMyFriendCode] = useState<string | null>(null);
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch friend code
  const fetchFriendCode = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("friend_codes")
      .select("code")
      .eq("user_id", user.id)
      .single();

    if (data?.code) {
      setMyFriendCode(data.code);
    } else {
      // No code exists, generate one
      const newCode = await generateFriendCode();
      setMyFriendCode(newCode);
    }
  }, [user]);

  // Generate friend code
  const generateFriendCode = async (): Promise<string | null> => {
    if (!user) return null;

    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    
    const { data, error } = await supabase
      .from("friend_codes")
      .insert({ user_id: user.id, code })
      .select("code")
      .single();

    if (error) {
      console.error("Error generating friend code:", error);
      return null;
    }
    return data?.code || null;
  };

  // Fetch friends list
  const fetchFriends = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("friend_connections")
      .select(`
        id,
        requester_id,
        addressee_id,
        created_at
      `)
      .eq("status", "accepted")
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

    if (error) {
      console.error("Error fetching friends:", error);
      return;
    }

    // Get friend user IDs
    const friendUserIds = data?.map(conn => 
      conn.requester_id === user.id ? conn.addressee_id : conn.requester_id
    ) || [];

    if (friendUserIds.length === 0) {
      setFriends([]);
      return;
    }

    // Fetch profiles and friend codes
    const [profilesRes, codesRes, privacyRes] = await Promise.all([
      supabase.from("profiles").select("user_id, display_name, avatar_url").in("user_id", friendUserIds),
      supabase.from("friend_codes").select("user_id, code").in("user_id", friendUserIds),
      supabase.from("friend_privacy_settings").select("*").in("user_id", friendUserIds)
    ]);

    const profilesMap = new Map(profilesRes.data?.map(p => [p.user_id, p]) || []);
    const codesMap = new Map(codesRes.data?.map(c => [c.user_id, c.code]) || []);
    const privacyMap = new Map(privacyRes.data?.map(p => [p.user_id, p]) || []);

    const friendsList: Friend[] = data?.map(conn => {
      const friendId = conn.requester_id === user.id ? conn.addressee_id : conn.requester_id;
      const profile = profilesMap.get(friendId);
      const privacy = privacyMap.get(friendId);
      const friendCode = codesMap.get(friendId) || "";
      
      // Use display_name, fallback to friend code prefix, then to generic name
      const displayName = profile?.display_name || (friendCode ? `Nutzer ${friendCode.slice(0, 4)}` : null);

      return {
        id: friendId,
        user_id: friendId,
        display_name: displayName,
        avatar_url: profile?.avatar_url || null,
        friend_code: friendCode,
        privacy_settings: {
          show_score: (privacy?.show_score as "none" | "delta_only" | "full") || "delta_only",
          show_streak: privacy?.show_streak ?? true,
          show_challenges: privacy?.show_challenges ?? true,
        },
        connection_id: conn.id,
        connected_since: conn.created_at,
      };
    }) || [];

    setFriends(friendsList);
  }, [user]);

  // Fetch pending requests (received) - always get fresh profile data
  const fetchPendingRequests = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("friend_connections")
      .select("id, requester_id, created_at")
      .eq("addressee_id", user.id)
      .eq("status", "pending");

    if (error) {
      console.error("Error fetching pending requests:", error);
      return;
    }

    if (!data || data.length === 0) {
      setPendingRequests([]);
      return;
    }

    const requesterIds = data.map(r => r.requester_id);
    
    // Fetch profiles and friend codes - profiles have priority for display_name
    const [profilesRes, codesRes] = await Promise.all([
      supabase.from("profiles").select("user_id, display_name, avatar_url").in("user_id", requesterIds),
      supabase.from("friend_codes").select("user_id, code").in("user_id", requesterIds)
    ]);

    const profilesMap = new Map(profilesRes.data?.map(p => [p.user_id, p]) || []);
    const codesMap = new Map(codesRes.data?.map(c => [c.user_id, c.code]) || []);

    const requests: FriendRequest[] = data.map(req => {
      const profile = profilesMap.get(req.requester_id);
      const code = codesMap.get(req.requester_id);
      
      // PRIORITY: 1. profile.display_name, 2. Friend code prefix, 3. Generic fallback
      // Check that display_name is not null/undefined/empty string
      let displayName: string;
      if (profile?.display_name && profile.display_name.trim() !== '') {
        displayName = profile.display_name;
      } else if (code) {
        displayName = `Nutzer ${code.slice(0, 4)}`;
      } else {
        displayName = "Neuer Nutzer";
      }
      
      return {
        id: req.id,
        requester_id: req.requester_id,
        requester_name: displayName,
        requester_avatar: profile?.avatar_url || null,
        created_at: req.created_at,
      };
    });

    setPendingRequests(requests);
  }, [user]);

  // Fetch sent requests
  const fetchSentRequests = useCallback(async () => {
    if (!user) return;

    const { data } = await supabase
      .from("friend_connections")
      .select("addressee_id")
      .eq("requester_id", user.id)
      .eq("status", "pending");

    setSentRequests(data?.map(r => r.addressee_id) || []);
  }, [user]);

  // Fetch privacy settings
  const fetchPrivacySettings = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("friend_privacy_settings")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching privacy settings:", error);
      return;
    }

    if (data) {
      setPrivacySettings({
        show_score: data.show_score as "none" | "delta_only" | "full",
        show_streak: data.show_streak,
        show_challenges: data.show_challenges,
        allow_challenge_invites: data.allow_challenge_invites,
      });
    } else {
      // Create default settings
      const { data: newSettings } = await supabase
        .from("friend_privacy_settings")
        .insert({ user_id: user.id })
        .select()
        .single();

      if (newSettings) {
        setPrivacySettings({
          show_score: newSettings.show_score as "none" | "delta_only" | "full",
          show_streak: newSettings.show_streak,
          show_challenges: newSettings.show_challenges,
          allow_challenge_invites: newSettings.allow_challenge_invites,
        });
      }
    }
  }, [user]);

  // Send friend request by code
  const sendFriendRequest = async (code: string): Promise<boolean> => {
    if (!user || !code.trim()) return false;

    // Find user by code and get their profile for the success message
    const { data: codeData, error: codeError } = await supabase
      .from("friend_codes")
      .select("user_id")
      .eq("code", code.toUpperCase())
      .maybeSingle();

    if (codeError || !codeData) {
      toast({
        title: "Code nicht gefunden",
        description: "Dieser Freundes-Code existiert nicht.",
        variant: "destructive",
      });
      return false;
    }

    // Get the profile of the target user for the toast message
    const { data: profileData } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("user_id", codeData.user_id)
      .single();

    const targetName = profileData?.display_name || `Nutzer ${code.slice(0, 4)}`;

    return sendFriendRequestByUserId(codeData.user_id, targetName);
  };

  // Send friend request by user ID (for search results)
  const sendFriendRequestByUserId = async (targetUserId: string, targetDisplayName?: string): Promise<boolean> => {
    if (!user || !targetUserId) return false;

    if (targetUserId === user.id) {
      toast({
        title: "Das bist du!",
        description: "Du kannst dir selbst keine Anfrage senden.",
        variant: "destructive",
      });
      return false;
    }

    // Check if already friends or pending
    const { data: existing } = await supabase
      .from("friend_connections")
      .select("id, status")
      .or(`and(requester_id.eq.${user.id},addressee_id.eq.${targetUserId}),and(requester_id.eq.${targetUserId},addressee_id.eq.${user.id})`)
      .maybeSingle();

    if (existing) {
      if (existing.status === "accepted") {
        toast({
          title: "Bereits befreundet",
          description: "Ihr seid bereits Freunde!",
        });
      } else if (existing.status === "pending") {
        toast({
          title: "Anfrage existiert",
          description: "Eine Anfrage ist bereits ausstehend.",
        });
      } else if (existing.status === "blocked") {
        toast({
          title: "Nicht möglich",
          description: "Diese Verbindung ist nicht möglich.",
          variant: "destructive",
        });
      }
      return false;
    }

    // Send request
    const { error } = await supabase
      .from("friend_connections")
      .insert({
        requester_id: user.id,
        addressee_id: targetUserId,
        status: "pending",
      });

    if (error) {
      console.error("Error sending friend request:", error);
      toast({
        title: "Fehler",
        description: "Anfrage konnte nicht gesendet werden.",
        variant: "destructive",
      });
      return false;
    }

    // Get the display name if not provided
    let displayName = targetDisplayName;
    if (!displayName) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("user_id", targetUserId)
        .single();
      displayName = profile?.display_name || "Nutzer";
    }

    toast({ title: `Anfrage an ${displayName} gesendet! ✓` });
    
    // Optimistic update for sent requests
    setSentRequests(prev => [...prev, targetUserId]);
    
    return true;
  };

  // Search users by display name
  const searchUsers = async (query: string): Promise<Array<{
    user_id: string;
    display_name: string | null;
    avatar_url: string | null;
    friend_code: string;
  }>> => {
    if (!user || query.length < 2) return [];

    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name, avatar_url")
      .ilike("display_name", `%${query}%`)
      .neq("user_id", user.id)
      .limit(20);

    if (!profiles || profiles.length === 0) return [];

    const userIds = profiles.map(p => p.user_id);
    const { data: codes } = await supabase
      .from("friend_codes")
      .select("user_id, code")
      .in("user_id", userIds);

    const codesMap = new Map(codes?.map(c => [c.user_id, c.code]) || []);

    return profiles.map(p => ({
      user_id: p.user_id,
      display_name: p.display_name,
      avatar_url: p.avatar_url,
      friend_code: codesMap.get(p.user_id) || "",
    }));
  };

  // Accept friend request - optimistic update with proper name
  const acceptRequest = async (requestId: string): Promise<boolean> => {
    // Find the request to get requester info
    const request = pendingRequests.find(r => r.id === requestId);
    setPendingRequests(prev => prev.filter(r => r.id !== requestId));

    const { error } = await supabase
      .from("friend_connections")
      .update({ status: "accepted", updated_at: new Date().toISOString() })
      .eq("id", requestId);

    if (error) {
      // Revert on error
      if (request) {
        setPendingRequests(prev => [...prev, request]);
      }
      toast({
        title: "Fehler",
        description: "Anfrage konnte nicht angenommen werden.",
        variant: "destructive",
      });
      return false;
    }

    // Use the requester's actual name from the request if available
    const friendName = request?.requester_name || "Freund";
    toast({ title: `${friendName} hinzugefügt! ✓` });
    
    // Force immediate refetch to get complete profile data
    await fetchFriends();
    return true;
  };

  // Decline friend request - optimistic update
  const declineRequest = async (requestId: string): Promise<boolean> => {
    // Optimistic update - remove from pending immediately
    const request = pendingRequests.find(r => r.id === requestId);
    setPendingRequests(prev => prev.filter(r => r.id !== requestId));

    const { error } = await supabase
      .from("friend_connections")
      .delete()
      .eq("id", requestId);

    if (error) {
      // Revert on error
      if (request) {
        setPendingRequests(prev => [...prev, request]);
      }
      toast({
        title: "Fehler",
        description: "Anfrage konnte nicht abgelehnt werden.",
        variant: "destructive",
      });
      return false;
    }

    toast({ title: "Anfrage abgelehnt" });
    return true;
  };

  // Remove friend - optimistic update
  const removeFriend = async (connectionId: string): Promise<boolean> => {
    // Optimistic update - remove from state immediately
    setFriends(prev => prev.filter(f => f.connection_id !== connectionId));

    const { error } = await supabase
      .from("friend_connections")
      .delete()
      .eq("id", connectionId);

    if (error) {
      // Revert on error
      await fetchFriends();
      toast({
        title: "Fehler",
        description: "Freund konnte nicht entfernt werden.",
        variant: "destructive",
      });
      return false;
    }

    toast({ title: "Freund entfernt" });
    return true;
  };

  // Update privacy settings
  const updatePrivacySettings = async (settings: Partial<PrivacySettings>): Promise<boolean> => {
    if (!user) return false;

    const { error } = await supabase
      .from("friend_privacy_settings")
      .update({ ...settings, updated_at: new Date().toISOString() })
      .eq("user_id", user.id);

    if (error) {
      toast({
        title: "Fehler",
        description: "Einstellungen konnten nicht gespeichert werden.",
        variant: "destructive",
      });
      return false;
    }

    setPrivacySettings(prev => prev ? { ...prev, ...settings } : null);
    toast({ title: "Einstellungen gespeichert ✓" });
    return true;
  };

  // Initial fetch
  useEffect(() => {
    const init = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      await Promise.all([
        fetchFriendCode(),
        fetchFriends(),
        fetchPendingRequests(),
        fetchSentRequests(),
        fetchPrivacySettings(),
      ]);
      setLoading(false);
    };

    init();
  }, [user, fetchFriendCode, fetchFriends, fetchPendingRequests, fetchSentRequests, fetchPrivacySettings]);

  // Realtime subscription for friend connections
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("friend_connections_realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "friend_connections",
        },
        (payload) => {
          // Check if this change involves the current user
          const record = payload.new as any || payload.old as any;
          if (record?.requester_id === user.id || record?.addressee_id === user.id) {
            // Refetch all friend-related data
            fetchFriends();
            fetchPendingRequests();
            fetchSentRequests();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchFriends, fetchPendingRequests, fetchSentRequests]);

  return {
    friends,
    pendingRequests,
    sentRequests,
    myFriendCode,
    privacySettings,
    loading,
    sendFriendRequest,
    sendFriendRequestByUserId,
    searchUsers,
    acceptRequest,
    declineRequest,
    removeFriend,
    updatePrivacySettings,
    refetch: () => Promise.all([fetchFriends(), fetchPendingRequests(), fetchSentRequests()]),
  };
}
