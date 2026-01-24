import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface AdminPasswordStatus {
  hasPassword: boolean;
  isExpired: boolean;
  daysUntilExpiry: number;
  lastChangedAt: Date | null;
}

interface UseAdminPasswordReturn {
  status: AdminPasswordStatus | null;
  loading: boolean;
  isVerified: boolean;
  setPassword: (password: string) => Promise<{ success: boolean; error?: string }>;
  verifyPassword: (password: string) => Promise<{ success: boolean; error?: string; daysUntilExpiry?: number }>;
  clearVerification: () => void;
  refetch: () => Promise<void>;
}

export function useAdminPassword(): UseAdminPasswordReturn {
  const [status, setStatus] = useState<AdminPasswordStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc("get_admin_password_status");

      if (error) {
        console.error("Error fetching admin password status:", error);
        return;
      }

      if (data && data.length > 0) {
        const row = data[0];
        setStatus({
          hasPassword: row.has_password,
          isExpired: row.is_expired,
          daysUntilExpiry: row.days_until_expiry,
          lastChangedAt: row.last_changed_at ? new Date(row.last_changed_at) : null,
        });
      }
    } catch (err) {
      console.error("Admin password status fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const setPassword = async (password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      if (password.length < 8) {
        return { success: false, error: "Passwort muss mindestens 8 Zeichen lang sein" };
      }

      const { error } = await supabase.rpc("set_admin_password", {
        _password: password,
      });

      if (error) {
        console.error("Error setting admin password:", error);
        return { success: false, error: error.message };
      }

      // Refetch status
      await fetchStatus();

      // Mark as verified for the current UI flow (no persistent client-side cache)
      setIsVerified(true);

      return { success: true };
    } catch (err) {
      console.error("Set admin password error:", err);
      return { success: false, error: "Ein Fehler ist aufgetreten" };
    }
  };

  const verifyPassword = async (password: string): Promise<{ success: boolean; error?: string; daysUntilExpiry?: number }> => {
    try {
      const { data, error } = await supabase.rpc("verify_admin_password", {
        _password: password,
      });

      if (error) {
        console.error("Error verifying admin password:", error);
        return { success: false, error: error.message };
      }

      if (data && data.length > 0) {
        const row = data[0];

        if (row.needs_setup) {
          return { success: false, error: "Admin-Passwort muss zuerst eingerichtet werden" };
        }

        if (row.is_expired) {
          return { success: false, error: "Admin-Passwort ist abgelaufen. Bitte erstelle ein neues." };
        }

        if (row.is_valid) {
          // Mark as verified for the current UI flow (no persistent client-side cache)
          setIsVerified(true);

          return { success: true, daysUntilExpiry: row.days_until_expiry };
        }

        return { success: false, error: "Falsches Admin-Passwort" };
      }

      return { success: false, error: "Überprüfung fehlgeschlagen" };
    } catch (err) {
      console.error("Verify admin password error:", err);
      return { success: false, error: "Ein Fehler ist aufgetreten" };
    }
  };

  const clearVerification = () => {
    setIsVerified(false);
  };

  return {
    status,
    loading,
    isVerified,
    setPassword,
    verifyPassword,
    clearVerification,
    refetch: fetchStatus,
  };
}
