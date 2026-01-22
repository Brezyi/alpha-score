import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "owner" | "admin" | "user";

interface UseUserRoleReturn {
  role: AppRole | null;
  loading: boolean;
  isOwner: boolean;
  isAdmin: boolean;
  isAdminOrOwner: boolean;
  refetch: () => Promise<void>;
}

export function useUserRole(): UseUserRoleReturn {
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchRole = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        setRole(null);
        setLoading(false);
        return;
      }

      // Call the security definer function to get user's role
      const { data, error } = await supabase.rpc('get_user_role', {
        _user_id: session.user.id
      });

      if (error) {
        console.error("Error fetching user role:", error);
        setRole("user"); // Default to user on error
      } else {
        setRole(data as AppRole || "user");
      }
    } catch (err) {
      console.error("Role fetch error:", err);
      setRole("user");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Set up auth state listener BEFORE fetching
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        fetchRole();
      } else if (event === 'SIGNED_OUT') {
        setRole(null);
        setLoading(false);
      }
    });

    // Initial fetch
    fetchRole();

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchRole]);

  return {
    role,
    loading,
    isOwner: role === "owner",
    isAdmin: role === "admin",
    isAdminOrOwner: role === "owner" || role === "admin",
    refetch: fetchRole,
  };
}
