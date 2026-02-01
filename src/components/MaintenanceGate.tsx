import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Wrench, Lock } from "lucide-react";
import { useLocation } from "react-router-dom";

// Public routes that should always be accessible
const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/features",
  "/pricing",
  "/datenschutz",
  "/impressum",
  "/agb",
];

interface MaintenanceContextType {
  maintenanceMode: boolean;
  isOwner: boolean;
  isLoggedIn: boolean;
  loading: boolean;
}

const MaintenanceContext = createContext<MaintenanceContextType>({
  maintenanceMode: false,
  isOwner: false,
  isLoggedIn: false,
  loading: true,
});

export const useMaintenanceContext = () => useContext(MaintenanceContext);

interface MaintenanceProviderProps {
  children: React.ReactNode;
}

// Parse setting value - handles both raw values and strings
const parseSettingValue = (value: unknown): boolean => {
  if (typeof value === "boolean") return value;
  if (value === "true" || value === true) return true;
  if (value === "false" || value === false) return false;
  return false;
};

export const MaintenanceProvider: React.FC<MaintenanceProviderProps> = ({ children }) => {
  // SECURITY: Default to true (maintenance) until we confirm otherwise from DB
  // This prevents bypassing maintenance mode during initial load
  const [maintenanceMode, setMaintenanceMode] = useState<boolean | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkMaintenanceAndRole = useCallback(async () => {
    setLoading(true);
    
    try {
      // Use the security-definer helper to bypass RLS
      const { data: modeData, error: modeError } = await supabase.rpc("get_maintenance_mode");

      if (modeError) {
        console.error("get_maintenance_mode error:", modeError);
        // Fallback: maintenance = false so users can proceed
        setMaintenanceMode(false);
      } else {
        setMaintenanceMode(modeData === true);
      }

      // Check user session and role
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        setIsOwner(false);
        setIsLoggedIn(false);
        setLoading(false);
        return;
      }

      setIsLoggedIn(true);

      const { data: roleData, error: roleError } = await supabase.rpc('get_user_role', {
        _user_id: session.user.id
      });

      if (roleError) {
        console.error("Error checking owner role:", roleError);
        setIsOwner(false);
      } else {
        const ownerStatus = roleData === "owner";
        setIsOwner(ownerStatus);
      }
    } catch (err) {
      console.error("Maintenance/Role check error:", err);
      setIsOwner(false);
      // Make sure we don't leave the app in a loading state
      setMaintenanceMode(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial check
    checkMaintenanceAndRole();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
        checkMaintenanceAndRole();
      } else if (event === 'SIGNED_OUT') {
        setIsOwner(false);
        setIsLoggedIn(false);
        // Still check maintenance mode for logged-out state
        checkMaintenanceAndRole();
      }
    });

    // Subscribe to maintenance mode changes in realtime
    const channel = supabase
      .channel("maintenance_mode_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "system_settings",
          filter: "key=eq.maintenance_mode",
        },
        (payload) => {
          if (payload.new && 'value' in payload.new) {
            const newValue = parseSettingValue(payload.new.value);
            setMaintenanceMode(newValue);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, [checkMaintenanceAndRole]);

  // maintenanceMode can be null (loading), true, or false
  const contextValue: MaintenanceContextType = {
    maintenanceMode: maintenanceMode === true,
    isOwner,
    isLoggedIn,
    loading: loading || maintenanceMode === null, // Still loading if maintenance mode not yet fetched
  };

  return (
    <MaintenanceContext.Provider value={contextValue}>
      {children}
    </MaintenanceContext.Provider>
  );
};

// Component that checks maintenance and shows the screen if needed
export const MaintenanceCheck: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const { maintenanceMode, isOwner, isLoggedIn, loading } = useMaintenanceContext();
  
  // Check if current route is public
  const isPublicRoute = PUBLIC_ROUTES.includes(location.pathname);

  // Always show loading for non-public routes while checking auth/role
  if (loading && !isPublicRoute) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Laden...</div>
      </div>
    );
  }

  // Show maintenance page if:
  // - Maintenance mode is active
  // - User is logged in (so they passed the public pages)
  // - User is NOT an owner
  // - Current route is NOT a public route
  const shouldShowMaintenance = maintenanceMode && isLoggedIn && !isOwner && !isPublicRoute;

  if (shouldShowMaintenance) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="relative mx-auto w-24 h-24">
            <div className="absolute inset-0 bg-primary/20 rounded-full animate-pulse" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Wrench className="w-12 h-12 text-primary" />
            </div>
          </div>
          
          <div className="space-y-3">
            <h1 className="text-3xl font-bold text-foreground">
              Wartungsmodus
            </h1>
            <p className="text-muted-foreground text-lg">
              Die App wird gerade gewartet.
            </p>
            <p className="text-muted-foreground">
              Wir arbeiten daran, die Seite so schnell wie möglich wieder verfügbar zu machen.
              Bitte versuche es später erneut.
            </p>
          </div>

          <div className="pt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Lock className="w-4 h-4" />
            <span>Nur Administratoren haben aktuell Zugang</span>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
