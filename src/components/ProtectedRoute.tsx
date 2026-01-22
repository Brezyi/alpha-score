import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole, AppRole } from "@/hooks/useUserRole";
import { Shield, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: AppRole | AppRole[];
  redirectTo?: string;
}

export function ProtectedRoute({ 
  children, 
  requiredRole,
  redirectTo = "/login" 
}: ProtectedRouteProps) {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { role, loading: roleLoading } = useUserRole();

  // Redirect when not authenticated (after loading completes)
  useEffect(() => {
    if (!authLoading && !user) {
      navigate(redirectTo);
    }
  }, [authLoading, user, navigate, redirectTo]);

  // Loading state
  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Authentifizierung wird geprüft...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return null;
  }

  // Check role requirements
  if (requiredRole) {
    const requiredRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    const hasRequiredRole = role && requiredRoles.includes(role);

    // Owner has access to everything
    const isOwner = role === "owner";
    // Admin has access to admin routes
    const isAdminAccessingAdminRoute = role === "admin" && requiredRoles.includes("admin");

    if (!hasRequiredRole && !isOwner && !isAdminAccessingAdminRoute) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
              <Lock className="w-10 h-10 text-destructive" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Zugriff verweigert</h1>
            <p className="text-muted-foreground mb-6">
              Du hast keine Berechtigung, diese Seite aufzurufen. 
              Diese Funktion erfordert {requiredRoles.includes("owner") ? "Owner" : "Admin"}-Rechte.
            </p>
            <div className="flex flex-col gap-3">
              <Button onClick={() => navigate("/dashboard")} variant="hero">
                <Shield className="w-4 h-4" />
                Zum Dashboard
              </Button>
              <Button onClick={() => navigate(-1)} variant="outline">
                Zurück
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-6">
              Deine aktuelle Rolle: <span className="font-medium text-foreground">{role || "Unbekannt"}</span>
            </p>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}
