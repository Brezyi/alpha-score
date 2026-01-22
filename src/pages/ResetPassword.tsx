import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Zap, Lock, Loader2, CheckCircle, Eye, EyeOff } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useGlobalSettings } from "@/contexts/SystemSettingsContext";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { settings } = useGlobalSettings();

  // Handle the password recovery session from the email link
  useEffect(() => {
    const handlePasswordRecovery = async () => {
      // Check if there's a hash fragment with access_token (from email link)
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");
      const type = hashParams.get("type");

      if (accessToken && type === "recovery") {
        // Set the session from the recovery tokens
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken || "",
        });

        if (!error) {
          setSessionReady(true);
          // Clean up the URL
          window.history.replaceState(null, "", window.location.pathname);
        } else {
          setError("Der Reset-Link ist ungültig oder abgelaufen.");
        }
      } else {
        // Check for existing session (in case of page refresh)
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setSessionReady(true);
        } else {
          // Listen for PASSWORD_RECOVERY event
          const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (event, session) => {
              if (event === "PASSWORD_RECOVERY" && session) {
                setSessionReady(true);
              }
            }
          );
          return () => subscription.unsubscribe();
        }
      }
    };

    handlePasswordRecovery();
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!sessionReady) {
      setError("Keine gültige Session. Bitte fordere einen neuen Reset-Link an.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Die Passwörter stimmen nicht überein.");
      return;
    }

    if (password.length < 6) {
      setError("Das Passwort muss mindestens 6 Zeichen lang sein.");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      setSuccess(true);
      toast({
        title: "Passwort geändert",
        description: "Du kannst dich jetzt mit deinem neuen Passwort anmelden.",
      });

      // Sign out and redirect to login after 3 seconds
      await supabase.auth.signOut();
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (error: any) {
      setError(error.message || "Etwas ist schiefgelaufen.");
      toast({
        title: "Fehler",
        description: error.message || "Das Passwort konnte nicht geändert werden.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Passwort geändert!</h1>
          <p className="text-muted-foreground mb-8">
            Dein Passwort wurde erfolgreich zurückgesetzt. Du wirst zum Login weitergeleitet...
          </p>
          <Link to="/login">
            <Button variant="hero" className="w-full">
              Jetzt anmelden
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex flex-col justify-center px-8 md:px-16 lg:px-24">
        <div className="w-full max-w-md mx-auto">
          {/* Logo */}
          <div className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold">{settings.app_name}</span>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Neues Passwort</h1>
            <p className="text-muted-foreground">
              Gib dein neues Passwort ein, um es zu ändern.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleResetPassword} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="password">Neues Passwort</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-12 bg-card border-border"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Passwort bestätigen</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 h-12 bg-card border-border"
                  required
                  minLength={6}
                />
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                {error}
              </div>
            )}

            <Button 
              type="submit" 
              variant="hero" 
              size="lg" 
              className="w-full"
              disabled={loading || !sessionReady}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Wird gespeichert...
                </>
              ) : (
                "Passwort ändern"
              )}
            </Button>

            {!sessionReady && !error && (
              <p className="text-sm text-muted-foreground text-center">
                Warte auf Session-Validierung...
              </p>
            )}
          </form>

          {/* Login Link */}
          <p className="text-center text-muted-foreground mt-8">
            Kein Reset nötig?{" "}
            <Link to="/login" className="text-primary hover:underline font-medium">
              Zurück zum Login
            </Link>
          </p>
        </div>
      </div>

      {/* Right Side - Visual */}
      <div className="hidden lg:flex flex-1 relative bg-card overflow-hidden">
        <div className="absolute inset-0 bg-gradient-radial from-primary/20 via-transparent to-transparent opacity-50" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl" />
        
        <div className="relative z-10 flex flex-col items-center justify-center w-full p-16">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Lock className="w-10 h-10 text-primary" />
            </div>
            <p className="text-xl font-semibold mb-2">Fast geschafft!</p>
            <p className="text-muted-foreground">
              Wähle ein sicheres Passwort mit mindestens 6 Zeichen.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
