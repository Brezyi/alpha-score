import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Mail, Lock, User, Loader2, Check, AlertCircle, Gift } from "lucide-react";
import { ScannerLogo } from "@/components/ScannerLogo";
import { Progress } from "@/components/ui/progress";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { useGlobalSettings } from "@/contexts/SystemSettingsContext";
import { validateDisplayName } from "@/lib/displayNameValidation";
import { Capacitor } from "@capacitor/core";
import { recordReferral } from "@/hooks/useReferral";

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

const Register = () => {
  const [searchParams] = useSearchParams();
  const { t } = useLanguage();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [referralCode, setReferralCode] = useState(searchParams.get("ref") || "");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const { settings } = useGlobalSettings();
  const isNative = Capacitor.isNativePlatform();

  const normalizeEmail = (value: string) => value.trim().toLowerCase();

  const benefits = [
    t("register.benefit1"),
    t("register.benefit2"),
    t("register.benefit3"),
    t("register.benefit4"),
  ];

  useEffect(() => {
    if (!authLoading && user) {
      navigate("/dashboard");
    }
  }, [user, authLoading, navigate]);

  const getPasswordStrength = (pwd: string): { score: number; label: string; color: string } => {
    let score = 0;
    if (pwd.length >= 8) score += 1;
    if (pwd.length >= 12) score += 1;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score += 1;
    if (/\d/.test(pwd)) score += 1;
    if (/[^a-zA-Z0-9]/.test(pwd)) score += 1;

    if (score <= 1) return { score: 20, label: t("register.passwordStrength.veryWeak"), color: "bg-destructive" };
    if (score === 2) return { score: 40, label: t("register.passwordStrength.weak"), color: "bg-orange-500" };
    if (score === 3) return { score: 60, label: t("register.passwordStrength.medium"), color: "bg-yellow-500" };
    if (score === 4) return { score: 80, label: t("register.passwordStrength.strong"), color: "bg-primary/70" };
    return { score: 100, label: t("register.passwordStrength.veryStrong"), color: "bg-primary" };
  };

  const passwordStrength = getPasswordStrength(password);
  const passwordsMatch = confirmPassword === "" || password === confirmPassword;

  const isValidName = (name: string): boolean => {
    return /^[a-zA-ZäöüÄÖÜßéèêëàâîïôûùç\s\-']+$/.test(name);
  };
  
  const firstNameValid = firstName === "" || isValidName(firstName);
  const lastNameValid = lastName === "" || isValidName(lastName);

  const handleNameChange = (value: string, setter: (val: string) => void) => {
    const filtered = value.replace(/[0-9]/g, '');
    setter(filtered);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!isValidName(firstName.trim()) || !isValidName(lastName.trim())) {
        toast({ title: t("register.invalidName"), description: t("register.invalidNameDesc"), variant: "destructive" });
        setLoading(false);
        return;
      }

      if (!firstName.trim() || !lastName.trim()) {
        toast({ title: t("register.missingFields"), description: t("register.missingFieldsDesc"), variant: "destructive" });
        setLoading(false);
        return;
      }

      if (password !== confirmPassword) {
        toast({ title: t("register.passwordMismatch"), description: t("register.passwordMismatch"), variant: "destructive" });
        setLoading(false);
        return;
      }

      const nameValidation = validateDisplayName(displayName.trim());
      if (!nameValidation.valid) {
        toast({ title: t("register.invalidDisplayName"), description: nameValidation.error, variant: "destructive" });
        setLoading(false);
        return;
      }

      const { data: isAvailable, error: checkError } = await supabase.rpc('check_display_name_available', {
        p_display_name: displayName.trim(),
        p_current_user_id: null
      });

      if (checkError) throw checkError;

      if (!isAvailable) {
        toast({ title: t("register.nameUnavailable"), description: t("register.nameUnavailableDesc"), variant: "destructive" });
        setLoading(false);
        return;
      }

      const normalizedEmail = normalizeEmail(email);
      
      let emailAlreadyExists = false;
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const { data: exists, error: existsError } = await supabase.rpc("check_email_exists", {
          _email: normalizedEmail,
        });
        
        clearTimeout(timeoutId);

        if (existsError) {
          console.error("check_email_exists error:", existsError);
        } else if (exists === true) {
          emailAlreadyExists = true;
        }
      } catch (checkError: any) {
        console.error("Email check failed:", checkError);
      }

      if (emailAlreadyExists) {
        toast({ title: t("register.emailExists"), description: t("register.emailExistsDesc"), variant: "destructive" });
        navigate(`/email-confirmation?email=${encodeURIComponent(normalizedEmail)}`);
        setLoading(false);
        return;
      }

      const { data: signUpData, error } = await supabase.auth.signUp({
        email: normalizeEmail(email),
        password,
        options: {
          data: {
            full_name: displayName.trim(),
            pending_first_name: firstName.trim(),
            pending_last_name: lastName.trim(),
          },
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) throw error;

      if (signUpData?.user) {
        localStorage.setItem('pending_sensitive_data', JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
        }));

        if (referralCode.trim()) {
          await recordReferral(referralCode.trim(), signUpData.user.id);
        }
      }

      if (signUpData?.user && !signUpData.session) {
        navigate(`/email-confirmation?email=${encodeURIComponent(email)}`);
        return;
      } else {
        toast({ title: t("register.accountCreated"), description: t("register.canLogin") });
        navigate("/login");
      }
    } catch (error: any) {
      let errorTitle = t("register.failedTitle");
      let errorDescription = error.message || t("common.retry");

      const errorLower = error.message?.toLowerCase?.() ?? "";

      if (errorLower.includes("rate limit") || errorLower.includes("email rate limit") || error?.status === 429) {
        errorTitle = t("register.rateLimitTitle");
        errorDescription = t("register.rateLimitDesc");
      } else if (error.message?.toLowerCase().includes("weak") || 
          error.message?.toLowerCase().includes("pwned") ||
          error.code === "weak_password") {
        errorTitle = t("register.weakPassword");
        errorDescription = t("register.weakPasswordDesc");
      } else if (error.message?.toLowerCase().includes("already registered") ||
                 error.message?.toLowerCase().includes("already exists")) {
        errorTitle = t("register.emailExists");
        errorDescription = t("register.emailExistsDesc");
      }

      toast({ title: errorTitle, description: errorDescription, variant: "destructive" });
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
        title: t("register.googleFailed"),
        description: error.message || t("common.retry"),
        variant: "destructive",
      });
      setGoogleLoading(false);
    }
  };

  // Native app layout
  if (isNative) {
    return (
      <div className="min-h-screen bg-background flex flex-col safe-area-inset">
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="w-full max-w-sm mx-auto">
            <div className="mb-6 flex justify-center">
              <ScannerLogo size="lg" labelSize="lg" />
            </div>

            <div className="mb-6 text-center">
              <h1 className="text-2xl font-bold mb-2">{t("register.title")}</h1>
              <p className="text-muted-foreground text-sm">
                {t("register.subtitle")}
              </p>
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="firstName" className="text-sm">{t("register.firstName")}</Label>
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="Max"
                    value={firstName}
                    onChange={(e) => handleNameChange(e.target.value, setFirstName)}
                    className="h-11 bg-card border-border text-base"
                    minLength={2}
                    maxLength={50}
                    required
                    autoComplete="given-name"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lastName" className="text-sm">{t("register.lastName")}</Label>
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Mustermann"
                    value={lastName}
                    onChange={(e) => handleNameChange(e.target.value, setLastName)}
                    className="h-11 bg-card border-border text-base"
                    minLength={2}
                    maxLength={50}
                    required
                    autoComplete="family-name"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="displayName" className="text-sm">{t("register.displayName")}</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="displayName"
                    type="text"
                    placeholder={t("register.displayNamePlaceholder")}
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="pl-10 h-11 bg-card border-border text-base"
                    minLength={2}
                    maxLength={30}
                    required
                    autoComplete="nickname"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm">{t("register.email")}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-11 bg-card border-border text-base"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-sm">{t("register.password")}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder={t("register.passwordMin")}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 h-11 bg-card border-border text-base"
                    minLength={8}
                    required
                    autoComplete="new-password"
                  />
                </div>
                {password && (
                  <div className="space-y-1">
                    <Progress value={passwordStrength.score} className="h-1" />
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{passwordStrength.label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground/70">
                      ⚠ {t("register.passwordReq.breach")}
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword" className="text-sm">{t("register.confirmPassword")}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder={t("register.confirmPasswordPlaceholder")}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`pl-10 h-11 bg-card border-border text-base ${!passwordsMatch ? "border-destructive" : ""}`}
                    required
                    autoComplete="new-password"
                  />
                </div>
                {!passwordsMatch && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {t("register.passwordMismatch")}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="referralCode" className="text-sm">{t("register.referralCode")}</Label>
                <div className="relative">
                  <Gift className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="referralCode"
                    type="text"
                    placeholder="z.B. A1B2C3D4"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                    className="pl-10 h-11 bg-card border-border text-base uppercase"
                    maxLength={8}
                    autoComplete="off"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {t("register.referralCodeHint")}
                </p>
              </div>

              <Button
                type="submit" 
                variant="hero" 
                size="lg" 
                className="w-full h-12 mt-2"
                disabled={loading || googleLoading || !passwordsMatch}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {t("register.submitting")}
                  </>
                ) : (
                  t("register.submit")
                )}
              </Button>

              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">{t("common.or")}</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                size="lg"
                className="w-full h-12"
                onClick={handleGoogleSignup}
                disabled={loading || googleLoading}
              >
                {googleLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {t("register.connecting")}
                  </>
                ) : (
                  <>
                    <GoogleIcon />
                    {t("register.googleRegister")}
                  </>
                )}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                {t("register.termsPrefix")}{" "}
                <Link to="/agb" className="text-primary hover:underline">{t("register.termsLink")}</Link> {t("register.termsAnd")}{" "}
                <Link to="/datenschutz" className="text-primary hover:underline">{t("register.privacyLink")}</Link>.
              </p>
            </form>

            <p className="text-center text-muted-foreground mt-6 text-sm">
              {t("register.hasAccount")}{" "}
              <Link to="/login" className="text-primary hover:underline font-medium">
                {t("register.loginNow")}
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

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
              {t("register.startTransformation")} <span className="text-gradient">{t("register.transformation")}</span>
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
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            {t("nav.backToHome")}
          </Link>

          <div className="mb-8">
            <ScannerLogo size="md" labelSize="lg" />
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">{t("register.title")}</h1>
            <p className="text-muted-foreground">
              {t("register.subtitleDesktop")}
            </p>
          </div>

          <form onSubmit={handleRegister} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">{t("register.firstName")}</Label>
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
                <Label htmlFor="lastName">{t("register.lastName")}</Label>
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
                {t("register.onlyLetters")}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground -mt-3">
                {t("register.nameHint")}
              </p>
            )}

            <div className="space-y-2">
              <Label htmlFor="displayName">{t("register.displayName")}</Label>
              <p className="text-xs text-muted-foreground">
                {t("register.displayNameHint")}
              </p>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="displayName"
                  type="text"
                  placeholder={t("register.displayNamePlaceholder")}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="pl-10 h-12 bg-card border-border"
                  minLength={2}
                  maxLength={30}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{t("register.email")}</Label>
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

            <div className="space-y-2">
              <Label htmlFor="password">{t("register.password")}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder={t("register.passwordMin")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-12 bg-card border-border"
                  minLength={8}
                  required
                />
              </div>
              {password && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{t("register.passwordStrength.label")}</span>
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
                      {password.length >= 8 ? "✓" : "○"} {t("register.passwordReq.min8")}
                    </li>
                    <li className={/[a-z]/.test(password) && /[A-Z]/.test(password) ? "text-primary" : ""}>
                      {/[a-z]/.test(password) && /[A-Z]/.test(password) ? "✓" : "○"} {t("register.passwordReq.cases")}
                    </li>
                    <li className={/\d/.test(password) ? "text-primary" : ""}>
                      {/\d/.test(password) ? "✓" : "○"} {t("register.passwordReq.number")}
                    </li>
                    <li className={/[^a-zA-Z0-9]/.test(password) ? "text-primary" : ""}>
                      {/[^a-zA-Z0-9]/.test(password) ? "✓" : "○"} {t("register.passwordReq.special")}
                    </li>
                    <li className="text-muted-foreground/70">
                      ⚠ {t("register.passwordReq.breach")}
                    </li>
                  </ul>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t("register.confirmPassword")}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder={t("register.confirmPasswordPlaceholder")}
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
                  {t("register.passwordMismatch")}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="referralCodeDesktop">{t("register.referralCode")}</Label>
              <div className="relative">
                <Gift className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="referralCodeDesktop"
                  type="text"
                  placeholder="z.B. A1B2C3D4"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                  className="pl-10 h-12 bg-card border-border uppercase"
                  maxLength={8}
                  autoComplete="off"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {t("register.referralCodeHintDesktop")}
              </p>
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
                  {t("register.submittingDesktop")}
                </>
              ) : (
                t("register.submitDesktop")
              )}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  {t("common.or")}
                </span>
              </div>
            </div>

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
                  {t("register.connecting")}...
                </>
              ) : (
                <>
                  <GoogleIcon />
                  {t("register.googleRegister")}
                </>
              )}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              {t("register.termsPrefix")}{" "}
              <Link to="/agb" className="text-primary hover:underline">{t("register.termsLink")}</Link> {t("register.termsAnd")}{" "}
              <Link to="/datenschutz" className="text-primary hover:underline">{t("register.privacyLink")}</Link>.
            </p>
          </form>

          <p className="text-center text-muted-foreground mt-8">
            {t("register.hasAccount")}{" "}
            <Link to="/login" className="text-primary hover:underline font-medium">
              {t("register.loginNow")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
