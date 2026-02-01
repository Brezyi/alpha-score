import { useState, useEffect } from "react";
import { Shield, Lock, AlertTriangle, Calendar, Eye, EyeOff, Mail, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAdminPassword } from "@/hooks/useAdminPassword";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AdminPasswordDialogProps {
  open: boolean;
  onSuccess: () => void;
  onCancel: () => void;
}

// Helper to get user-friendly content based on mode
function getModeContent(mode: "setup" | "expired" | "verify") {
  switch (mode) {
    case "setup":
      return {
        title: "Zusätzlichen Schutz einrichten",
        subtitle: "Erstelle ein separates Passwort für sensible Bereiche",
        description: "Dieses Passwort schützt den Zugang zu administrativen Funktionen. Es ist unabhängig von deinem Login-Passwort und bietet eine zusätzliche Sicherheitsebene.",
        buttonText: "Schutz aktivieren",
        inputLabel: "Neues Admin-Passwort",
        inputPlaceholder: "Mindestens 8 Zeichen",
      };
    case "expired":
      return {
        title: "Passwort erneuern",
        subtitle: "Dein Admin-Passwort ist abgelaufen",
        description: "Aus Sicherheitsgründen muss das Admin-Passwort alle 3 Monate erneuert werden. Bitte erstelle jetzt ein neues Passwort.",
        buttonText: "Neues Passwort speichern",
        inputLabel: "Neues Admin-Passwort",
        inputPlaceholder: "Mindestens 8 Zeichen",
      };
    case "verify":
      return {
        title: "Zugang bestätigen",
        subtitle: "Gib dein Admin-Passwort ein",
        description: "Um auf sensible Einstellungen zuzugreifen, bestätige bitte deine Identität mit dem Admin-Passwort.",
        buttonText: "Zugang freischalten",
        inputLabel: "Admin-Passwort",
        inputPlaceholder: "Dein Admin-Passwort",
      };
  }
}

