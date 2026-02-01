import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Mail, Lock, Loader2, AlertTriangle } from "lucide-react";
import { ScannerLogo } from "@/components/ScannerLogo";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useGlobalSettings } from "@/contexts/SystemSettingsContext";
import { MFAVerification } from "@/components/MFAVerification";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSecurityAlerts } from "@/hooks/useSecurityAlerts";
import { Capacitor } from "@capacitor/core";

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

// Animated score component for the login page
const AnimatedScore = () => {
  const [score, setScore] = useState(0);
  
  useEffect(() => {
    const finalScore = 8.6;
    const duration = 1500;
    const startTime = Date.now();
    
    const animate = () => {
      const progress = Math.min((Date.now() - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setScore(eased * finalScore);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, []);
  
  return (
    <div className="text-8xl font-black text-gradient mb-6 tabular-nums">
      {score.toFixed(1)}
    </div>
  );
};

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showMFADialog, setShowMFADialog] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [emailExists, setEmailExists] = useState<boolean | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const { settings } = useGlobalSettings();
  const { sendSecurityAlert } = useSecurityAlerts();
  
  // Check if running as native app
  const isNative = Capacitor.isNativePlatform();

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      navigate("/dashboard");
    }
  }, [user, authLoading, navigate]);

  // Countdown timer for lockout
  useEffect(() => {
    if (lockoutSeconds > 0) {
      const timer = setInterval(() => {
        setLockoutSeconds((prev) => {
          if (prev <= 1) {
            setIsLocked(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [lockoutSeconds]);

  // Check lockout status and email existence when email changes
  const checkLockout = useCallback(async (emailToCheck: string) => {
    if (!emailToCheck) {
      setEmailExists(null);
      setFailedAttempts(0);
      setIsLocked(false);
      return;
    }
    
    try {
      // First check if email exists
      const { data: exists } = await supabase.rpc('check_email_exists', {
        _email: emailToCheck
      });
      setEmailExists(exists === true);
      
      // Only check lockout if email exists
      if (exists) {
        const { data, error } = await supabase.rpc('check_account_lockout', {
          _email: emailToCheck
        });
        
        if (!error && data && data.length > 0) {
          const lockoutData = data[0];
          setIsLocked(lockoutData.is_locked);
          setLockoutSeconds(lockoutData.remaining_seconds);
          setFailedAttempts(lockoutData.failed_attempts);
        }
      } else {
        // Reset lockout state for non-existent emails
        setIsLocked(false);
        setLockoutSeconds(0);
        setFailedAttempts(0);
      }
    } catch (err) {
      console.error('Error checking lockout:', err);
    }
  }, []);

  // Check MFA requirement after login
  const checkMFARequired = async () => {
    const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    const { data: factorData } = await supabase.auth.mfa.listFactors();
    
    if (factorData?.totp?.some(f => f.status === "verified") && aalData?.currentLevel !== "aal2") {
      setShowMFADialog(true);
      return true;
    }
    return false;
  };

  // Clear failed attempts on successful login
  const clearFailedAttempts = async (userEmail: string) => {
    try {
      await supabase.rpc('clear_failed_logins', { _email: userEmail });
    } catch (err) {
      console.error('Error clearing failed logins:', err);
    }
  };

  // Record failed login attempt and send alert if locked
  const recordFailedAttempt = async (userEmail: string) => {
    try {
      const { data, error } = await supabase.rpc('record_failed_login', {
        _email: userEmail,
        _ip_address: null
      });
      
      if (!error && data && data.length > 0) {
        const result = data[0];
        setIsLocked(result.is_locked);
        setLockoutSeconds(result.remaining_seconds);
        setFailedAttempts(result.failed_attempts);
        
        // Send security alert email when account gets locked
        if (result.is_locked && result.failed_attempts >= 5) {
          sendSecurityAlert("ACCOUNT_LOCKED", userEmail, undefined, {
            failedAttempts: result.failed_attempts,
            lockoutMinutes: 5,
          });
        }
      }
    } catch (err) {
      console.error('Error recording failed login:', err);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if account is locked
    if (isLocked) {
      toast({
        title: "Konto gesperrt",
        description: `Zu viele Fehlversuche. Bitte warte ${formatTime(lockoutSeconds)}.`,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Record the failed attempt
        await recordFailedAttempt(email);
        throw error;
      }

      // Clear failed attempts on success
      await clearFailedAttempts(email);

      // Check if MFA is required
      const mfaRequired = await checkMFARequired();
      
      if (!mfaRequired) {
        toast({
          title: "Willkommen zurück!",
          description: "Du wirst zum Dashboard weitergeleitet.",
        });
        navigate("/dashboard");
      }
    } catch (error: any) {
      // Check for email not confirmed error
      let errorMessage = error.message || "Bitte überprüfe deine Eingaben.";
      let errorTitle = "Anmeldung fehlgeschlagen";
      
      if (error.message?.toLowerCase().includes("email not confirmed") ||
          error.message?.toLowerCase().includes("email confirmation")) {
        errorTitle = "E-Mail nicht bestätigt";
        errorMessage = "Bitte bestätige zuerst deine E-Mail-Adresse. Überprüfe deinen Posteingang.";
      } else if (isLocked) {
        errorMessage = `Konto für ${formatTime(lockoutSeconds)} gesperrt.`;
      } else if (error.message?.toLowerCase().includes("invalid login credentials")) {
        // Check if the email exists in the database
        try {
          const { data: emailExists } = await supabase.rpc('check_email_exists', {
            _email: email
          });
          
          if (emailExists === false) {
            errorTitle = "E-Mail nicht gefunden";
            errorMessage = "Diese E-Mail-Adresse ist nicht registriert. Bitte überprüfe die Eingabe oder registriere dich.";
          } else {
            errorTitle = "Falsches Passwort";
            errorMessage = "Das eingegebene Passwort ist falsch. Bitte versuche es erneut.";
          }
        } catch {
          // Fallback to generic message if check fails
          errorMessage = "E-Mail oder Passwort ist falsch.";
        }
      }
      
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "Google-Anmeldung fehlgeschlagen",
        description: error.message || "Bitte versuche es erneut.",
        variant: "destructive",
      });
      setGoogleLoading(false);
    }
  };

  // Native app layout - simplified, full screen form
  if (isNative) {
    return (
      <div className="min-h-screen bg-background flex flex-col safe-area-inset">
        <div className="flex-1 flex flex-col justify-center px-6 py-8">
          <div className="w-full max-w-sm mx-auto">
            {/* Logo */}
            <div className="mb-8 flex justify-center">
              <ScannerLogo size="lg" labelSize="lg" />
            </div>

            {/* Header */}
            <div className="mb-8 text-center">
              <h1 className="text-2xl font-bold mb-2">Willkommen zurück</h1>
              <p className="text-muted-foreground text-sm">
                Melde dich an, um fortzufahren
              </p>
            </div>

            {/* Lockout Warning - only show if email exists */}
            {isLocked && emailExists && (
              <Alert variant="destructive" className="mb-6">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Dein Konto ist vorübergehend gesperrt. Bitte warte{" "}
                  <span className="font-bold">{formatTime(lockoutSeconds)}</span>
                </AlertDescription>
              </Alert>
            )}

            {/* Failed Attempts Warning - only show if email exists */}
            {!isLocked && emailExists && failedAttempts > 0 && failedAttempts < 5 && (
              <Alert variant="default" className="mb-6 border-amber-500/50 bg-amber-500/10">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <AlertDescription className="text-amber-500">
                  {5 - failedAttempts} Versuche verbleibend
                </AlertDescription>
              </Alert>
            )}

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">E-Mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={() => checkLockout(email)}
                    className="pl-10 h-12 bg-card border-border text-base"
                    disabled={isLocked}
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Passwort</Label>
                  <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                    Vergessen?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 h-12 bg-card border-border text-base"
                    disabled={isLocked}
                    required
                    autoComplete="current-password"
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                variant="hero" 
                size="lg" 
                className="w-full h-12"
                disabled={loading || googleLoading || isLocked}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Anmelden...
                  </>
                ) : (
                  "Anmelden"
                )}
              </Button>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    oder
                  </span>
                </div>
              </div>

              {/* Google Login */}
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="w-full h-12"
                onClick={handleGoogleLogin}
                disabled={loading || googleLoading}
              >
                {googleLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Verbinde...
                  </>
                ) : (
                  <>
                    <GoogleIcon />
                    Mit Google anmelden
                  </>
                )}
              </Button>
            </form>

            {/* Register Link */}
            <p className="text-center text-muted-foreground mt-8 text-sm">
              Noch kein Konto?{" "}
              <Link to="/register" className="text-primary hover:underline font-medium">
                Jetzt registrieren
              </Link>
            </p>
          </div>
        </div>

        {/* MFA Verification Dialog */}
        <MFAVerification 
          open={showMFADialog}
          onVerified={() => {
            setShowMFADialog(false);
            toast({
              title: "Willkommen zurück!",
              description: "Du wirst zum Dashboard weitergeleitet.",
            });
            navigate("/dashboard");
          }}
          onCancel={() => {
            setShowMFADialog(false);
          }}
        />
      </div>
    );
  }

  // Desktop/Web layout - two column design
  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex flex-col justify-center px-8 md:px-16 lg:px-24">
        <div className="w-full max-w-md mx-auto">
          {/* Back Link */}
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Zurück zur Startseite
          </Link>

          {/* Logo */}
          <div className="mb-8">
            <ScannerLogo size="md" labelSize="lg" />
          </div>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Willkommen zurück</h1>
            <p className="text-muted-foreground">
              Melde dich an, um deinen Fortschritt zu tracken.
            </p>
          </div>

          {/* Lockout Warning - only show if email exists */}
          {isLocked && emailExists && (
            <Alert variant="destructive" className="mb-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Dein Konto ist vorübergehend gesperrt. Bitte warte{" "}
                <span className="font-bold">{formatTime(lockoutSeconds)}</span> bevor du es erneut versuchst.
                <Link to="/forgot-password" className="block mt-2 underline hover:no-underline">
                  Passwort vergessen? Jetzt zurücksetzen
                </Link>
              </AlertDescription>
            </Alert>
          )}

          {/* Failed Attempts Warning - only show if email exists */}
          {!isLocked && emailExists && failedAttempts > 0 && failedAttempts < 5 && (
            <Alert variant="default" className="mb-6 border-amber-500/50 bg-amber-500/10">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <AlertDescription className="text-amber-500">
                {5 - failedAttempts} Versuche verbleibend bevor dein Konto für 5 Minuten gesperrt wird.
              </AlertDescription>
            </Alert>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">E-Mail</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => checkLockout(email)}
                  className="pl-10 h-12 bg-card border-border"
                  disabled={isLocked}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Passwort</Label>
                <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                  Vergessen?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-12 bg-card border-border"
                  disabled={isLocked}
                  required
                />
              </div>
            </div>

            <Button 
              type="submit" 
              variant="hero" 
              size="lg" 
              className="w-full"
              disabled={loading || googleLoading || isLocked}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Anmelden...
                </>
              ) : (
                "Anmelden"
              )}
            </Button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  oder
                </span>
              </div>
            </div>

            {/* Google Login */}
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="w-full"
              onClick={handleGoogleLogin}
              disabled={loading || googleLoading}
            >
              {googleLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Verbinde mit Google...
                </>
              ) : (
                <>
                  <GoogleIcon />
                  Mit Google anmelden
                </>
              )}
            </Button>
          </form>

          {/* Register Link */}
          <p className="text-center text-muted-foreground mt-8">
            Noch kein Konto?{" "}
            <Link to="/register" className="text-primary hover:underline font-medium">
              Jetzt registrieren
            </Link>
          </p>
        </div>
      </div>

      {/* Right Side - Visual */}
      <div className="hidden lg:flex flex-1 relative bg-card overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-radial from-primary/20 via-transparent to-transparent opacity-50" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-primary/8 rounded-full blur-3xl animate-float" style={{ animationDelay: "1s" }} />
        
        {/* Floating Particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full animate-float"
              style={{ 
                left: `${10 + (i * 9)}%`, 
                top: `${15 + ((i * 13) % 60)}%`,
                width: `${3 + (i % 3) * 2}px`,
                height: `${3 + (i % 3) * 2}px`,
                backgroundColor: `hsl(var(--primary) / ${0.15 + (i % 4) * 0.08})`,
                animationDuration: `${4 + (i % 3) * 2}s`,
                animationDelay: `${i * 0.4}s`
              }}
            />
          ))}
        </div>

        {/* Pulsing Rings */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          {[...Array(3)].map((_, i) => (
            <div
              key={`ring-${i}`}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/10 animate-pulse-ring"
              style={{
                width: `${200 + i * 150}px`,
                height: `${200 + i * 150}px`,
                animationDelay: `${i * 0.8}s`,
                animationDuration: "4s"
              }}
            />
          ))}
        </div>
        
        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full p-16">
          <div className="text-center max-w-md">
            <AnimatedScore />
            <p className="text-xl font-semibold mb-2">Dein Potenzial wartet</p>
            <p className="text-muted-foreground">
              Tracke deinen Fortschritt und erreiche deinen Ziel-Score.
            </p>
          </div>
        </div>
      </div>

      {/* MFA Verification Dialog */}
      <MFAVerification 
        open={showMFADialog}
        onVerified={() => {
          setShowMFADialog(false);
          toast({
            title: "Willkommen zurück!",
            description: "Du wirst zum Dashboard weitergeleitet.",
          });
          navigate("/dashboard");
        }}
        onCancel={() => {
          setShowMFADialog(false);
          navigate("/");
        }}
      />
    </div>
  );
};

export default Login;
