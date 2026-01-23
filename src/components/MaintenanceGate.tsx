import React, { useEffect, useState } from "react";
import { useGlobalSettings } from "@/contexts/SystemSettingsContext";
import { supabase } from "@/integrations/supabase/client";
import { Wrench, Lock } from "lucide-react";

interface MaintenanceGateProps {
  children: React.ReactNode;
}

export const MaintenanceGate: React.FC<MaintenanceGateProps> = ({ children }) => {
  const { settings, loading: settingsLoading } = useGlobalSettings();
  const [isOwner, setIsOwner] = useState(false);
  const [roleLoading, setRoleLoading] = useState(true);

  useEffect(() => {
    const checkOwnerRole = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user) {
          setIsOwner(false);
          setRoleLoading(false);
          return;
        }

        const { data, error } = await supabase.rpc('get_user_role', {
          _user_id: session.user.id
        });

        if (error) {
          console.error("Error checking owner role:", error);
          setIsOwner(false);
        } else {
          setIsOwner(data === "owner");
        }
      } catch (err) {
        console.error("Role check error:", err);
        setIsOwner(false);
      } finally {
        setRoleLoading(false);
      }
    };

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkOwnerRole();
    });

    checkOwnerRole();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Show loading state while checking
  if (settingsLoading || roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Laden...</div>
      </div>
    );
  }

  // If maintenance mode is active and user is NOT owner, show maintenance page
  if (settings.maintenance_mode && !isOwner) {
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
              {settings.app_name} wird gerade gewartet.
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

  // Not in maintenance mode or user is owner - render children
  return <>{children}</>;
};
