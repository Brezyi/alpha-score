import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Shield, 
  Loader2, 
  Check, 
  QrCode, 
  Smartphone,
  AlertTriangle,
  Trash2,
  Copy
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TwoFactorSetupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface MFAFactor {
  id: string;
  friendly_name?: string;
  status: "verified" | "unverified";
  created_at: string;
}

export function TwoFactorSetup({ open, onOpenChange }: TwoFactorSetupProps) {
  const [step, setStep] = useState<"overview" | "enroll" | "verify">("overview");
  const [loading, setLoading] = useState(false);
  const [factors, setFactors] = useState<MFAFactor[]>([]);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [verifyCode, setVerifyCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (open) {
      loadFactors();
    }
  }, [open]);

  const loadFactors = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) throw error;
      
      // Filter to only verified TOTP factors
      const verifiedFactors = data.totp.filter(f => f.status === "verified");
      setFactors(verifiedFactors as MFAFactor[]);
    } catch (error: any) {
      console.error("Error loading MFA factors:", error);
      toast.error("Fehler beim Laden der 2FA-Einstellungen");
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        issuer: "LooksMax Pro",
        friendlyName: "Authenticator App",
      });

      if (error) throw error;

      setQrCode(data.totp.qr_code);
      setSecret(data.totp.secret);
      setFactorId(data.id);
      setStep("enroll");
    } catch (error: any) {
      console.error("MFA enroll error:", error);
      toast.error("Fehler beim Einrichten von 2FA: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEnrollment = async () => {
    if (verifyCode.length !== 6 || !factorId) return;

    setIsVerifying(true);
    try {
      // Create a challenge first
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId,
      });

      if (challengeError) throw challengeError;

      // Verify the code
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code: verifyCode,
      });

      if (verifyError) throw verifyError;

      toast.success("2FA erfolgreich aktiviert!");
      setStep("overview");
      setVerifyCode("");
      setQrCode(null);
      setSecret(null);
      setFactorId(null);
      await loadFactors();
    } catch (error: any) {
      console.error("MFA verify error:", error);
      toast.error("Ungültiger Code. Bitte versuche es erneut.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleUnenroll = async (factorIdToDelete: string) => {
    setIsDeleting(true);
    try {
      const { error } = await supabase.auth.mfa.unenroll({
        factorId: factorIdToDelete,
      });

      if (error) throw error;

      toast.success("2FA wurde deaktiviert");
      await loadFactors();
    } catch (error: any) {
      console.error("MFA unenroll error:", error);
      toast.error("Fehler beim Deaktivieren von 2FA: " + error.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const copySecret = () => {
    if (secret) {
      navigator.clipboard.writeText(secret);
      toast.success("Geheimschlüssel kopiert");
    }
  };

  const has2FAEnabled = factors.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Zwei-Faktor-Authentifizierung
          </DialogTitle>
          <DialogDescription>
            {step === "overview" && "Schütze dein Konto mit einem zusätzlichen Sicherheitsfaktor"}
            {step === "enroll" && "Scanne den QR-Code mit deiner Authenticator-App"}
            {step === "verify" && "Gib den Code aus deiner Authenticator-App ein"}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : step === "overview" ? (
            <div className="space-y-4">
              {/* Status Card */}
              <div className={cn(
                "p-4 rounded-lg border",
                has2FAEnabled 
                  ? "bg-primary/10 border-primary/30" 
                  : "bg-muted/50 border-border"
              )}>
                <div className="flex items-center gap-3">
                  {has2FAEnabled ? (
                    <>
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <Check className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">2FA ist aktiviert</p>
                        <p className="text-sm text-muted-foreground">
                          Dein Konto ist geschützt
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center">
                        <AlertTriangle className="w-5 h-5 text-destructive" />
                      </div>
                      <div>
                        <p className="font-medium">2FA nicht aktiviert</p>
                        <p className="text-sm text-muted-foreground">
                          Aktiviere 2FA für mehr Sicherheit
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Existing Factors */}
              {has2FAEnabled && (
                <div className="space-y-2">
                  <Label>Aktive Faktoren</Label>
                  {factors.map((factor) => (
                    <div 
                      key={factor.id} 
                      className="flex items-center justify-between p-3 rounded-lg border bg-card"
                    >
                      <div className="flex items-center gap-3">
                        <Smartphone className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-sm">
                            {factor.friendly_name || "Authenticator App"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Hinzugefügt am {new Date(factor.created_at).toLocaleDateString("de-DE")}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleUnenroll(factor.id)}
                        disabled={isDeleting}
                        className="text-destructive hover:text-destructive"
                      >
                        {isDeleting ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Action Button */}
              {!has2FAEnabled && (
                <Button 
                  onClick={handleEnroll} 
                  className="w-full"
                  disabled={loading}
                >
                  <QrCode className="w-4 h-4 mr-2" />
                  2FA aktivieren
                </Button>
              )}

              {/* Info */}
              <div className="p-3 rounded-lg bg-muted/50 border border-border">
                <h4 className="font-medium text-sm mb-1">Was ist 2FA?</h4>
                <p className="text-xs text-muted-foreground">
                  Zwei-Faktor-Authentifizierung fügt eine zusätzliche Sicherheitsebene hinzu. 
                  Du benötigst sowohl dein Passwort als auch einen Code aus deiner Authenticator-App 
                  (z.B. Google Authenticator, Authy) zum Einloggen.
                </p>
              </div>
            </div>
          ) : step === "enroll" ? (
            <div className="space-y-4">
              {/* QR Code */}
              {qrCode && (
                <div className="flex flex-col items-center">
                  <div className="bg-white p-4 rounded-lg">
                    <img 
                      src={qrCode} 
                      alt="2FA QR Code" 
                      className="w-48 h-48"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground mt-2 text-center">
                    Scanne diesen Code mit Google Authenticator, Authy oder einer ähnlichen App
                  </p>
                </div>
              )}

              {/* Manual Secret */}
              {secret && (
                <div className="space-y-2">
                  <Label>Oder manuell eingeben:</Label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 p-2 rounded bg-muted text-sm font-mono break-all">
                      {secret}
                    </code>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={copySecret}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Verify Code */}
              <div className="space-y-3">
                <Label>Code aus der App eingeben:</Label>
                <div className="flex justify-center">
                  <InputOTP 
                    maxLength={6} 
                    value={verifyCode}
                    onChange={setVerifyCode}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => {
                    setStep("overview");
                    setQrCode(null);
                    setSecret(null);
                    setVerifyCode("");
                  }}
                >
                  Abbrechen
                </Button>
                <Button 
                  className="flex-1"
                  onClick={handleVerifyEnrollment}
                  disabled={verifyCode.length !== 6 || isVerifying}
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Verifizieren...
                    </>
                  ) : (
                    "Aktivieren"
                  )}
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
