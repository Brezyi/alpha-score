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

interface ResetRequest {
  id: string;
  user_id: string;
  display_name: string;
  email: string;
  role: string;
  requested_at: string;
  status: string;
}

interface UseAdminPasswordManagementReturn {
  adminUsers: AdminUser[];
  resetRequests: ResetRequest[];
  loading: boolean;
  maskedEmail: string | null;
  hasPendingRequest: boolean;
  resetPasswordForUser: (userId: string) => Promise<boolean>;
  sendResetEmailToUser: (userId: string) => Promise<boolean>;
  requestEmailReset: () => Promise<boolean>;
  requestResetFromOwner: () => Promise<boolean>;
  approveResetRequest: (requestId: string, userId: string) => Promise<boolean>;
  rejectResetRequest: (requestId: string) => Promise<boolean>;
  refetch: () => Promise<void>;
}

export function useAdminPasswordManagement(): UseAdminPasswordManagementReturn {
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [resetRequests, setResetRequests] = useState<ResetRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [maskedEmail, setMaskedEmail] = useState<string | null>(null);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch admin users with password status (for owners)
      const { data: usersData, error: usersError } = await supabase.rpc(
        "get_admin_users_password_status"
      );

      if (usersError) {
        if (!usersError.message.includes("Unauthorized")) {
          console.error("Error fetching admin users:", usersError);
        }
      } else if (usersData) {
        setAdminUsers(usersData as AdminUser[]);
      }

      // Fetch pending reset requests (for owners)
      const { data: requestsData, error: requestsError } = await supabase.rpc(
        "get_pending_password_reset_requests"
      );

      if (!requestsError && requestsData) {
        setResetRequests(requestsData as ResetRequest[]);
      }

      // Check if current user has a pending request (for admins)
      const { data: pendingData, error: pendingError } = await supabase.rpc(
        "has_pending_password_reset_request"
      );

      if (!pendingError && pendingData !== null) {
        setHasPendingRequest(pendingData as boolean);
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

  const sendResetEmailToUser = async (userId: string): Promise<boolean> => {
    try {
      const { error } = await supabase.functions.invoke("send-admin-password-reset", {
        method: "POST",
        body: { target_user_id: userId },
      });

      if (error) {
        console.error("Error sending reset email to user:", error);
        toast.error("Fehler beim Senden der E-Mail");
        return false;
      }

      toast.success("Reset-Link wurde per E-Mail gesendet");
      await fetchData();
      return true;
    } catch (err) {
      console.error("Send reset email error:", err);
      toast.error("Ein Fehler ist aufgetreten");
      return false;
    }
  };

  // For admins to request a reset from the owner
  const requestResetFromOwner = async (): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Nicht authentifiziert");
        return false;
      }

      const { error } = await supabase
        .from("admin_password_reset_requests")
        .insert({ user_id: user.id });

      if (error) {
        if (error.code === "23505") {
          toast.error("Du hast bereits eine ausstehende Anfrage");
        } else {
          console.error("Error requesting reset:", error);
          toast.error("Fehler beim Erstellen der Anfrage");
        }
        return false;
      }

      setHasPendingRequest(true);
      toast.success("Anfrage gesendet! Der Owner wird benachrichtigt.");
      return true;
    } catch (err) {
      console.error("Request reset error:", err);
      toast.error("Ein Fehler ist aufgetreten");
      return false;
    }
  };

  // For owners to approve a reset request (sends email to the admin)
  const approveResetRequest = async (requestId: string, userId: string): Promise<boolean> => {
    try {
      // Send the reset email
      const emailSuccess = await sendResetEmailToUser(userId);
      
      if (!emailSuccess) {
        return false;
      }

      // Mark the request as approved
      const { error } = await supabase
        .from("admin_password_reset_requests")
        .update({ 
          status: "approved", 
          processed_at: new Date().toISOString(),
          processed_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq("id", requestId);

      if (error) {
        console.error("Error updating request:", error);
      }

      await fetchData();
      return true;
    } catch (err) {
      console.error("Approve request error:", err);
      toast.error("Ein Fehler ist aufgetreten");
      return false;
    }
  };

  // For owners to reject a reset request
  const rejectResetRequest = async (requestId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("admin_password_reset_requests")
        .update({ 
          status: "rejected", 
          processed_at: new Date().toISOString(),
          processed_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq("id", requestId);

      if (error) {
        console.error("Error rejecting request:", error);
        toast.error("Fehler beim Ablehnen der Anfrage");
        return false;
      }

      toast.success("Anfrage abgelehnt");
      await fetchData();
      return true;
    } catch (err) {
      console.error("Reject request error:", err);
      toast.error("Ein Fehler ist aufgetreten");
      return false;
    }
  };

  return {
    adminUsers,
    resetRequests,
    loading,
    maskedEmail,
    hasPendingRequest,
    resetPasswordForUser,
    sendResetEmailToUser,
    requestEmailReset,
    requestResetFromOwner,
    approveResetRequest,
    rejectResetRequest,
    refetch: fetchData,
  };
}
