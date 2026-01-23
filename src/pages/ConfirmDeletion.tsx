import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Trash2, AlertTriangle, CheckCircle2, XCircle, Eye, EyeOff, ArrowLeft } from "lucide-react";

const ConfirmDeletion = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDeleted, setIsDeleted] = useState(false);

  // Validate token on mount
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setError("Kein Bestätigungstoken gefunden.");
        setIsValidating(false);
        return;
      }

      try {
        // Check token validity via a simple check
        const { data, error } = await supabase
          .from("account_deletion_tokens")
          .select("expires_at, used")
          .eq("token", token)
          .single();

        if (error || !data) {
          setError("Ungültiger oder bereits verwendeter Link.");
          setIsValid(false);
        } else if (data.used) {
          setError("Dieser Link wurde bereits verwendet.");
          setIsValid(false);
        } else if (new Date(data.expires_at) < new Date()) {
          setError("Dieser Link ist abgelaufen. Bitte fordere einen neuen an.");
          setIsValid(false);
        } else {
          setIsValid(true);
        }
      } catch (e) {
        setError("Fehler bei der Validierung.");
        setIsValid(false);
      } finally {
        setIsValidating(false);
      }
    };

    validateToken();
  }, [token]);

  const handleConfirmDeletion = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password.trim()) {
      toast.error("Bitte gib dein Passwort ein");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke("confirm-account-deletion", {
        body: { token, password },
      });

      if (error) throw error;

      if (data?.error) {
        setError(data.error);
        return;
      }

      // Sign out locally
      await supabase.auth.signOut();
      
      setIsDeleted(true);
      toast.success("Dein Konto wurde erfolgreich gelöscht");
    } catch (error: any) {
      console.error("Deletion error:", error);
      setError(error.message || "Ein Fehler ist aufgetreten");
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state
  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="py-12">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-muted-foreground">Link wird überprüft...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state
  if (isDeleted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="py-12">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-xl font-bold">Konto gelöscht</h2>
              <p className="text-muted-foreground">
                Dein Konto und alle zugehörigen Daten wurden erfolgreich gelöscht.
              </p>
              <Button onClick={() => navigate("/")} className="mt-4">
                Zur Startseite
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Invalid token state
  if (!isValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="py-12">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                <XCircle className="w-8 h-8 text-destructive" />
              </div>
              <h2 className="text-xl font-bold">Ungültiger Link</h2>
              <p className="text-muted-foreground">{error}</p>
              <Button variant="outline" onClick={() => navigate("/dashboard")} className="mt-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Zurück zum Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main confirmation form
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-destructive/30">
        <CardHeader className="text-center">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
          <CardTitle className="text-destructive">Konto endgültig löschen</CardTitle>
          <CardDescription>
            Gib dein Passwort ein, um die Löschung zu bestätigen. Diese Aktion kann nicht rückgängig gemacht werden.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleConfirmDeletion} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">Passwort bestätigen</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Dein Passwort"
                  required
                  autoFocus
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <Eye className="w-4 h-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>

            <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4 text-sm text-muted-foreground space-y-2">
              <p className="font-medium text-foreground">Folgendes wird gelöscht:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Alle Analysen und Ergebnisse</li>
                <li>Dein Fortschritt und deine Streak</li>
                <li>Alle hochgeladenen Fotos</li>
                <li>Dein Profil und persönliche Daten</li>
              </ul>
            </div>

            <div className="flex flex-col gap-3">
              <Button
                type="submit"
                variant="destructive"
                disabled={isLoading}
                className="w-full"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {isLoading ? "Wird gelöscht..." : "Konto endgültig löschen"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/dashboard")}
                disabled={isLoading}
              >
                Abbrechen
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConfirmDeletion;
