import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface AffiliateEarning {
  id: string;
  payment_amount: number;
  commission_amount: number;
  currency: string;
  status: string;
  created_at: string;
}

interface AffiliateStats {
  totalEarnings: number;
  pendingEarnings: number;
  paidEarnings: number;
  referralCount: number;
  conversionCount: number;
}

export function useAffiliate() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [earnings, setEarnings] = useState<AffiliateEarning[]>([]);
  const [stats, setStats] = useState<AffiliateStats>({
    totalEarnings: 0,
    pendingEarnings: 0,
    paidEarnings: 0,
    referralCount: 0,
    conversionCount: 0,
  });
  const [payoutEmail, setPayoutEmail] = useState<string | null>(null);
  const [payoutMethod, setPayoutMethod] = useState<string>("paypal");
  const [isLoading, setIsLoading] = useState(true);

  const fetchReferralCode = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("user_referral_codes")
      .select("code")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Error fetching referral code:", error);
      return;
    }

    if (data) {
      setReferralCode(data.code);
    } else {
      // Generate new code
      const newCode = generateReferralCode();
      const { error: insertError } = await supabase
        .from("user_referral_codes")
        .insert({ user_id: user.id, code: newCode });

      if (!insertError) {
        setReferralCode(newCode);
      }
    }
  }, [user]);

  const fetchEarnings = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("affiliate_earnings")
      .select("*")
      .eq("referrer_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching earnings:", error);
      return;
    }

    setEarnings(data || []);

    // Calculate stats
    const pending = data?.filter((e) => e.status === "pending") || [];
    const paid = data?.filter((e) => e.status === "paid") || [];

    setStats({
      totalEarnings: data?.reduce((sum, e) => sum + Number(e.commission_amount), 0) || 0,
      pendingEarnings: pending.reduce((sum, e) => sum + Number(e.commission_amount), 0),
      paidEarnings: paid.reduce((sum, e) => sum + Number(e.commission_amount), 0),
      referralCount: 0, // Will be fetched separately
      conversionCount: data?.length || 0,
    });
  }, [user]);

  const fetchReferralCount = useCallback(async () => {
    if (!user) return;

    const { count, error } = await supabase
      .from("referrals")
      .select("*", { count: "exact", head: true })
      .eq("referrer_id", user.id);

    if (!error && count !== null) {
      setStats((prev) => ({ ...prev, referralCount: count }));
    }
  }, [user]);

  const fetchPayoutSettings = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("profiles")
      .select("payout_email, payout_method")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!error && data) {
      setPayoutEmail(data.payout_email);
      setPayoutMethod(data.payout_method || "paypal");
    }
  }, [user]);

  const updatePayoutSettings = async (email: string, method: string) => {
    if (!user) return;

    const { error } = await supabase
      .from("profiles")
      .update({ payout_email: email, payout_method: method })
      .eq("user_id", user.id);

    if (error) {
      toast({
        title: "Fehler",
        description: "Auszahlungseinstellungen konnten nicht gespeichert werden.",
        variant: "destructive",
      });
      return false;
    }

    setPayoutEmail(email);
    setPayoutMethod(method);
    toast({
      title: "Gespeichert",
      description: "Deine Auszahlungseinstellungen wurden aktualisiert.",
    });
    return true;
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([
        fetchReferralCode(),
        fetchEarnings(),
        fetchReferralCount(),
        fetchPayoutSettings(),
      ]);
      setIsLoading(false);
    };

    if (user) {
      loadData();
    }
  }, [user, fetchReferralCode, fetchEarnings, fetchReferralCount, fetchPayoutSettings]);

  const getReferralLink = () => {
    if (!referralCode) return null;
    return `${window.location.origin}/register?ref=${referralCode}`;
  };

  const copyReferralLink = () => {
    const link = getReferralLink();
    if (link) {
      navigator.clipboard.writeText(link);
      toast({
        title: "Kopiert!",
        description: "Dein Affiliate-Link wurde kopiert.",
      });
    }
  };

  return {
    referralCode,
    referralLink: getReferralLink(),
    earnings,
    stats,
    payoutEmail,
    payoutMethod,
    isLoading,
    copyReferralLink,
    updatePayoutSettings,
    refresh: () => Promise.all([fetchEarnings(), fetchReferralCount()]),
  };
}

function generateReferralCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
