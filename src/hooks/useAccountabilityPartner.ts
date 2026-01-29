import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface AccountabilityPartner {
  id: string;
  partner_id: string;
  partner_name: string | null;
  partner_avatar: string | null;
  is_active: boolean;
  started_at: string;
  todayCheckedIn: boolean;
  partnerCheckedIn: boolean;
  streak: number;
}

export interface CheckIn {
  id: string;
  user_id: string;
  check_in_date: string;
  completed_goals: string[];
  mood_score: number | null;
  notes: string | null;
  created_at: string;
}

export function useAccountabilityPartner() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [partner, setPartner] = useState<AccountabilityPartner | null>(null);
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch partner
  const fetchPartner = useCallback(async () => {
    if (!user) {
      setPartner(null);
      return;
    }

    const { data, error } = await supabase
      .from("accountability_partners")
      .select("*")
      .or(`user_id.eq.${user.id},partner_id.eq.${user.id}`)
      .eq("is_active", true)
      .maybeSingle();

    if (error) {
      console.error("Error fetching partner:", error);
      setPartner(null);
      return;
    }

    if (!data) {
      setPartner(null);
      return;
    }

    const partnerId = data.user_id === user.id ? data.partner_id : data.user_id;

    // Get partner profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name, avatar_url")
      .eq("user_id", partnerId)
      .single();

    // Get today's check-ins
    const today = new Date().toISOString().split("T")[0];
    const { data: todayCheckIns } = await supabase
      .from("partner_check_ins")
      .select("user_id")
      .eq("partnership_id", data.id)
      .eq("check_in_date", today);

    const myCheckIn = todayCheckIns?.some(c => c.user_id === user.id) || false;
    const partnerCheckIn = todayCheckIns?.some(c => c.user_id === partnerId) || false;

    // Calculate streak (consecutive days both checked in)
    const { data: allCheckIns } = await supabase
      .from("partner_check_ins")
      .select("user_id, check_in_date")
      .eq("partnership_id", data.id)
      .order("check_in_date", { ascending: false });

    let streak = 0;
    if (allCheckIns) {
      const dateMap = new Map<string, Set<string>>();
      allCheckIns.forEach(c => {
        const existing = dateMap.get(c.check_in_date) || new Set();
        existing.add(c.user_id);
        dateMap.set(c.check_in_date, existing);
      });

      const sortedDates = Array.from(dateMap.keys()).sort().reverse();
      for (const date of sortedDates) {
        if (dateMap.get(date)?.size === 2) {
          streak++;
        } else {
          break;
        }
      }
    }

    setPartner({
      id: data.id,
      partner_id: partnerId,
      partner_name: profile?.display_name || null,
      partner_avatar: profile?.avatar_url || null,
      is_active: data.is_active,
      started_at: data.started_at,
      todayCheckedIn: myCheckIn,
      partnerCheckedIn: partnerCheckIn,
      streak,
    });
  }, [user]);

  // Fetch check-in history
  const fetchCheckIns = useCallback(async () => {
    if (!user || !partner) return;

    const { data, error } = await supabase
      .from("partner_check_ins")
      .select("*")
      .eq("partnership_id", partner.id)
      .order("check_in_date", { ascending: false })
      .limit(30);

    if (error) {
      console.error("Error fetching check-ins:", error);
      return;
    }

    setCheckIns(data || []);
  }, [user, partner]);

  // Create partnership with friend
  const createPartnership = async (friendId: string): Promise<boolean> => {
    if (!user) return false;

    // Check if I already have a partner
    const { data: myExisting } = await supabase
      .from("accountability_partners")
      .select("id")
      .or(`user_id.eq.${user.id},partner_id.eq.${user.id}`)
      .eq("is_active", true)
      .maybeSingle();

    if (myExisting) {
      toast({
        title: "Du hast bereits einen Partner",
        description: "Beende zuerst deine aktuelle Partnerschaft.",
        variant: "destructive",
      });
      return false;
    }

    // Check if friend already has a partner
    const { data: friendExisting } = await supabase
      .from("accountability_partners")
      .select("id")
      .or(`user_id.eq.${friendId},partner_id.eq.${friendId}`)
      .eq("is_active", true)
      .maybeSingle();

    if (friendExisting) {
      toast({
        title: "Bereits vergeben",
        description: "Dieser Freund hat bereits einen Partner.",
        variant: "destructive",
      });
      return false;
    }

    const { error } = await supabase
      .from("accountability_partners")
      .insert({
        user_id: user.id,
        partner_id: friendId,
      });

    if (error) {
      toast({
        title: "Fehler",
        description: "Partnerschaft konnte nicht erstellt werden.",
        variant: "destructive",
      });
      return false;
    }

    toast({ title: "Accountability Partner verbunden! ✓" });
    await fetchPartner();
    return true;
  };

  // Daily check-in
  const checkIn = async (
    completedGoals: string[],
    moodScore?: number,
    notes?: string
  ): Promise<boolean> => {
    if (!user || !partner) return false;

    const today = new Date().toISOString().split("T")[0];

    const { error } = await supabase
      .from("partner_check_ins")
      .upsert({
        partnership_id: partner.id,
        user_id: user.id,
        check_in_date: today,
        completed_goals: completedGoals,
        mood_score: moodScore,
        notes,
      }, {
        onConflict: "partnership_id,user_id,check_in_date",
      });

    if (error) {
      toast({
        title: "Fehler",
        description: "Check-in konnte nicht gespeichert werden.",
        variant: "destructive",
      });
      return false;
    }

    toast({ title: "Check-in gespeichert! ✓" });
    await fetchPartner();
    return true;
  };

  // End partnership
  const endPartnership = async (): Promise<boolean> => {
    if (!partner) return false;

    const { error } = await supabase
      .from("accountability_partners")
      .update({ 
        is_active: false, 
        ended_at: new Date().toISOString() 
      })
      .eq("id", partner.id);

    if (error) {
      toast({
        title: "Fehler",
        description: "Partnerschaft konnte nicht beendet werden.",
        variant: "destructive",
      });
      return false;
    }

    toast({ title: "Partnerschaft beendet" });
    setPartner(null);
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
      await fetchPartner();
      setLoading(false);
    };

    init();
  }, [user, fetchPartner]);

  // Fetch check-ins when partner changes
  useEffect(() => {
    if (partner) {
      fetchCheckIns();
    }
  }, [partner, fetchCheckIns]);

  return {
    partner,
    checkIns,
    loading,
    createPartnership,
    checkIn,
    endPartnership,
    refetch: fetchPartner,
  };
}