export function AdminPasswordDialog({ open, onSuccess, onCancel }: AdminPasswordDialogProps) {
  const { status, loading, setPassword, verifyPassword, isVerified } = useAdminPassword();
  const { isOwner } = useUserRole();
  const [password, setPasswordValue] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [sendingResetEmail, setSendingResetEmail] = useState(false);

  // Mode: "setup" (create new), "expired" (must renew), or "verify" (enter existing)
  const mode = !status?.hasPassword ? "setup" : status.isExpired ? "expired" : "verify";
  const content = getModeContent(mode);

  // If already verified, trigger success
  useEffect(() => {
    if (isVerified && open) {
      onSuccess();
    }
  }, [isVerified, open, onSuccess]);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setPasswordValue("");
      setConfirmPassword("");
      setError("");
      setShowForgotPassword(false);
    }
  }, [open]);

  const handleForgotPassword = async () => {
    setSendingResetEmail(true);
    try {
      const { error } = await supabase.functions.invoke("send-admin-password-reset", {
        method: "POST",
      });

      if (error) {
        toast.error("Fehler beim Senden der E-Mail");
        console.error("Reset email error:", error);
      } else {
        toast.success("Reset-Link wurde per E-Mail gesendet!");
        setShowForgotPassword(false);
      }
    } catch (err) {
      console.error("Reset email exception:", err);
      toast.error("Ein Fehler ist aufgetreten");
    } finally {
      setSendingResetEmail(false);
    }
  };

  const handleSetup = async () => {
    setError("");

    if (password.length < 8) {
      setError("Passwort muss mindestens 8 Zeichen lang sein");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwörter stimmen nicht überein");
      return;
    }

    // Check for complexity
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);

    if (!hasUpper || !hasLower || !hasNumber) {
      setError("Passwort muss Groß-, Kleinbuchstaben und Zahlen enthalten");
      return;
    }

    setSubmitting(true);
    const result = await setPassword(password);
    setSubmitting(false);

    if (result.success) {
      toast.success(mode === "setup" ? "Admin-Passwort erstellt" : "Admin-Passwort erneuert");
      onSuccess();
    } else {
      setError(result.error || "Ein Fehler ist aufgetreten");
    }
  };

  const handleVerify = async () => {
    setError("");

    if (!password) {
      setError("Bitte gib dein Admin-Passwort ein");
      return;
    }

    setSubmitting(true);
    const result = await verifyPassword(password);
    setSubmitting(false);

    if (result.success) {
      if (result.daysUntilExpiry !== undefined && result.daysUntilExpiry <= 14) {
        toast.warning(`Admin-Passwort läuft in ${result.daysUntilExpiry} Tagen ab`);
      }
      onSuccess();
    } else {
      setError(result.error || "Falsches Passwort");
    }
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
        <DialogContent className="sm:max-w-md">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-lg">
                {content.title}
              </DialogTitle>
              <DialogDescription className="text-sm">
                {content.subtitle}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Context info box - shown for all modes */}
          <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {content.description}
            </p>
          </div>

          {mode === "expired" && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Aus Sicherheitsgründen ist eine Erneuerung erforderlich.
              </AlertDescription>
            </Alert>
          )}

          {mode === "verify" && status?.daysUntilExpiry !== undefined && status.daysUntilExpiry <= 14 && (
            <Alert className="border-warning/50 bg-warning/10">
              <Calendar className="h-4 w-4 text-warning" />
              <AlertDescription className="text-warning">
                Dein Passwort läuft in {status.daysUntilExpiry} Tagen ab – denk daran, es bald zu erneuern.
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="admin-password" className="text-sm font-medium">
                {content.inputLabel}
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPasswordValue(e.target.value)}
                  placeholder={content.inputPlaceholder}
                  className="pl-10 pr-10 h-11"
                  autoComplete="off"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && mode === "verify") {
                      handleVerify();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? "Passwort verbergen" : "Passwort anzeigen"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {(mode === "setup" || mode === "expired") && (
              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="text-sm font-medium">Passwort bestätigen</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirm-password"
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Passwort wiederholen"
                    className="pl-10 h-11"
                    autoComplete="off"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleSetup();
                      }
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {(mode === "setup" || mode === "expired") && (
            <div className="p-3 rounded-lg bg-muted/30 border border-border/30">
              <p className="text-xs font-medium text-foreground mb-2">Passwort-Anforderungen:</p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li className="flex items-center gap-2">
                  <span className={password.length >= 8 ? "text-success" : ""}>
                    {password.length >= 8 ? "✓" : "○"}
                  </span>
                  Mindestens 8 Zeichen
                </li>
                <li className="flex items-center gap-2">
                  <span className={/[A-Z]/.test(password) && /[a-z]/.test(password) ? "text-success" : ""}>
                    {/[A-Z]/.test(password) && /[a-z]/.test(password) ? "✓" : "○"}
                  </span>
                  Groß- und Kleinbuchstaben
                </li>
                <li className="flex items-center gap-2">
                  <span className={/[0-9]/.test(password) ? "text-success" : ""}>
                    {/[0-9]/.test(password) ? "✓" : "○"}
                  </span>
                  Mindestens eine Zahl
                </li>
              </ul>
            </div>
          )}

          {/* Forgot Password - different for owners vs admins */}
          {mode === "verify" && !showForgotPassword && (
            <div className="text-center pt-1">
              {isOwner ? (
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-sm text-primary hover:underline"
                >
                  Passwort vergessen?
                </button>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Passwort vergessen? Bitte kontaktiere den Account-Inhaber.
                </p>
              )}
            </div>
          )}

          {/* Forgot Password Form - only for owners */}
          {showForgotPassword && isOwner && (
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Mail className="w-4 h-4 text-primary" />
                Passwort zurücksetzen
              </div>
              <p className="text-xs text-muted-foreground">
                Wir senden dir einen sicheren Link an deine E-Mail-Adresse, mit dem du ein neues Passwort erstellen kannst.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowForgotPassword(false)}
                  disabled={sendingResetEmail}
                  className="flex-1"
                >
                  Zurück
                </Button>
                <Button
                  size="sm"
                  onClick={handleForgotPassword}
                  disabled={sendingResetEmail}
                  className="flex-1"
                >
                  {sendingResetEmail ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Link senden"
                  )}
                </Button>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-3">
            <Button variant="outline" onClick={onCancel} className="flex-1 h-11">
              Abbrechen
            </Button>
            <Button
              onClick={mode === "verify" ? handleVerify : handleSetup}
              disabled={submitting}
              className="flex-1 h-11"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                content.buttonText
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
