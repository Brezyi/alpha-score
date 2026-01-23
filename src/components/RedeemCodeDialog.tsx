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
  DialogFooter,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Ticket, Gift, Loader2, CheckCircle } from "lucide-react";

interface RedeemCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function RedeemCodeDialog({ open, onOpenChange, onSuccess }: RedeemCodeDialogProps) {
  const { toast } = useToast();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const handleRedeem = async () => {
    if (!code.trim()) {
      toast({
        title: "Fehler",
        description: "Bitte gib einen Code ein",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Nicht angemeldet");

      // Find the promo code
      const { data: promoCode, error: fetchError } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('code', code.toUpperCase().trim())
        .eq('is_active', true)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (!promoCode) {
        throw new Error("Code nicht gefunden oder nicht mehr gültig");
      }

      // Check if code is expired
      if (promoCode.expires_at && new Date(promoCode.expires_at) < new Date()) {
        throw new Error("Dieser Code ist abgelaufen");
      }

      // Check if max uses reached
      if (promoCode.current_uses >= promoCode.max_uses) {
        throw new Error("Dieser Code wurde bereits vollständig eingelöst");
      }

      // Check if user already redeemed this code
      const { data: existingRedemption } = await supabase
        .from('promo_code_redemptions')
        .select('id')
        .eq('promo_code_id', promoCode.id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingRedemption) {
        throw new Error("Du hast diesen Code bereits eingelöst");
      }

      // Calculate subscription end date
      const now = new Date();
      let periodEnd: Date;
      
      if (promoCode.plan_type === 'lifetime') {
        periodEnd = new Date();
        periodEnd.setFullYear(periodEnd.getFullYear() + 100);
      } else {
        periodEnd = new Date();
        periodEnd.setDate(periodEnd.getDate() + (promoCode.duration_days || 30));
      }
      periodEnd.setHours(23, 59, 59, 999);

      // Check if user already has a subscription
      const { data: existingSub } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      // Create or update subscription
      const subscriptionData = {
        user_id: user.id,
        plan_type: promoCode.plan_type,
        status: 'active',
        stripe_customer_id: `promo_${promoCode.code}_${user.id}`,
        amount: 0,
        currency: 'eur',
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
      };

      if (existingSub) {
        const { error: updateError } = await supabase
          .from('subscriptions')
          .update(subscriptionData)
          .eq('user_id', user.id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('subscriptions')
          .insert(subscriptionData);
        if (insertError) throw insertError;
      }

      // Record the redemption
      const { error: redemptionError } = await supabase
        .from('promo_code_redemptions')
        .insert({
          promo_code_id: promoCode.id,
          user_id: user.id,
        });

      if (redemptionError) throw redemptionError;

      // Increment the usage count
      const { error: updateError } = await supabase
        .from('promo_codes')
        .update({ current_uses: promoCode.current_uses + 1 })
        .eq('id', promoCode.id);

      if (updateError) console.error("Error updating usage count:", updateError);

      // Show success
      setSuccess(true);
      setSuccessMessage(
        promoCode.plan_type === 'lifetime' 
          ? "Du hast jetzt Lifetime-Zugang!" 
          : `Du hast jetzt ${promoCode.duration_days} Tage Premium!`
      );

      toast({
        title: "Code eingelöst! 🎉",
        description: successMessage,
      });

      // Trigger refresh after a short delay
      setTimeout(() => {
        onSuccess?.();
        onOpenChange(false);
        setCode("");
        setSuccess(false);
      }, 2000);

    } catch (error: any) {
      console.error("Error redeeming code:", error);
      toast({
        title: "Fehler",
        description: error.message || "Code konnte nicht eingelöst werden",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => {
      if (!loading) {
        onOpenChange(o);
        if (!o) {
          setCode("");
          setSuccess(false);
        }
      }
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-primary" />
            Promocode einlösen
          </DialogTitle>
          <DialogDescription>
            Gib deinen Promocode ein, um Premium-Zugang zu erhalten.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="py-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4 animate-bounce" />
            <p className="text-lg font-semibold text-foreground">{successMessage}</p>
            <p className="text-sm text-muted-foreground mt-2">Die Seite wird aktualisiert...</p>
          </div>
        ) : (
          <>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="promo-code">Promocode</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="promo-code"
                      value={code}
                      onChange={(e) => setCode(e.target.value.toUpperCase())}
                      placeholder="z.B. PREMIUM2024"
                      className="pl-9 font-mono uppercase"
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                Abbrechen
              </Button>
              <Button onClick={handleRedeem} disabled={loading || !code.trim()}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Prüfe...
                  </>
                ) : (
                  "Einlösen"
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}