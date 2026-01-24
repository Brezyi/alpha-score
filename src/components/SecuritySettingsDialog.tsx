import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Key, Loader2, Check, AlertTriangle, Shield, Calendar, Mail, Eye, EyeOff, Lock } from "lucide-react";
import { TwoFactorSetup } from "./TwoFactorSetup";
import { useMFA } from "@/hooks/useMFA";
import { useAdminPassword } from "@/hooks/useAdminPassword";
import { useAdminPasswordManagement } from "@/hooks/useAdminPasswordManagement";
import { useUserRole } from "@/hooks/useUserRole";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface SecuritySettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SecuritySettingsDialog({ open, onOpenChange }: SecuritySettingsDialogProps) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [twoFactorOpen, setTwoFactorOpen] = useState(false);
  const { hasMFAEnabled, loading: mfaLoading, refreshMFAStatus } = useMFA();
  const { isAdminOrOwner, isOwner } = useUserRole();
  const { status: adminPasswordStatus, loading: adminPasswordLoading, setPassword: setAdminPassword, clearVerification } = useAdminPassword();
  const { maskedEmail, requestEmailReset } = useAdminPasswordManagement();

  // Admin password change state
  const [adminNewPassword, setAdminNewPassword] = useState("");
  const [adminConfirmPassword, setAdminConfirmPassword] = useState("");
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [isChangingAdminPassword, setIsChangingAdminPassword] = useState(false);
  const [isRequestingEmailReset, setIsRequestingEmailReset] = useState(false);

  const handleChangePassword = async () => {
    if (newPassword.length < 8) {
      toast.error("Das Passwort muss mindestens 8 Zeichen lang sein");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Die Passwörter stimmen nicht überein");
      return;
    }

    setIsChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        if (error.message.includes("should be different")) {
          toast.error("Das neue Passwort muss sich vom alten unterscheiden");
        } else {
          throw error;
        }
        return;
      }

      toast.success("Passwort erfolgreich geändert");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      console.error("Password change error:", error);
      toast.error("Fehler beim Ändern des Passworts: " + error.message);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleChangeAdminPassword = async () => {
    if (adminNewPassword.length < 8) {
      toast.error("Admin-Passwort muss mindestens 8 Zeichen lang sein");
      return;
    }

    if (adminNewPassword !== adminConfirmPassword) {
      toast.error("Die Passwörter stimmen nicht überein");
      return;
    }

    const hasUpper = /[A-Z]/.test(adminNewPassword);
    const hasLower = /[a-z]/.test(adminNewPassword);
    const hasNumber = /[0-9]/.test(adminNewPassword);

    if (!hasUpper || !hasLower || !hasNumber) {
      toast.error("Admin-Passwort muss Groß-, Kleinbuchstaben und Zahlen enthalten");
      return;
    }

    setIsChangingAdminPassword(true);
    try {
      const result = await setAdminPassword(adminNewPassword);
      
      if (result.success) {
        toast.success("Admin-Passwort erfolgreich geändert");
        setAdminNewPassword("");
        setAdminConfirmPassword("");
      } else {
        toast.error(result.error || "Fehler beim Ändern des Admin-Passworts");
      }
    } finally {
      setIsChangingAdminPassword(false);
    }
  };

  const handleRequestEmailReset = async () => {
    setIsRequestingEmailReset(true);
    try {
      await requestEmailReset();
    } finally {
      setIsRequestingEmailReset(false);
    }
  };

  const passwordsMatch = newPassword === confirmPassword && newPassword.length > 0;
  const passwordLongEnough = newPassword.length >= 8;

  const adminPasswordsMatch = adminNewPassword === adminConfirmPassword && adminNewPassword.length > 0;
  const adminPasswordLongEnough = adminNewPassword.length >= 8;
  const adminPasswordComplex = /[A-Z]/.test(adminNewPassword) && /[a-z]/.test(adminNewPassword) && /[0-9]/.test(adminNewPassword);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="w-5 h-5 text-primary" />
              Sicherheitseinstellungen
            </DialogTitle>
            <DialogDescription>
              Verwalte deine Kontosicherheit
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* 2FA Section */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Zwei-Faktor-Authentifizierung
              </h3>
              <div className={cn(
                "p-3 rounded-lg border flex items-center justify-between",
                hasMFAEnabled 
                  ? "bg-primary/10 border-primary/30" 
                  : "bg-muted/50 border-border"
              )}>
                <div className="flex items-center gap-2">
                  {mfaLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : hasMFAEnabled ? (
                    <>
                      <Check className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium">2FA aktiviert</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4 text-destructive" />
                      <span className="text-sm font-medium">2FA nicht aktiviert</span>
                    </>
                  )}
                </div>
                <Button 
                  variant={hasMFAEnabled ? "outline" : "default"}
                  size="sm"
                  onClick={() => setTwoFactorOpen(true)}
                >
                  {hasMFAEnabled ? "Verwalten" : "Aktivieren"}
                </Button>
              </div>
            </div>

            {/* Admin Password Section - Only for Admin/Owner */}
            {isAdminOrOwner && (
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Admin-Bereich Passwort
                </h3>

                {adminPasswordLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin" />
                  </div>
                ) : (
                  <>
                    {/* Status Display */}
                    {adminPasswordStatus?.hasPassword && (
                      <div className={cn(
                        "p-3 rounded-lg border",
                        adminPasswordStatus.isExpired 
                          ? "bg-destructive/10 border-destructive/30"
                          : adminPasswordStatus.daysUntilExpiry <= 14
                            ? "bg-yellow-500/10 border-yellow-500/30"
                            : "bg-primary/10 border-primary/30"
                      )}>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          {adminPasswordStatus.isExpired ? (
                            <span className="text-sm text-destructive font-medium">Admin-Passwort abgelaufen</span>
                          ) : (
                            <span className="text-sm">
                              Läuft ab in <strong>{adminPasswordStatus.daysUntilExpiry}</strong> Tagen
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Change Admin Password Form */}
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="adminNewPassword">Neues Admin-Passwort</Label>
                        <div className="relative">
                          <Input
                            id="adminNewPassword"
                            type={showAdminPassword ? "text" : "password"}
                            value={adminNewPassword}
                            onChange={(e) => setAdminNewPassword(e.target.value)}
                            placeholder="Mind. 8 Zeichen, Groß-/Kleinbuchstaben, Zahlen"
                            className="pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowAdminPassword(!showAdminPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showAdminPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        {adminNewPassword.length > 0 && (
                          <div className="space-y-1">
                            <div className={`text-xs flex items-center gap-1 ${adminPasswordLongEnough ? "text-primary" : "text-destructive"}`}>
                              {adminPasswordLongEnough ? <Check className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                              Mindestens 8 Zeichen
                            </div>
                            <div className={`text-xs flex items-center gap-1 ${adminPasswordComplex ? "text-primary" : "text-destructive"}`}>
                              {adminPasswordComplex ? <Check className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                              Groß-, Kleinbuchstaben und Zahlen
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="adminConfirmPassword">Passwort bestätigen</Label>
                        <Input
                          id="adminConfirmPassword"
                          type={showAdminPassword ? "text" : "password"}
                          value={adminConfirmPassword}
                          onChange={(e) => setAdminConfirmPassword(e.target.value)}
                          placeholder="Passwort wiederholen"
                        />
                        {adminConfirmPassword.length > 0 && (
                          <div className={`text-xs flex items-center gap-1 ${adminPasswordsMatch ? "text-primary" : "text-destructive"}`}>
                            {adminPasswordsMatch ? <Check className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                            {adminPasswordsMatch ? "Passwörter stimmen überein" : "Passwörter stimmen nicht überein"}
                          </div>
                        )}
                      </div>

                      <Button
                        onClick={handleChangeAdminPassword}
                        disabled={isChangingAdminPassword || !adminPasswordsMatch || !adminPasswordLongEnough || !adminPasswordComplex}
                        className="w-full"
                        variant="outline"
                      >
                        {isChangingAdminPassword ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Wird geändert...
                          </>
                        ) : (
                          <>
                            <Lock className="w-4 h-4 mr-2" />
                            Admin-Passwort ändern
                          </>
                        )}
                      </Button>
                    </div>

                    {/* Email Reset - Owner Only */}
                    {isOwner && (
                      <div className="pt-2 border-t">
                        <p className="text-xs text-muted-foreground mb-2">
                          Passwort vergessen? Reset-Link an {maskedEmail || "deine E-Mail"} senden:
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleRequestEmailReset}
                          disabled={isRequestingEmailReset}
                          className="w-full"
                        >
                          {isRequestingEmailReset ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Mail className="w-4 h-4 mr-2" />
                          )}
                          Reset per E-Mail anfordern
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Account Password Change Section */}
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Key className="w-4 h-4" />
                Konto-Passwort ändern
              </h3>

              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Neues Passwort</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mindestens 8 Zeichen"
                  />
                  {newPassword.length > 0 && (
                    <div className={`text-xs flex items-center gap-1 ${passwordLongEnough ? "text-primary" : "text-destructive"}`}>
                      {passwordLongEnough ? <Check className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                      {passwordLongEnough ? "Passwort lang genug" : "Mindestens 8 Zeichen erforderlich"}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Passwort bestätigen</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Passwort wiederholen"
                  />
                  {confirmPassword.length > 0 && (
                    <div className={`text-xs flex items-center gap-1 ${passwordsMatch ? "text-primary" : "text-destructive"}`}>
                      {passwordsMatch ? <Check className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                      {passwordsMatch ? "Passwörter stimmen überein" : "Passwörter stimmen nicht überein"}
                    </div>
                  )}
                </div>

                <Button
                  onClick={handleChangePassword}
                  disabled={isChangingPassword || !passwordsMatch || !passwordLongEnough}
                  className="w-full"
                >
                  {isChangingPassword ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Wird geändert...
                    </>
                  ) : (
                    "Passwort ändern"
                  )}
                </Button>
              </div>
            </div>

            {/* Security Tips */}
            <div className="p-4 rounded-lg bg-muted/50 border border-border">
              <h4 className="font-medium text-sm mb-2">Sicherheitstipps</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Aktiviere 2FA für maximale Kontosicherheit</li>
                <li>• Verwende ein einzigartiges Passwort nur für diese App</li>
                <li>• Kombiniere Buchstaben, Zahlen und Sonderzeichen</li>
                <li>• Teile dein Passwort niemals mit anderen</li>
                {isAdminOrOwner && (
                  <li>• Admin-Passwort muss alle 3 Monate erneuert werden</li>
                )}
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <TwoFactorSetup 
        open={twoFactorOpen} 
        onOpenChange={(open) => {
          setTwoFactorOpen(open);
          if (!open) {
            refreshMFAStatus();
          }
        }} 
      />
    </>
  );
}
