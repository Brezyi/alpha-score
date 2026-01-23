import { supabase } from "@/integrations/supabase/client";

export type SecurityAlertType = 
  | "ACCOUNT_LOCKED" 
  | "SUSPICIOUS_LOGIN" 
  | "NEW_DEVICE" 
  | "PASSWORD_CHANGED" 
  | "MFA_DISABLED";

interface SecurityAlertMetadata {
  failedAttempts?: number;
  lockoutMinutes?: number;
  ipAddress?: string;
  userAgent?: string;
  location?: string;
}

export const useSecurityAlerts = () => {
  const sendSecurityAlert = async (
    alertType: SecurityAlertType,
    email: string,
    userId?: string,
    metadata?: SecurityAlertMetadata
  ) => {
    try {
      const { data, error } = await supabase.functions.invoke("send-security-alert", {
        body: {
          alertType,
          email,
          userId,
          metadata,
        },
      });

      if (error) {
        console.error("Failed to send security alert:", error);
        return { success: false, error };
      }

      return { success: true, data };
    } catch (err) {
      console.error("Error sending security alert:", err);
      return { success: false, error: err };
    }
  };

  return { sendSecurityAlert };
};
