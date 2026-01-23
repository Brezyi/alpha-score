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
import { Key, Loader2, Check, AlertTriangle } from "lucide-react";

interface SecuritySettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SecuritySettingsDialog({ open, onOpenChange }: SecuritySettingsDialogProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

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
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      console.error("Password change error:", error);
      toast.error("Fehler beim Ändern des Passworts: " + error.message);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const passwordsMatch = newPassword === confirmPassword && newPassword.length > 0;
  const passwordLongEnough = newPassword.length >= 8;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
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
          {/* Password Change Section */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Key className="w-4 h-4" />
              Passwort ändern
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
              <li>• Verwende ein einzigartiges Passwort nur für diese App</li>
              <li>• Kombiniere Buchstaben, Zahlen und Sonderzeichen</li>
              <li>• Teile dein Passwort niemals mit anderen</li>
              <li>• Melde dich von öffentlichen Geräten immer ab</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
