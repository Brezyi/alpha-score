import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    // Set up auth state listener FIRST (important for race condition prevention)
    // Keep it synchronous to avoid UI getting stuck if any awaited call hangs.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        if (!isMounted) return;

        if (event === "SIGNED_OUT") {
          setSession(null);
          setUser(null);
          setLoading(false);
          return;
        }

        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setLoading(false);

        // Verify user still exists (best-effort, non-blocking)
        if (currentSession?.user) {
          supabase.auth
            .getUser()
            .then(({ error }) => {
              if (!isMounted) return;
              if (error?.message?.includes("User from sub claim in JWT does not exist") ||
                  error?.message?.includes("user_not_found")) {
                // User was deleted - force clear local session
                supabase.auth.signOut().catch(() => {
                  // If signOut also fails (user doesn't exist), manually clear storage
                  localStorage.removeItem('sb-zutwifgosunupwyvcaym-auth-token');
                  sessionStorage.removeItem('sb-zutwifgosunupwyvcaym-auth-token');
                }).finally(() => {
                  if (!isMounted) return;
                  setSession(null);
                  setUser(null);
                  setLoading(false);
                });
              }
            })
            .catch(() => {
              // Ignore errors, proceed normally
            });
        }
      }
    );

    // Initial session check (must always end by clearing loading)
    const initialize = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (!isMounted) return;

        if (currentSession?.user) {
          try {
            const { error } = await supabase.auth.getUser();
            if (error?.message?.includes("User from sub claim in JWT does not exist") ||
                error?.message?.includes("user_not_found")) {
              // User was deleted - force clear local session
              try {
                await supabase.auth.signOut();
              } catch {
                // If signOut fails, manually clear storage
                localStorage.removeItem('sb-zutwifgosunupwyvcaym-auth-token');
                sessionStorage.removeItem('sb-zutwifgosunupwyvcaym-auth-token');
              }
              if (!isMounted) return;
              setSession(null);
              setUser(null);
              return;
            }
          } catch {
            // Ignore errors, proceed normally
          }
        }

        setSession(currentSession);
        setUser(currentSession?.user ?? null);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initialize();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
