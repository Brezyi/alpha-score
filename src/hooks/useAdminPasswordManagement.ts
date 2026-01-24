import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AdminUser {
  user_id: string;
  email: string;
  display_name: string;
  role: string;
  has_admin_password: boolean;
  password_expired: boolean;
  days_until_expiry: number;
}

interface UseAdminPasswordManagementReturn {
  adminUsers: AdminUser[];
  loading: boolean;
  maskedEmail: string | null;
  resetPasswordForUser: (userId: string) => Promise<boolean>;
  requestEmailReset: () => Promise<boolean>;
  refetch: () => Promise<void>;
}

export function useAdminPasswordManagement(): UseAdminPasswordManagementReturn {
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [maskedEmail, setMaskedEmail] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch admin users with password status
      const { data: usersData, error: usersError } = await supabase.rpc(
        "get_admin_users_password_status"
      );

      if (usersError) {
        // User might not be owner, which is fine
        if (!usersError.message.includes("Unauthorized")) {
          console.error("Error fetching admin users:", usersError);
        }
      } else if (usersData) {
        setAdminUsers(usersData as AdminUser[]);
      }

      // Fetch masked email for current user
      const { data: emailData, error: emailError } = await supabase.rpc(
        "get_owner_masked_email"
      );

      if (!emailError && emailData) {
        setMaskedEmail(emailData as string);
      }
    } catch (err) {
      console.error("Admin password management fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const resetPasswordForUser = async (userId: string): Promise<boolean> => {
    try {
      const { error } = await supabase.rpc("reset_admin_password_for_user", {
        _target_user_id: userId,
      });

      if (error) {
        console.error("Error resetting admin password:", error);
        toast.error("Fehler beim Zurücksetzen: " + error.message);
        return false;
      }

      toast.success("Admin-Passwort wurde zurückgesetzt");
      await fetchData();
      return true;
    } catch (err) {
      console.error("Reset password error:", err);
      toast.error("Ein Fehler ist aufgetreten");
      return false;
    }
  };

  const requestEmailReset = async (): Promise<boolean> => {
    try {
      const { data, error } = await supabase.functions.invoke(
        "send-admin-password-reset",
        { method: "POST" }
      );

      if (error) {
        console.error("Error requesting email reset:", error);
        toast.error("Fehler beim Senden der E-Mail");
        return false;
      }

      toast.success("Reset-Link wurde per E-Mail gesendet");
      return true;
    } catch (err) {
      console.error("Email reset request error:", err);
      toast.error("Ein Fehler ist aufgetreten");
      return false;
    }
  };

  return {
    adminUsers,
    loading,
    maskedEmail,
    resetPasswordForUser,
    requestEmailReset,
    refetch: fetchData,
  };
}
