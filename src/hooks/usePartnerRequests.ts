import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface PartnerRequest {
  id: string;
  requester_id: string;
  requester_name: string | null;
  requester_avatar: string | null;
  addressee_id: string;
  addressee_name: string | null;
  addressee_avatar: string | null;
  status: "pending" | "accepted" | "declined";
  created_at: string;
}

export function usePartnerRequests() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [incomingRequests, setIncomingRequests] = useState<PartnerRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<PartnerRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch all partner requests
  const fetchRequests = useCallback(async () => {
    if (!user) {
      setIncomingRequests([]);
      setOutgoingRequests([]);
      return;
    }

    const { data, error } = await supabase
      .from("partner_requests")
      .select("*")
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching partner requests:", error);
      return;
    }

    if (!data || data.length === 0) {
      setIncomingRequests([]);
      setOutgoingRequests([]);
      return;
    }

    // Get all user IDs we need profiles for
    const userIds = new Set<string>();
    data.forEach((req) => {
      userIds.add(req.requester_id);
      userIds.add(req.addressee_id);
    });

    // Fetch profiles
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name, avatar_url")
      .in("user_id", Array.from(userIds));

    const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);

    const incoming: PartnerRequest[] = [];
    const outgoing: PartnerRequest[] = [];

    data.forEach((req) => {
      const requesterProfile = profileMap.get(req.requester_id);
      const addresseeProfile = profileMap.get(req.addressee_id);

      const mapped: PartnerRequest = {
        id: req.id,
        requester_id: req.requester_id,
        requester_name: requesterProfile?.display_name || null,
        requester_avatar: requesterProfile?.avatar_url || null,
        addressee_id: req.addressee_id,
        addressee_name: addresseeProfile?.display_name || null,
        addressee_avatar: addresseeProfile?.avatar_url || null,
        status: req.status,
        created_at: req.created_at,
      };

      if (req.addressee_id === user.id) {
        incoming.push(mapped);
      } else {
        outgoing.push(mapped);
      }
    });

    setIncomingRequests(incoming);
    setOutgoingRequests(outgoing);
  }, [user]);

  // Send partner request
  const sendPartnerRequest = async (friendId: string): Promise<boolean> => {
    if (!user) return false;

    // Check if user already has an active partner
    const { data: existingPartner } = await supabase
      .from("accountability_partners")
      .select("id")
      .or(`user_id.eq.${user.id},partner_id.eq.${user.id}`)
      .eq("is_active", true)
      .maybeSingle();

    if (existingPartner) {
      toast({
        title: "Du hast bereits einen Partner",
        description: "Beende zuerst deine aktuelle Partnerschaft.",
        variant: "destructive",
      });
      return false;
    }

    // Check if friend already has an active partner
    const { data: friendPartner } = await supabase
      .from("accountability_partners")
      .select("id")
      .or(`user_id.eq.${friendId},partner_id.eq.${friendId}`)
      .eq("is_active", true)
      .maybeSingle();

    if (friendPartner) {
      toast({
        title: "Bereits vergeben",
        description: "Dieser Freund hat bereits einen Partner.",
        variant: "destructive",
      });
      return false;
    }

    // Check for existing requests (any status) - may return multiple
    const { data: existingRequests } = await supabase
      .from("partner_requests")
      .select("id, status")
      .or(
        `and(requester_id.eq.${user.id},addressee_id.eq.${friendId}),and(requester_id.eq.${friendId},addressee_id.eq.${user.id})`
      );

    if (existingRequests && existingRequests.length > 0) {
      // Check if any is pending
      const pendingRequest = existingRequests.find(r => r.status === "pending");
      if (pendingRequest) {
        toast({
          title: "Anfrage existiert bereits",
          description: "Es gibt bereits eine offene Anfrage.",
          variant: "destructive",
        });
        return false;
      }
      
      // Delete ALL old declined/accepted requests to allow new request
      const idsToDelete = existingRequests.map(r => r.id);
      const { error: deleteError } = await supabase
        .from("partner_requests")
        .delete()
        .in("id", idsToDelete);
      
      if (deleteError) {
        console.error("Error deleting old requests:", deleteError);
        toast({
          title: "Fehler",
          description: "Alte Anfragen konnten nicht entfernt werden.",
          variant: "destructive",
        });
        return false;
      }
    }

    const { error } = await supabase.from("partner_requests").insert({
      requester_id: user.id,
      addressee_id: friendId,
    });

    if (error) {
      console.error("Error sending partner request:", error);
      toast({
        title: "Fehler",
        description: "Anfrage konnte nicht gesendet werden.",
        variant: "destructive",
      });
      return false;
    }

    toast({ title: "Partner-Anfrage gesendet! ✓" });
    await fetchRequests();
    return true;
  };

  // Accept partner request
  const acceptPartnerRequest = async (requestId: string): Promise<boolean> => {
    if (!user) return false;

    // Get the request details
    const { data: request } = await supabase
      .from("partner_requests")
      .select("*")
      .eq("id", requestId)
      .single();

    if (!request || request.addressee_id !== user.id) {
      toast({
        title: "Fehler",
        description: "Anfrage nicht gefunden.",
        variant: "destructive",
      });
      return false;
    }

    // Double-check neither party has an active partner
    const { data: myPartner } = await supabase
      .from("accountability_partners")
      .select("id")
      .or(`user_id.eq.${user.id},partner_id.eq.${user.id}`)
      .eq("is_active", true)
      .maybeSingle();

    const { data: theirPartner } = await supabase
      .from("accountability_partners")
      .select("id")
      .or(`user_id.eq.${request.requester_id},partner_id.eq.${request.requester_id}`)
      .eq("is_active", true)
      .maybeSingle();

    if (myPartner || theirPartner) {
      toast({
        title: "Nicht mehr verfügbar",
        description: "Du oder dein Freund haben bereits einen Partner.",
        variant: "destructive",
      });
      // Decline the request
      await supabase
        .from("partner_requests")
        .update({ status: "declined", responded_at: new Date().toISOString() })
        .eq("id", requestId);
      await fetchRequests();
      return false;
    }

    // Update request status
    const { error: updateError } = await supabase
      .from("partner_requests")
      .update({ status: "accepted", responded_at: new Date().toISOString() })
      .eq("id", requestId);

    if (updateError) {
      toast({
        title: "Fehler",
        description: "Anfrage konnte nicht akzeptiert werden.",
        variant: "destructive",
      });
      return false;
    }

    // Create the partnership
    const { error: partnerError } = await supabase.from("accountability_partners").insert({
      user_id: request.requester_id,
      partner_id: user.id,
    });

    if (partnerError) {
      toast({
        title: "Fehler",
        description: "Partnerschaft konnte nicht erstellt werden.",
        variant: "destructive",
      });
      return false;
    }

    toast({ title: "Partner-Anfrage angenommen! 🎉" });
    await fetchRequests();
    return true;
  };

  // Decline partner request
  const declinePartnerRequest = async (requestId: string): Promise<boolean> => {
    if (!user) return false;

    const { error } = await supabase
      .from("partner_requests")
      .update({ status: "declined", responded_at: new Date().toISOString() })
      .eq("id", requestId);

    if (error) {
      toast({
        title: "Fehler",
        description: "Anfrage konnte nicht abgelehnt werden.",
        variant: "destructive",
      });
      return false;
    }

    toast({ title: "Partner-Anfrage abgelehnt" });
    await fetchRequests();
    return true;
  };

  // Cancel outgoing request
  const cancelPartnerRequest = async (requestId: string): Promise<boolean> => {
    if (!user) return false;

    const { error } = await supabase
      .from("partner_requests")
      .delete()
      .eq("id", requestId)
      .eq("requester_id", user.id);

    if (error) {
      toast({
        title: "Fehler",
        description: "Anfrage konnte nicht zurückgezogen werden.",
        variant: "destructive",
      });
      return false;
    }

    toast({ title: "Anfrage zurückgezogen" });
    await fetchRequests();
    return true;
  };

  // Realtime subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("partner_requests_realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "partner_requests",
        },
        () => {
          fetchRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchRequests]);

  // Initial fetch
  useEffect(() => {
    const init = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      setLoading(true);
      await fetchRequests();
      setLoading(false);
    };
    init();
  }, [user, fetchRequests]);

  return {
    incomingRequests,
    outgoingRequests,
    loading,
    sendPartnerRequest,
    acceptPartnerRequest,
    declinePartnerRequest,
    cancelPartnerRequest,
    refetch: fetchRequests,
  };
}
