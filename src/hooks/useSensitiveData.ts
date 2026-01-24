import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface SensitiveData {
  firstName: string | null;
  lastName: string | null;
}

export function useSensitiveData() {
  const { user } = useAuth();
  const [data, setData] = useState<SensitiveData>({ firstName: null, lastName: null });
  const [loading, setLoading] = useState(true);
  const [hasData, setHasData] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user) {
      setData({ firstName: null, lastName: null });
      setLoading(false);
      setHasData(false);
      return;
    }

    try {
      const { data: result, error } = await supabase.rpc('get_my_sensitive_data');

      if (error) throw error;

      if (result && result.length > 0) {
        setData({
          firstName: result[0].first_name,
          lastName: result[0].last_name,
        });
        setHasData(true);
      } else {
        // Check if there's pending data from registration
        const pendingData = localStorage.getItem('pending_sensitive_data');
        if (pendingData) {
          try {
            const parsed = JSON.parse(pendingData);
            // Store the sensitive data now
            const { error: storeError } = await supabase.rpc('store_user_sensitive_data', {
              p_first_name: parsed.firstName,
              p_last_name: parsed.lastName,
            });

            if (!storeError) {
              setData({
                firstName: parsed.firstName,
                lastName: parsed.lastName,
              });
              setHasData(true);
              localStorage.removeItem('pending_sensitive_data');
            }
          } catch (e) {
            console.error('Error parsing pending sensitive data:', e);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching sensitive data:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const storeSensitiveData = useCallback(
    async (firstName: string, lastName: string) => {
      if (!user) return false;

      try {
        const { error } = await supabase.rpc('store_user_sensitive_data', {
          p_first_name: firstName,
          p_last_name: lastName,
        });

        if (error) throw error;

        setData({ firstName, lastName });
        setHasData(true);
        return true;
      } catch (error: any) {
        console.error("Error storing sensitive data:", error);
        return false;
      }
    },
    [user]
  );

  return {
    firstName: data.firstName,
    lastName: data.lastName,
    hasData,
    loading,
    storeSensitiveData,
    refetch: fetchData,
  };
}
