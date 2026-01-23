import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface MFAState {
  hasMFAEnabled: boolean;
  requiresVerification: boolean;
  loading: boolean;
  currentLevel: "aal1" | "aal2" | null;
  nextLevel: "aal1" | "aal2" | null;
}

export function useMFA() {
  const [state, setState] = useState<MFAState>({
    hasMFAEnabled: false,
    requiresVerification: false,
    loading: true,
    currentLevel: null,
    nextLevel: null,
  });

  const checkMFAStatus = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setState({
          hasMFAEnabled: false,
          requiresVerification: false,
          loading: false,
          currentLevel: null,
          nextLevel: null,
        });
        return;
      }

      // Check AAL (Authenticator Assurance Level)
      const { data: aalData, error: aalError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      
      if (aalError) {
        console.error("AAL check error:", aalError);
        setState(prev => ({ ...prev, loading: false }));
        return;
      }

      // Check if user has any verified TOTP factors
      const { data: factorData, error: factorError } = await supabase.auth.mfa.listFactors();
      
      if (factorError) {
        console.error("Factor list error:", factorError);
        setState(prev => ({ ...prev, loading: false }));
        return;
      }

      const hasVerifiedFactor = factorData.totp.some(f => f.status === "verified");
      const requiresVerification = hasVerifiedFactor && aalData.currentLevel !== "aal2";

      setState({
        hasMFAEnabled: hasVerifiedFactor,
        requiresVerification,
        loading: false,
        currentLevel: aalData.currentLevel as "aal1" | "aal2" | null,
        nextLevel: aalData.nextLevel as "aal1" | "aal2" | null,
      });
    } catch (error) {
      console.error("MFA status check failed:", error);
      setState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  useEffect(() => {
    checkMFAStatus();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkMFAStatus();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [checkMFAStatus]);

  return {
    ...state,
    refreshMFAStatus: checkMFAStatus,
  };
}
