import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Shield, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { AdminPasswordDialog } from "@/components/AdminPasswordDialog";

export default function AdminPasswordReset() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const [status, setStatus] = useState<"loading" | "success" | "error" | "setup">("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [showSetupDialog, setShowSetupDialog] = useState(false);

  const token = searchParams.get("token");

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      navigate("/login", { state: { redirectTo: `/admin-password-reset?token=${token}` } });
      return;
    }

    if (!token) {
      setStatus("error");
      setErrorMessage("Kein Reset-Token gefunden");
      return;
    }

    // Verify the token
    const verifyToken = async () => {
      try {
        const { data, error } = await supabase.rpc("verify_admin_password_reset_token", {
          _token: token,
        });

        if (error) {
          console.error("Token verification error:", error);
          setStatus("error");
          setErrorMessage("Fehler bei der Token-Überprüfung");
          return;
        }

        if (data === true) {
          setStatus("success");
          toast.success("Token verifiziert! Du kannst jetzt ein neues Admin-Passwort erstellen.");
          // Show setup dialog
          setTimeout(() => {
            setShowSetupDialog(true);
          }, 1500);
        } else {
          setStatus("error");
          setErrorMessage("Token ist ungültig oder abgelaufen");
        }
      } catch (err) {
        console.error("Token verification exception:", err);
        setStatus("error");
        setErrorMessage("Ein unerwarteter Fehler ist aufgetreten");
      }
    };

    verifyToken();
  }, [token, user, authLoading, navigate]);

  const handleSetupSuccess = () => {
    setShowSetupDialog(false);
    toast.success("Neues Admin-Passwort erfolgreich erstellt!");
    navigate("/admin");
  };

  if (authLoading || status === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Token wird verifiziert...</p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-10 h-10 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Fehler beim Zurücksetzen</h1>
          <p className="text-muted-foreground mb-6">{errorMessage}</p>
          <div className="flex flex-col gap-3">
            <Button onClick={() => navigate("/admin")} variant="hero">
              <Shield className="w-4 h-4" />
              Zum Admin-Bereich
            </Button>
            <Button onClick={() => navigate("/dashboard")} variant="outline">
              Zum Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Token verifiziert!</h1>
        <p className="text-muted-foreground mb-6">
          Du kannst jetzt ein neues Admin-Passwort erstellen.
        </p>
        <Button onClick={() => setShowSetupDialog(true)} variant="hero">
          <Shield className="w-4 h-4" />
          Neues Passwort erstellen
        </Button>
      </div>

      <AdminPasswordDialog
        open={showSetupDialog}
        onSuccess={handleSetupSuccess}
        onCancel={() => navigate("/dashboard")}
      />
    </div>
  );
}
