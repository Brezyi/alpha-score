import { Button } from "@/components/ui/button";
import { ArrowLeft, Mail, CheckCircle2, RefreshCw, Loader2 } from "lucide-react";
import { ScannerLogo } from "@/components/ScannerLogo";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Capacitor } from "@capacitor/core";

const EmailConfirmation = () => {
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") || "";
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const isNative = Capacitor.isNativePlatform();

  const RATE_LIMIT_HITS_KEY = "email_confirm_rate_limit_hits";

  const getNextCooldownSeconds = () => {
    const steps = [60, 120, 300, 900]; // 1m, 2m, 5m, 15m
    const raw = localStorage.getItem(RATE_LIMIT_HITS_KEY);
    const hits = Math.max(0, Number(raw ?? 0) || 0);
    const nextHits = Math.min(hits + 1, steps.length);
    localStorage.setItem(RATE_LIMIT_HITS_KEY, String(nextHits));
    return steps[nextHits - 1];
  };

  const resetCooldownBackoff = () => {
    localStorage.removeItem(RATE_LIMIT_HITS_KEY);
  };

  // Redirect to dashboard if already logged in (email confirmed)
  useEffect(() => {
    if (!authLoading && user) {
      setIsConfirmed(true);
      toast({
        title: "E-Mail bestätigt! 🎉",
        description: "Du wirst jetzt weitergeleitet...",
      });
      const timer = setTimeout(() => {
        navigate("/dashboard");
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [user, authLoading, navigate, toast]);

  // Poll for session changes (detects confirmation from other devices/tabs)
  useEffect(() => {
    if (isConfirmed || !email) return;

    const checkAndRefreshSession = async () => {
      try {
        // First try to refresh the session - this forces a server check
        // and will pick up email confirmation done on other devices
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshData?.session?.user?.email_confirmed_at) {
          // Email is now confirmed!
          setIsConfirmed(true);
          return;
        }
        
        // If refresh didn't work, check current session
        if (!refreshError) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user?.email_confirmed_at) {
            setIsConfirmed(true);
          }
        }
      } catch (error) {
        // Ignore errors, just continue polling
        console.debug("Session check failed, will retry:", error);
      }
    };

    // Check immediately
    checkAndRefreshSession();

    // Poll every 3 seconds
    const interval = setInterval(checkAndRefreshSession, 3000);

    return () => clearInterval(interval);
  }, [email, isConfirmed]);

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
      resetCooldownBackoff();
      setCooldown(60);
    } catch (error: any) {
      if (error.message?.toLowerCase().includes("rate limit")) {
        toast({
          title: "Zu viele Anfragen",
          description: "Du hast zu oft eine Bestätigungs-Mail angefordert. Bitte warte etwas länger und versuche es dann erneut.",
          variant: "destructive",
        });
        setCooldown(getNextCooldownSeconds());
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

  // Show confirmed state
  if (isConfirmed) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-center items-center px-8">
        <div className="w-full max-w-md mx-auto text-center">
          <div className="mb-8 flex justify-center">
            <ScannerLogo size="lg" labelSize="lg" />
          </div>
          <div className="mb-6 flex justify-center">
            <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center">
              <CheckCircle2 className="w-16 h-16 text-primary animate-pulse" />
            </div>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mb-3 text-primary">
            E-Mail bestätigt! 🎉
          </h1>
          <p className="text-muted-foreground mb-6">
            Du wirst automatisch zum Dashboard weitergeleitet...
          </p>
          <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
        </div>
      </div>
    );
  }

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
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-6">
        <p className="text-sm text-muted-foreground">
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
