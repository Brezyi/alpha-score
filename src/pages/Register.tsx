import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Zap, ArrowLeft, Mail, Lock, User, Loader2, Check, AlertCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useGlobalSettings } from "@/contexts/SystemSettingsContext";
import { validateDisplayName } from "@/lib/displayNameValidation";

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

const benefits = [
  "KI-Analyse deines Aussehens",
  "Personalisierter Looksmax-Plan",
  "Progress Tracking mit Streak-System",
  "Zugang zum AI Coach",
];

const Register = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const { settings } = useGlobalSettings();

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      navigate("/dashboard");
    }
  }, [user, authLoading, navigate]);

  // Password strength calculation
  const getPasswordStrength = (pwd: string): { score: number; label: string; color: string } => {
    let score = 0;
    if (pwd.length >= 8) score += 1;
    if (pwd.length >= 12) score += 1;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score += 1;
    if (/\d/.test(pwd)) score += 1;
    if (/[^a-zA-Z0-9]/.test(pwd)) score += 1;

    if (score <= 1) return { score: 20, label: "Sehr schwach", color: "bg-destructive" };
    if (score === 2) return { score: 40, label: "Schwach", color: "bg-orange-500" };
    if (score === 3) return { score: 60, label: "Mittel", color: "bg-yellow-500" };
    if (score === 4) return { score: 80, label: "Stark", color: "bg-primary/70" };
    return { score: 100, label: "Sehr stark", color: "bg-primary" };
  };

  const passwordStrength = getPasswordStrength(password);
  const passwordsMatch = confirmPassword === "" || password === confirmPassword;

  // Name validation - only letters, spaces, hyphens allowed
  const isValidName = (name: string): boolean => {
    return /^[a-zA-ZäöüÄÖÜßéèêëàâîïôûùç\s\-']+$/.test(name);
  };
  
  const firstNameValid = firstName === "" || isValidName(firstName);
  const lastNameValid = lastName === "" || isValidName(lastName);

  const handleNameChange = (value: string, setter: (val: string) => void) => {
    // Allow typing but filter out invalid characters
    const filtered = value.replace(/[0-9]/g, '');
    setter(filtered);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate name format
      if (!isValidName(firstName.trim()) || !isValidName(lastName.trim())) {
        toast({
          title: "Ungültiger Name",
          description: "Vor- und Nachname dürfen nur Buchstaben enthalten.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Validate inputs
      if (!firstName.trim() || !lastName.trim()) {
        toast({
          title: "Fehlende Angaben",
          description: "Bitte gib deinen Vor- und Nachnamen ein.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Check password confirmation
      if (password !== confirmPassword) {
        toast({
          title: "Passwörter stimmen nicht überein",
          description: "Bitte stelle sicher, dass beide Passwörter identisch sind.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Validate display name for forbidden content
      const nameValidation = validateDisplayName(displayName.trim());
      if (!nameValidation.valid) {
        toast({
          title: "Ungültiger Anzeigename",
          description: nameValidation.error,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Check if display name is available
      const { data: isAvailable, error: checkError } = await supabase.rpc('check_display_name_available', {
        p_display_name: displayName.trim(),
        p_current_user_id: null
      });

      if (checkError) throw checkError;

      if (!isAvailable) {
        toast({
          title: "Name nicht verfügbar",
          description: "Dieser Anzeigename ist bereits vergeben. Bitte wähle einen anderen.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Sign up user
      const { data: signUpData, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: displayName.trim(),
            // Store first/last name temporarily in metadata for the post-login hook
            pending_first_name: firstName.trim(),
            pending_last_name: lastName.trim(),
          },
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) throw error;

      // Store sensitive data for later (will be processed on first login after email verification)
      if (signUpData?.user) {
        localStorage.setItem('pending_sensitive_data', JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
        }));
      }

      // Check if email confirmation is required
      if (signUpData?.user && !signUpData.session) {
        // Email confirmation required
        toast({
          title: "Bestätigungs-E-Mail gesendet!",
          description: "Bitte überprüfe dein Postfach und klicke auf den Bestätigungslink.",
        });
      } else {
        toast({
          title: "Konto erstellt!",
          description: "Du kannst dich jetzt anmelden.",
        });
      }
      navigate("/login");
    } catch (error: any) {
      toast({
        title: "Registrierung fehlgeschlagen",
        description: error.message || "Bitte versuche es erneut.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
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
        title: "Google-Registrierung fehlgeschlagen",
        description: error.message || "Bitte versuche es erneut.",
        variant: "destructive",
      });
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Side - Visual */}
      <div className="hidden lg:flex flex-1 relative bg-card overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-radial from-primary/20 via-transparent to-transparent opacity-50" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-primary/8 rounded-full blur-3xl animate-float" style={{ animationDelay: "1.5s" }} />
        
        {/* Floating Particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full animate-float"
              style={{ 
                left: `${8 + (i * 8)}%`, 
                top: `${12 + ((i * 15) % 65)}%`,
                width: `${3 + (i % 3) * 2}px`,
                height: `${3 + (i % 3) * 2}px`,
                backgroundColor: `hsl(var(--primary) / ${0.12 + (i % 4) * 0.06})`,
                animationDuration: `${5 + (i % 4) * 1.5}s`,
                animationDelay: `${i * 0.35}s`
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
                width: `${180 + i * 140}px`,
                height: `${180 + i * 140}px`,
                animationDelay: `${i * 0.7}s`,
                animationDuration: "4.5s"
              }}
            />
          ))}
        </div>
        
        {/* Animated Lines */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(2)].map((_, i) => (
            <div
              key={`line-${i}`}
              className="absolute h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent animate-shimmer"
              style={{
                top: `${30 + i * 35}%`,
                left: 0,
                right: 0,
                animationDuration: `${4 + i}s`,
                animationDelay: `${i * 0.5}s`
              }}
            />
          ))}
        </div>
        
        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full p-16">
          <div className="max-w-md">
            <h2 className="text-3xl font-bold mb-6">
              Starte deine <span className="text-gradient">Transformation</span>
            </h2>
            <ul className="space-y-4">
              {benefits.map((benefit) => (
                <li key={benefit} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-muted-foreground">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
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
          <div className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold">{settings.app_name}</span>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Konto erstellen</h1>
            <p className="text-muted-foreground">
              Starte kostenlos – keine Kreditkarte erforderlich.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleRegister} className="space-y-5">
            {/* First & Last Name Row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Vorname</Label>
                <div className="relative">
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="Max"
                    value={firstName}
                    onChange={(e) => handleNameChange(e.target.value, setFirstName)}
                    className={`h-12 bg-card border-border ${
                      firstName && !firstNameValid ? "border-destructive focus-visible:ring-destructive" : ""
                    }`}
                    minLength={2}
                    maxLength={50}
                    required
                  />
                  {firstName && !firstNameValid && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <AlertCircle className="h-4 w-4 text-destructive" />
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Nachname</Label>
                <div className="relative">
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Mustermann"
                    value={lastName}
                    onChange={(e) => handleNameChange(e.target.value, setLastName)}
                    className={`h-12 bg-card border-border ${
                      lastName && !lastNameValid ? "border-destructive focus-visible:ring-destructive" : ""
                    }`}
                    minLength={2}
                    maxLength={50}
                    required
                  />
                  {lastName && !lastNameValid && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <AlertCircle className="h-4 w-4 text-destructive" />
                    </div>
                  )}
                </div>
              </div>
            </div>
            {(!firstNameValid || !lastNameValid) && (firstName || lastName) ? (
              <p className="text-xs text-destructive -mt-3 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Nur Buchstaben erlaubt (keine Zahlen oder Sonderzeichen)
              </p>
            ) : (
              <p className="text-xs text-muted-foreground -mt-3">
                Dein echter Name wird privat gespeichert und ist nur für dich sichtbar.
              </p>
            )}

            {/* Display Name */}
            <div className="space-y-2">
              <Label htmlFor="displayName">Anzeigename</Label>
              <p className="text-xs text-muted-foreground">
                Dieser Name wird öffentlich angezeigt. Du kannst ihn später ändern.
              </p>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="displayName"
                  type="text"
                  placeholder="Dein Anzeigename"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="pl-10 h-12 bg-card border-border"
                  minLength={2}
                  maxLength={30}
                  required
                />
              </div>
            </div>

            {/* Email */}
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
                  className="pl-10 h-12 bg-card border-border"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">Passwort</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Mind. 8 Zeichen"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-12 bg-card border-border"
                  minLength={8}
                  required
                />
              </div>
              {/* Password Strength Indicator */}
              {password && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Passwortstärke:</span>
                    <span className={`font-medium ${
                      passwordStrength.score <= 40 ? "text-destructive" : 
                      passwordStrength.score <= 60 ? "text-yellow-500" : "text-primary"
                    }`}>
                      {passwordStrength.label}
                    </span>
                  </div>
                  <Progress 
                    value={passwordStrength.score} 
                    className="h-1.5"
                    indicatorClassName={passwordStrength.color}
                  />
                  <ul className="text-xs text-muted-foreground space-y-0.5 mt-1">
                    <li className={password.length >= 8 ? "text-primary" : ""}>
                      {password.length >= 8 ? "✓" : "○"} Mindestens 8 Zeichen
                    </li>
                    <li className={/[a-z]/.test(password) && /[A-Z]/.test(password) ? "text-primary" : ""}>
                      {/[a-z]/.test(password) && /[A-Z]/.test(password) ? "✓" : "○"} Groß- und Kleinbuchstaben
                    </li>
                    <li className={/\d/.test(password) ? "text-primary" : ""}>
                      {/\d/.test(password) ? "✓" : "○"} Mindestens eine Zahl
                    </li>
                    <li className={/[^a-zA-Z0-9]/.test(password) ? "text-primary" : ""}>
                      {/[^a-zA-Z0-9]/.test(password) ? "✓" : "○"} Sonderzeichen (z.B. !@#$)
                    </li>
                  </ul>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Passwort bestätigen</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Passwort wiederholen"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`pl-10 h-12 bg-card border-border ${
                    confirmPassword && !passwordsMatch ? "border-destructive focus-visible:ring-destructive" : ""
                  } ${confirmPassword && passwordsMatch ? "border-primary focus-visible:ring-primary" : ""}`}
                  minLength={8}
                  required
                />
                {confirmPassword && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {passwordsMatch ? (
                      <Check className="h-5 w-5 text-primary" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-destructive" />
                    )}
                  </div>
                )}
              </div>
              {confirmPassword && !passwordsMatch && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Passwörter stimmen nicht überein
                </p>
              )}
            </div>

            <Button 
              type="submit" 
              variant="hero" 
              size="lg" 
              className="w-full"
              disabled={loading || googleLoading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Wird erstellt...
                </>
              ) : (
                "Kostenlos registrieren"
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

            {/* Google Signup */}
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="w-full"
              onClick={handleGoogleSignup}
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
                  Mit Google registrieren
                </>
              )}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              Mit der Registrierung akzeptierst du unsere{" "}
              <Link to="/agb" className="text-primary hover:underline">AGB</Link> und{" "}
              <Link to="/datenschutz" className="text-primary hover:underline">Datenschutzrichtlinien</Link>.
            </p>
          </form>

          {/* Login Link */}
          <p className="text-center text-muted-foreground mt-8">
            Bereits registriert?{" "}
            <Link to="/login" className="text-primary hover:underline font-medium">
              Jetzt anmelden
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;