import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type AuditEventType =
  | "LOGIN"
  | "LOGOUT"
  | "FAILED_LOGIN"
  | "SIGNUP"
  | "PASSWORD_RESET"
  | "PROFILE_UPDATE"
  | "SUBSCRIPTION_CHANGE"
  | "PAYMENT_SUCCESS"
  | "PAYMENT_FAILED";

interface LogEventParams {
  eventType: AuditEventType;
  userId?: string;
  metadata?: Record<string, unknown>;
}

export function useAuditLog() {
  const logEvent = useCallback(async ({ eventType, userId, metadata }: LogEventParams) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUserId = userId || session?.user?.id;

      const { error } = await supabase.functions.invoke("log-auth-event", {
        body: {
          eventType,
          userId: currentUserId,
          metadata,
        },
      });

      if (error) {
        console.error("Error logging audit event:", error);
      }
    } catch (err) {
      console.error("Failed to log audit event:", err);
    }
  }, []);

  return { logEvent };
}
