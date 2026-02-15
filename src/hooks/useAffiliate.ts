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

interface PayoutRequest {
  id: string;
  amount: number;
  currency: string;
  payout_method: string;
  status: string;
  admin_notes: string | null;
  created_at: string;
}

interface BankDetails {
  payout_iban: string | null;
  payout_bic: string | null;
  payout_account_holder: string | null;
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
  const [bankDetails, setBankDetails] = useState<BankDetails>({
    payout_iban: null,
    payout_bic: null,
    payout_account_holder: null,
  });
  const [payoutRequests, setPayoutRequests] = useState<PayoutRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchReferralCode = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("user_referral_codes")
      .select("code")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) { console.error("Error fetching referral code:", error); return; }

    if (data) {
      setReferralCode(data.code);
    } else {
      const newCode = generateReferralCode();
      const { error: insertError } = await supabase
        .from("user_referral_codes")
        .insert({ user_id: user.id, code: newCode });
      if (!insertError) setReferralCode(newCode);
    }
  }, [user]);

  const fetchEarnings = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("affiliate_earnings")
      .select("*")
      .eq("referrer_id", user.id)
      .order("created_at", { ascending: false });

    if (error) { console.error("Error fetching earnings:", error); return; }

    setEarnings(data || []);
    const pending = data?.filter((e) => e.status === "pending") || [];
    const paid = data?.filter((e) => e.status === "paid") || [];

    setStats({
      totalEarnings: data?.reduce((sum, e) => sum + Number(e.commission_amount), 0) || 0,
      pendingEarnings: pending.reduce((sum, e) => sum + Number(e.commission_amount), 0),
      paidEarnings: paid.reduce((sum, e) => sum + Number(e.commission_amount), 0),
      referralCount: 0,
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
      .select("payout_email, payout_method, payout_iban, payout_bic, payout_account_holder")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!error && data) {
      setPayoutEmail(data.payout_email);
      setPayoutMethod(data.payout_method || "paypal");
      setBankDetails({
        payout_iban: data.payout_iban,
        payout_bic: data.payout_bic,
        payout_account_holder: data.payout_account_holder,
      });
    }
  }, [user]);

  const fetchPayoutRequests = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("payout_requests")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error) setPayoutRequests(data || []);
  }, [user]);

  const updatePayoutSettings = async (
    email: string,
    method: string,
    bank?: { iban: string; bic: string; accountHolder: string }
  ) => {
    if (!user) return false;

    const updateData: Record<string, string> = { payout_email: email, payout_method: method };
    if (method === "bank" && bank) {
      updateData.payout_iban = bank.iban;
      updateData.payout_bic = bank.bic;
      updateData.payout_account_holder = bank.accountHolder;
    }

    const { error } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("user_id", user.id);

    if (error) {
      toast({ title: "Fehler", description: "Einstellungen konnten nicht gespeichert werden.", variant: "destructive" });
      return false;
    }

    setPayoutEmail(email);
    setPayoutMethod(method);
    if (method === "bank" && bank) {
      setBankDetails({ payout_iban: bank.iban, payout_bic: bank.bic, payout_account_holder: bank.accountHolder });
    }
    toast({ title: "Gespeichert", description: "Auszahlungseinstellungen aktualisiert." });
    return true;
  };

  const requestPayout = async () => {
    if (!user) return false;

    const amount = stats.pendingEarnings;
    if (amount < 50) {
      toast({ title: "Mindestbetrag", description: "Auszahlung erst ab €50 möglich.", variant: "destructive" });
      return false;
    }

    // Check for existing pending request
    const hasPending = payoutRequests.some((r) => r.status === "pending");
    if (hasPending) {
      toast({ title: "Bereits beantragt", description: "Du hast bereits eine offene Auszahlungsanfrage.", variant: "destructive" });
      return false;
    }

    const { error } = await supabase.from("payout_requests").insert({
      user_id: user.id,
      amount,
      payout_method: payoutMethod,
      payout_email: payoutEmail,
      payout_iban: bankDetails.payout_iban,
      payout_bic: bankDetails.payout_bic,
      payout_account_holder: bankDetails.payout_account_holder,
    });

    if (error) {
      toast({ title: "Fehler", description: "Auszahlung konnte nicht beantragt werden.", variant: "destructive" });
      return false;
    }

    toast({ title: "Auszahlung beantragt", description: `€${amount.toFixed(2)} werden bearbeitet.` });
    await fetchPayoutRequests();
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
        fetchPayoutRequests(),
      ]);
      setIsLoading(false);
    };
    if (user) loadData();
  }, [user, fetchReferralCode, fetchEarnings, fetchReferralCount, fetchPayoutSettings, fetchPayoutRequests]);

  const getReferralLink = () => {
    if (!referralCode) return null;
    return `${window.location.origin}/register?ref=${referralCode}`;
  };

  const copyReferralLink = () => {
    const link = getReferralLink();
    if (link) {
      navigator.clipboard.writeText(link);
      toast({ title: "Kopiert!", description: "Dein Affiliate-Link wurde kopiert." });
    }
  };

  return {
    referralCode,
    referralLink: getReferralLink(),
    earnings,
    stats,
    payoutEmail,
    payoutMethod,
    bankDetails,
    payoutRequests,
    isLoading,
    copyReferralLink,
    updatePayoutSettings,
    requestPayout,
    refresh: () => Promise.all([fetchEarnings(), fetchReferralCount(), fetchPayoutRequests()]),
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
