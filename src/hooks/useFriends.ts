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

    if (error && error.code !== "PGRST116") {
      // If no code exists, generate one
      const newCode = await generateFriendCode();
      setMyFriendCode(newCode);
    } else if (data) {
      setMyFriendCode(data.code);
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

      return {
        id: friendId,
        user_id: friendId,
        display_name: profile?.display_name || null,
        avatar_url: profile?.avatar_url || null,
        friend_code: codesMap.get(friendId) || "",
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

  // Fetch pending requests (received)
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
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name, avatar_url")
      .in("user_id", requesterIds);

    const profilesMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

    const requests: FriendRequest[] = data.map(req => ({
      id: req.id,
      requester_id: req.requester_id,
      requester_name: profilesMap.get(req.requester_id)?.display_name || null,
      requester_avatar: profilesMap.get(req.requester_id)?.avatar_url || null,
      created_at: req.created_at,
    }));

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
    if (!user) return false;

    // Find user by code
    const { data: codeData, error: codeError } = await supabase
      .from("friend_codes")
      .select("user_id")
      .eq("code", code.toUpperCase())
      .single();

    if (codeError || !codeData) {
      toast({
        title: "Code nicht gefunden",
        description: "Dieser Freundes-Code existiert nicht.",
        variant: "destructive",
      });
      return false;
    }

    if (codeData.user_id === user.id) {
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
      .or(`and(requester_id.eq.${user.id},addressee_id.eq.${codeData.user_id}),and(requester_id.eq.${codeData.user_id},addressee_id.eq.${user.id})`)
      .single();

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
      }
      return false;
    }

    // Send request
    const { error } = await supabase
      .from("friend_connections")
      .insert({
        requester_id: user.id,
        addressee_id: codeData.user_id,
        status: "pending",
      });

    if (error) {
      toast({
        title: "Fehler",
        description: "Anfrage konnte nicht gesendet werden.",
        variant: "destructive",
      });
      return false;
    }

    toast({ title: "Anfrage gesendet! ✓" });
    await fetchSentRequests();
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

  // Accept friend request
  const acceptRequest = async (requestId: string): Promise<boolean> => {
    const { error } = await supabase
      .from("friend_connections")
      .update({ status: "accepted", updated_at: new Date().toISOString() })
      .eq("id", requestId);

    if (error) {
      toast({
        title: "Fehler",
        description: "Anfrage konnte nicht angenommen werden.",
        variant: "destructive",
      });
      return false;
    }

    toast({ title: "Freund hinzugefügt! ✓" });
    await Promise.all([fetchFriends(), fetchPendingRequests()]);
    return true;
  };

  // Decline friend request
  const declineRequest = async (requestId: string): Promise<boolean> => {
    const { error } = await supabase
      .from("friend_connections")
      .delete()
      .eq("id", requestId);

    if (error) {
      toast({
        title: "Fehler",
        description: "Anfrage konnte nicht abgelehnt werden.",
        variant: "destructive",
      });
      return false;
    }

    toast({ title: "Anfrage abgelehnt" });
    await fetchPendingRequests();
    return true;
  };

  // Remove friend
  const removeFriend = async (connectionId: string): Promise<boolean> => {
    const { error } = await supabase
      .from("friend_connections")
      .delete()
      .eq("id", connectionId);

    if (error) {
      toast({
        title: "Fehler",
        description: "Freund konnte nicht entfernt werden.",
        variant: "destructive",
      });
      return false;
    }

    toast({ title: "Freund entfernt" });
    await fetchFriends();
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

  return {
    friends,
    pendingRequests,
    sentRequests,
    myFriendCode,
    privacySettings,
    loading,
    sendFriendRequest,
    searchUsers,
    acceptRequest,
    declineRequest,
    removeFriend,
    updatePrivacySettings,
    refetch: () => Promise.all([fetchFriends(), fetchPendingRequests(), fetchSentRequests()]),
  };
}
