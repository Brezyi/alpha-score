import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { useGlobalSettings } from "@/contexts/SystemSettingsContext";
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

export const MaintenanceProvider: React.FC<MaintenanceProviderProps> = ({ children }) => {
  const { settings, loading: settingsLoading } = useGlobalSettings();
  const [isOwner, setIsOwner] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [roleLoading, setRoleLoading] = useState(true);
  const hasCheckedRef = useRef(false);

  useEffect(() => {
    const checkOwnerRole = async () => {
      setRoleLoading(true);
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user) {
          setIsOwner(false);
          setIsLoggedIn(false);
          setRoleLoading(false);
          hasCheckedRef.current = true;
          return;
        }

        setIsLoggedIn(true);

        const { data, error } = await supabase.rpc('get_user_role', {
          _user_id: session.user.id
        });

        if (error) {
          console.error("Error checking owner role:", error);
          setIsOwner(false);
        } else {
          const ownerStatus = data === "owner";
          setIsOwner(ownerStatus);
          console.log("[MaintenanceGate] Role check complete:", { role: data, isOwner: ownerStatus });
        }
      } catch (err) {
        console.error("Role check error:", err);
        setIsOwner(false);
      } finally {
        setRoleLoading(false);
        hasCheckedRef.current = true;
      }
    };

    // Initial check
    checkOwnerRole();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("[MaintenanceGate] Auth state changed:", event);
      
      // Always recheck on auth state changes
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
        checkOwnerRole();
      } else if (event === 'SIGNED_OUT') {
        setIsOwner(false);
        setIsLoggedIn(false);
        setRoleLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Don't render children until we've done at least one check
  const loading = settingsLoading || roleLoading || !hasCheckedRef.current;

  return (
    <MaintenanceContext.Provider value={{
      maintenanceMode: settings.maintenance_mode,
      isOwner,
      isLoggedIn,
      loading,
    }}>
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
  
  console.log("[MaintenanceCheck]", { 
    maintenanceMode, 
    isLoggedIn, 
    isOwner, 
    isPublicRoute, 
    path: location.pathname,
    shouldShowMaintenance 
  });

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
