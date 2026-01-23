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
import { Shield, Loader2 } from "lucide-react";

interface MFAVerificationProps {
  open: boolean;
  onVerified: () => void;
  onCancel: () => void;
}

export function MFAVerification({ open, onVerified, onCancel }: MFAVerificationProps) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      loadFactor();
    }
  }, [open]);

  useEffect(() => {
    // Auto-submit when 6 digits entered
    if (code.length === 6 && factorId) {
      handleVerify();
    }
  }, [code]);

  const loadFactor = async () => {
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) throw error;

      const verifiedTotp = data.totp.find(f => f.status === "verified");
      if (verifiedTotp) {
        setFactorId(verifiedTotp.id);
      }
    } catch (err: any) {
      console.error("Error loading MFA factor:", err);
      setError("Fehler beim Laden der 2FA-Daten");
    }
  };

  const handleVerify = async () => {
    if (!factorId || code.length !== 6) return;

    setLoading(true);
    setError(null);

    try {
      // Create challenge
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId,
      });

      if (challengeError) throw challengeError;

      // Verify code
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code,
      });

      if (verifyError) throw verifyError;

      toast.success("Verifizierung erfolgreich!");
      onVerified();
    } catch (err: any) {
      console.error("MFA verification error:", err);
      setError("Ungültiger Code. Bitte versuche es erneut.");
      setCode("");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    // Sign out if user cancels MFA
    await supabase.auth.signOut();
    onCancel();
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Zwei-Faktor-Authentifizierung
          </DialogTitle>
          <DialogDescription>
            Gib den 6-stelligen Code aus deiner Authenticator-App ein
          </DialogDescription>
        </DialogHeader>

        <div className="py-6 space-y-6">
          <div className="flex flex-col items-center space-y-4">
            <Label className="text-center">Verifizierungscode</Label>
            <InputOTP 
              maxLength={6} 
              value={code}
              onChange={setCode}
              disabled={loading}
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

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleCancel}
              disabled={loading}
            >
              Abbrechen
            </Button>
            <Button
              className="flex-1"
              onClick={handleVerify}
              disabled={code.length !== 6 || loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verifizieren...
                </>
              ) : (
                "Bestätigen"
              )}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Öffne deine Authenticator-App (z.B. Google Authenticator) 
            und gib den aktuellen Code ein.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
