import { Button } from "@/components/ui/button";
import { ArrowLeft, Mail, CheckCircle2, RefreshCw, Loader2 } from "lucide-react";
import { ScannerLogo } from "@/components/ScannerLogo";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Capacitor } from "@capacitor/core";

const EmailConfirmation = () => {
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") || "";
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const isNative = Capacitor.isNativePlatform();

  // Redirect to dashboard if already logged in (email confirmed)
  useEffect(() => {
    if (!authLoading && user) {
      navigate("/dashboard");
    }
  }, [user, authLoading, navigate]);

  // Cooldown timer
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setInterval(() => {
        setCooldown((prev) => Math.max(0, prev - 1));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [cooldown]);

  const handleResendEmail = async () => {
    if (!email || cooldown > 0) return;
    
    setResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) throw error;

      toast({
        title: "E-Mail gesendet!",
        description: "Bitte überprüfe deinen Posteingang.",
      });
      setCooldown(60);
    } catch (error: any) {
      if (error.message?.toLowerCase().includes("rate limit")) {
        toast({
          title: "Zu viele Anfragen",
          description: "Bitte warte einen Moment und versuche es dann erneut.",
          variant: "destructive",
        });
        setCooldown(60);
      } else {
        toast({
          title: "Fehler beim Senden",
          description: error.message || "Bitte versuche es später erneut.",
          variant: "destructive",
        });
      }
    } finally {
      setResending(false);
    }
  };

  const content = (
    <div className="w-full max-w-md mx-auto text-center">
      {/* Logo */}
      <div className="mb-8 flex justify-center">
        <ScannerLogo size="lg" labelSize="lg" />
      </div>

      {/* Email Icon with Animation */}
      <div className="mb-6 flex justify-center">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
            <Mail className="w-12 h-12 text-primary" />
          </div>
          <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-primary flex items-center justify-center animate-bounce">
            <CheckCircle2 className="w-5 h-5 text-primary-foreground" />
          </div>
        </div>
      </div>

      {/* Header */}
      <h1 className="text-2xl md:text-3xl font-bold mb-3">
        Bestätige deine E-Mail
      </h1>
      <p className="text-muted-foreground mb-2">
        Wir haben eine Bestätigungs-E-Mail gesendet an:
      </p>
      {email && (
        <p className="font-semibold text-foreground mb-6 break-all">
          {email}
        </p>
      )}

      {/* Instructions */}
      <div className="bg-card border border-border rounded-xl p-6 mb-6 text-left space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">
            1
          </div>
          <p className="text-sm text-muted-foreground">
            Öffne dein E-Mail-Postfach und suche nach der Bestätigungs-E-Mail
          </p>
        </div>
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">
            2
          </div>
          <p className="text-sm text-muted-foreground">
            Klicke auf den Bestätigungslink in der E-Mail
          </p>
        </div>
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">
            3
          </div>
          <p className="text-sm text-muted-foreground">
            Du wirst automatisch eingeloggt und kannst loslegen
          </p>
        </div>
      </div>

      {/* Warning */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-6">
        <p className="text-sm text-amber-600 dark:text-amber-400">
          ⚠️ Du hast <strong>7 Tage</strong> Zeit, deine E-Mail zu bestätigen. Danach wird dein Konto automatisch gelöscht.
        </p>
      </div>

      {/* Resend Button */}
      <Button
        variant="outline"
        size="lg"
        className="w-full h-12 mb-4"
        onClick={handleResendEmail}
        disabled={resending || cooldown > 0}
      >
        {resending ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            Wird gesendet...
          </>
        ) : cooldown > 0 ? (
          <>
            <RefreshCw className="w-5 h-5 mr-2" />
            Erneut senden ({cooldown}s)
          </>
        ) : (
          <>
            <RefreshCw className="w-5 h-5 mr-2" />
            E-Mail erneut senden
          </>
        )}
      </Button>

      {/* Spam Notice */}
      <p className="text-xs text-muted-foreground mb-6">
        Keine E-Mail erhalten? Überprüfe deinen Spam-Ordner.
      </p>

      {/* Login Link */}
      <div className="pt-4 border-t border-border">
        <p className="text-sm text-muted-foreground">
          E-Mail bereits bestätigt?{" "}
          <Link to="/login" className="text-primary hover:underline font-medium">
            Jetzt anmelden
          </Link>
        </p>
      </div>
    </div>
  );

  // Native app layout
  if (isNative) {
    return (
      <div className="min-h-screen bg-background flex flex-col safe-area-inset">
        <div className="flex-1 flex flex-col justify-center px-6 py-8">
          {content}
        </div>
      </div>
    );
  }

  // Desktop/Web layout
  return (
    <div className="min-h-screen bg-background flex flex-col justify-center px-8 md:px-16 lg:px-24">
      {/* Back Link */}
      <div className="w-full max-w-md mx-auto mb-8">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Zurück zur Startseite
        </Link>
      </div>
      
      {content}
    </div>
  );
};

export default EmailConfirmation;
