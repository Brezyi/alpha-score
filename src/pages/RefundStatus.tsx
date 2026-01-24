import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Clock, CheckCircle, XCircle, AlertCircle, Euro } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { de } from "date-fns/locale";

interface RefundRequest {
  id: string;
  payment_intent_id: string;
  amount: number;
  currency: string;
  reason: string | null;
  status: string;
  payment_date: string;
  request_date: string;
  processed_at: string | null;
  admin_notes: string | null;
  is_within_period: boolean;
}

export default function RefundStatus() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<RefundRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    fetchRequests();
  }, [user, navigate]);

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from("refund_requests")
        .select("*")
        .order("request_date", { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error("Error fetching refund requests:", error);
      toast({
        title: "Fehler",
        description: "Widerrufsanträge konnten nicht geladen werden.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "approved":
      case "refunded":
        return {
          label: "Erstattet",
          icon: CheckCircle,
          variant: "default" as const,
          className: "bg-green-500/20 text-green-400 border-green-500/30",
        };
      case "rejected":
        return {
          label: "Abgelehnt",
          icon: XCircle,
          variant: "destructive" as const,
          className: "bg-red-500/20 text-red-400 border-red-500/30",
        };
      case "pending":
        return {
          label: "In Bearbeitung",
          icon: Clock,
          variant: "secondary" as const,
          className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
        };
      default:
        return {
          label: status,
          icon: AlertCircle,
          variant: "outline" as const,
          className: "",
        };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/dashboard")}
              className="shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Meine Widerrufsanträge</h1>
              <p className="text-muted-foreground text-sm">
                Übersicht über alle deine Erstattungsanfragen
              </p>
            </div>
          </div>

          {/* Info Card */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div className="text-sm text-muted-foreground">
                <p>
                  Widerrufsanträge innerhalb von 14 Tagen nach Kauf werden automatisch bearbeitet.
                  Spätere Anträge werden von unserem Team manuell geprüft.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Requests List */}
          {requests.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Euro className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  Keine Widerrufsanträge
                </h3>
                <p className="text-muted-foreground text-sm">
                  Du hast noch keine Erstattungsanfragen gestellt.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {requests.map((request, index) => {
                const statusConfig = getStatusConfig(request.status);
                const StatusIcon = statusConfig.icon;

                return (
                  <motion.div
                    key={request.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="overflow-hidden">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1">
                            <CardTitle className="text-lg flex items-center gap-2">
                              <Euro className="h-4 w-4 text-primary" />
                              {formatAmount(request.amount, request.currency)}
                            </CardTitle>
                            <CardDescription>
                              Antrag vom{" "}
                              {format(new Date(request.request_date), "dd. MMMM yyyy", {
                                locale: de,
                              })}
                            </CardDescription>
                          </div>
                          <Badge className={statusConfig.className}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusConfig.label}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Zahlungsdatum:</span>
                            <p className="font-medium text-foreground">
                              {format(new Date(request.payment_date), "dd.MM.yyyy", {
                                locale: de,
                              })}
                            </p>
                          </div>
                          {request.processed_at && (
                            <div>
                              <span className="text-muted-foreground">Bearbeitet am:</span>
                              <p className="font-medium text-foreground">
                                {format(new Date(request.processed_at), "dd.MM.yyyy", {
                                  locale: de,
                                })}
                              </p>
                            </div>
                          )}
                        </div>

                        {request.reason && (
                          <div className="text-sm">
                            <span className="text-muted-foreground">Begründung:</span>
                            <p className="text-foreground mt-1">{request.reason}</p>
                          </div>
                        )}

                        {request.admin_notes && request.status !== "pending" && (
                          <div className="text-sm bg-muted/50 rounded-lg p-3">
                            <span className="text-muted-foreground">Anmerkung:</span>
                            <p className="text-foreground mt-1">{request.admin_notes}</p>
                          </div>
                        )}

                        {request.is_within_period && request.status === "refunded" && (
                          <p className="text-xs text-primary">
                            ✓ Automatisch erstattet (innerhalb der 14-Tage-Frist)
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
