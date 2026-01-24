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
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <DialogTitle>
                {mode === "setup" && "Admin-Passwort erstellen"}
                {mode === "expired" && "Passwort erneuern"}
                {mode === "verify" && "Admin-Bereich entsperren"}
              </DialogTitle>
              <DialogDescription>
                {mode === "setup" && "Erstelle ein separates Passwort für den Admin-Zugang"}
                {mode === "expired" && "Dein Admin-Passwort ist abgelaufen (3 Monate)"}
                {mode === "verify" && "Gib dein Admin-Passwort ein, um fortzufahren"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {mode === "expired" && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Dein Admin-Passwort ist abgelaufen. Bitte erstelle ein neues Passwort.
              </AlertDescription>
            </Alert>
          )}

          {mode === "verify" && status?.daysUntilExpiry !== undefined && status.daysUntilExpiry <= 14 && (
            <Alert>
              <Calendar className="h-4 w-4" />
              <AlertDescription>
                Dein Admin-Passwort läuft in {status.daysUntilExpiry} Tagen ab
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
              <Label htmlFor="admin-password">
                {mode === "verify" ? "Admin-Passwort" : "Neues Admin-Passwort"}
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPasswordValue(e.target.value)}
                  placeholder={mode === "verify" ? "Passwort eingeben" : "Mind. 8 Zeichen"}
                  className="pl-10 pr-10"
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
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {(mode === "setup" || mode === "expired") && (
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Passwort bestätigen</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirm-password"
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Passwort wiederholen"
                    className="pl-10"
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
            <div className="text-xs text-muted-foreground space-y-1">
              <p>• Mindestens 8 Zeichen</p>
              <p>• Groß- und Kleinbuchstaben</p>
              <p>• Mindestens eine Zahl</p>
              <p>• Muss alle 3 Monate erneuert werden</p>
            </div>
          )}

          {/* Forgot Password Link - only for owners in verify mode */}
          {mode === "verify" && isOwner && !showForgotPassword && (
            <button
              type="button"
              onClick={() => setShowForgotPassword(true)}
              className="text-sm text-primary hover:underline w-full text-center"
            >
              Admin-Passwort vergessen?
            </button>
          )}

          {/* Forgot Password Form - only for owners */}
          {showForgotPassword && isOwner && (
            <div className="p-4 rounded-lg bg-muted/50 border space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Mail className="w-4 h-4 text-primary" />
                Passwort per E-Mail zurücksetzen
              </div>
              <p className="text-xs text-muted-foreground">
                Ein Reset-Link wird an deine registrierte E-Mail-Adresse gesendet.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowForgotPassword(false)}
                  disabled={sendingResetEmail}
                  className="flex-1"
                >
                  Abbrechen
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
                    <>
                      <Mail className="w-4 h-4 mr-1" />
                      Link senden
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={onCancel} className="flex-1">
              Abbrechen
            </Button>
            <Button
              onClick={mode === "verify" ? handleVerify : handleSetup}
              disabled={submitting}
              className="flex-1"
            >
              {submitting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              ) : mode === "verify" ? (
                "Entsperren"
              ) : (
                "Passwort speichern"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
