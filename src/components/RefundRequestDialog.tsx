import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, RotateCcw, CheckCircle, Clock, AlertCircle, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { de } from "date-fns/locale";

interface Payment {
  id: string;
  amount: number;
  currency: string;
  payment_date: string;
  days_since_payment: number;
  is_within_period: boolean;
  refund_status: string | null;
  description: string;
}

interface RefundRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function RefundRequestDialog({ open, onOpenChange, onSuccess }: RefundRequestDialogProps) {
  const { toast } = useToast();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<string>("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (open) {
      fetchPayments();
    }
  }, [open]);

  const fetchPayments = async () => {
    setLoadingPayments(true);
    try {
      const { data, error } = await supabase.functions.invoke("process-refund", {
        body: { action: "get_user_payments" },
      });

      if (error) throw error;
      setPayments(data.payments || []);
    } catch (error: any) {
      console.error("Error fetching payments:", error);
      toast({
        title: "Fehler",
        description: "Zahlungen konnten nicht geladen werden",
        variant: "destructive",
      });
    } finally {
      setLoadingPayments(false);
    }
  };

  const handleRequestRefund = async () => {
    if (!selectedPayment) {
      toast({
        title: "Fehler",
        description: "Bitte wähle eine Zahlung aus",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("process-refund", {
        body: {
          action: "request_refund",
          payment_intent_id: selectedPayment,
          reason: reason || "Widerruf ohne Angabe von Gründen",
        },
      });

      if (error) throw error;

      if (data.error) throw new Error(data.error);

      setSuccess(true);
      setSuccessMessage(data.message);

      toast({
        title: data.auto_refunded ? "Widerruf verarbeitet" : "Antrag eingereicht",
        description: data.message,
      });

      setTimeout(() => {
        onSuccess?.();
        onOpenChange(false);
        resetForm();
      }, 3000);
    } catch (error: any) {
      console.error("Error requesting refund:", error);
      toast({
        title: "Fehler",
        description: error.message || "Widerruf konnte nicht verarbeitet werden",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedPayment("");
    setReason("");
    setSuccess(false);
    setPayments([]);
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const getStatusBadge = (payment: Payment) => {
    if (payment.refund_status === "auto_refunded" || payment.refund_status === "approved") {
      return <Badge className="bg-green-500/20 text-green-400 border-green-500/30"><CheckCircle className="w-3 h-3 mr-1" />Erstattet</Badge>;
    }
    if (payment.refund_status === "pending") {
      return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30"><Clock className="w-3 h-3 mr-1" />In Prüfung</Badge>;
    }
    if (payment.refund_status === "rejected") {
      return <Badge className="bg-red-500/20 text-red-400 border-red-500/30"><XCircle className="w-3 h-3 mr-1" />Abgelehnt</Badge>;
    }
    if (payment.is_within_period) {
      return <Badge className="bg-primary/20 text-primary border-primary/30"><CheckCircle className="w-3 h-3 mr-1" />Automatisch</Badge>;
    }
    return <Badge variant="outline"><AlertCircle className="w-3 h-3 mr-1" />Prüfung nötig</Badge>;
  };

  const eligiblePayments = payments.filter(p => !p.refund_status);

  return (
    <Dialog open={open} onOpenChange={(o) => {
      if (!loading) {
        onOpenChange(o);
        if (!o) resetForm();
      }
    }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-primary" />
            Widerrufsrecht ausüben
          </DialogTitle>
          <DialogDescription>
            Gemäß §§ 312g, 355 BGB hast du ein 14-tägiges Widerrufsrecht. Innerhalb dieser Frist wird die Rückerstattung automatisch verarbeitet.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="py-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4 animate-bounce" />
            <p className="text-lg font-semibold text-foreground">{successMessage}</p>
            <p className="text-sm text-muted-foreground mt-2">Die Seite wird aktualisiert...</p>
          </div>
        ) : loadingPayments ? (
          <div className="py-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
            <p className="text-sm text-muted-foreground mt-2">Lade Zahlungen...</p>
          </div>
        ) : payments.length === 0 ? (
          <div className="py-8 text-center">
            <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Keine Zahlungen gefunden, die widerrufen werden können.</p>
          </div>
        ) : (
          <>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Zahlung auswählen</Label>
                <Select value={selectedPayment} onValueChange={setSelectedPayment} disabled={loading}>
                  <SelectTrigger>
                    <SelectValue placeholder="Wähle eine Zahlung..." />
                  </SelectTrigger>
                  <SelectContent>
                    {eligiblePayments.map((payment) => (
                      <SelectItem key={payment.id} value={payment.id}>
                        <div className="flex items-center gap-2">
                          <span>{formatAmount(payment.amount, payment.currency)}</span>
                          <span className="text-muted-foreground">
                            - {format(new Date(payment.payment_date), "dd.MM.yyyy", { locale: de })}
                          </span>
                          {payment.is_within_period ? (
                            <span className="text-xs text-primary">(Auto)</span>
                          ) : (
                            <span className="text-xs text-yellow-500">(Prüfung)</span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedPayment && (
                <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                  {(() => {
                    const payment = payments.find(p => p.id === selectedPayment);
                    if (!payment) return null;
                    return (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Status:</span>
                          {getStatusBadge(payment)}
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Tage seit Kauf:</span>
                          <span className="text-sm font-medium">{payment.days_since_payment} Tage</span>
                        </div>
                        {payment.is_within_period ? (
                          <p className="text-xs text-primary">
                            ✓ Innerhalb der 14-tägigen Widerrufsfrist - automatische Erstattung
                          </p>
                        ) : (
                          <p className="text-xs text-yellow-500">
                            ⚠ Außerhalb der Widerrufsfrist - Antrag wird manuell geprüft
                          </p>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="reason">Grund (optional)</Label>
                <Textarea
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Warum möchtest du widerrufen?"
                  className="resize-none"
                  rows={3}
                  disabled={loading}
                />
              </div>

              {/* Show existing requests */}
              {payments.filter(p => p.refund_status).length > 0 && (
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Bisherige Anträge</Label>
                  <div className="space-y-2">
                    {payments.filter(p => p.refund_status).map((payment) => (
                      <div key={payment.id} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                        <span className="text-sm">
                          {formatAmount(payment.amount, payment.currency)} - {format(new Date(payment.payment_date), "dd.MM.yyyy", { locale: de })}
                        </span>
                        {getStatusBadge(payment)}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                Abbrechen
              </Button>
              <Button 
                onClick={handleRequestRefund} 
                disabled={loading || !selectedPayment}
                variant="destructive"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verarbeite...
                  </>
                ) : (
                  "Widerruf einreichen"
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
