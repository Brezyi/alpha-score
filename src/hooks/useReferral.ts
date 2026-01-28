import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const REQUIRED_REFERRALS = 3;

export interface ReferralState {
  referralCode: string | null;
  referralCount: number;
  requiredReferrals: number;
  hasEnoughReferrals: boolean;
  loading: boolean;
  error: string | null;
}

export function useReferral() {
  const { user } = useAuth();
  const [state, setState] = useState<ReferralState>({
    referralCode: null,
    referralCount: 0,
    requiredReferrals: REQUIRED_REFERRALS,
    hasEnoughReferrals: false,
    loading: true,
    error: null,
  });

  const fetchReferralData = useCallback(async () => {
    if (!user) {
      setState(prev => ({ ...prev, loading: false }));
      return;
    }

    try {
      // Get or create referral code
      const { data: code, error: codeError } = await supabase.rpc('get_or_create_referral_code', {
        p_user_id: user.id
      });

      if (codeError) throw codeError;

      // Get referral count
      const { data: count, error: countError } = await supabase.rpc('count_referrals', {
        p_user_id: user.id
      });

      if (countError) throw countError;

      const referralCount = count || 0;

      setState({
        referralCode: code,
        referralCount,
        requiredReferrals: REQUIRED_REFERRALS,
        hasEnoughReferrals: referralCount >= REQUIRED_REFERRALS,
        loading: false,
        error: null,
      });
    } catch (error: any) {
      console.error("Referral fetch error:", error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message,
      }));
    }
  }, [user]);

  useEffect(() => {
    fetchReferralData();
  }, [fetchReferralData]);

  const copyReferralCode = useCallback(async () => {
    if (state.referralCode) {
      await navigator.clipboard.writeText(state.referralCode);
      return true;
    }
    return false;
  }, [state.referralCode]);

  const getShareLink = useCallback(() => {
    if (state.referralCode) {
      return `${window.location.origin}/register?ref=${state.referralCode}`;
    }
    return null;
  }, [state.referralCode]);

  const copyShareLink = useCallback(async () => {
    const link = getShareLink();
    if (link) {
      await navigator.clipboard.writeText(link);
      return true;
    }
    return false;
  }, [getShareLink]);

  return {
    ...state,
    refetch: fetchReferralData,
    copyReferralCode,
    getShareLink,
    copyShareLink,
  };
}

// Function to record a referral during signup
export async function recordReferral(referralCode: string, newUserId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('record_referral', {
      p_referral_code: referralCode,
      p_new_user_id: newUserId
    });

    if (error) {
      console.error("Record referral error:", error);
      return false;
    }

    return data === true;
  } catch (error) {
    console.error("Record referral exception:", error);
    return false;
  }
}
