import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import {
  ArrowLeft,
  RotateCcw,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  AlertCircle,
  Euro,
  Calendar,
  User,
  Shield,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface RefundRequest {
  id: string;
  user_id: string;
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
  user_email: string;
  profiles?: { display_name: string | null };
}

export default function RefundManagement() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { role, loading: roleLoading } = useUserRole();
  const [requests, setRequests] = useState<RefundRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<RefundRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [actionType, setActionType] = useState<"approve" | "reject">("approve");

  useEffect(() => {
    if (!roleLoading && role && ["admin", "owner"].includes(role)) {
      fetchRequests();
    }
  }, [role, roleLoading]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("process-refund", {
        body: { action: "list_requests" },
      });

      if (error) throw error;
      setRequests(data.requests || []);
    } catch (error: any) {
      console.error("Error fetching requests:", error);
      toast({
        title: "Fehler",
        description: "Anträge konnten nicht geladen werden",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const openProcessDialog = (request: RefundRequest, type: "approve" | "reject") => {
    setSelectedRequest(request);
    setActionType(type);
    setAdminNotes("");
    setDialogOpen(true);
  };

  const handleProcess = async () => {
    if (!selectedRequest) return;

    setProcessingId(selectedRequest.id);
    try {
      const { data, error } = await supabase.functions.invoke("process-refund", {
        body: {
          action: "process_request",
          request_id: selectedRequest.id,
          approve: actionType === "approve",
          admin_notes: adminNotes,
        },
      });

      if (error) throw error;

      toast({
        title: actionType === "approve" ? "Widerruf genehmigt" : "Widerruf abgelehnt",
        description: actionType === "approve" 
          ? "Die Rückerstattung wurde verarbeitet."
          : "Der Antrag wurde abgelehnt.",
      });

      setDialogOpen(false);
      fetchRequests();
    } catch (error: any) {
      console.error("Error processing request:", error);
      toast({
        title: "Fehler",
        description: error.message || "Antrag konnte nicht verarbeitet werden",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30"><Clock className="w-3 h-3 mr-1" />Ausstehend</Badge>;
      case "approved":
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30"><CheckCircle className="w-3 h-3 mr-1" />Genehmigt</Badge>;
      case "rejected":
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30"><XCircle className="w-3 h-3 mr-1" />Abgelehnt</Badge>;
      case "auto_refunded":
        return <Badge className="bg-primary/20 text-primary border-primary/30"><Shield className="w-3 h-3 mr-1" />Automatisch</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!role || !["admin", "owner"].includes(role)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-6">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-bold">Zugriff verweigert</h2>
            <p className="text-muted-foreground mt-2">Du hast keine Berechtigung für diese Seite.</p>
          </div>
        </Card>
      </div>
    );
  }

  const pendingRequests = requests.filter(r => r.status === "pending");
  const processedRequests = requests.filter(r => r.status !== "pending");

  const stats = {
    pending: pendingRequests.length,
    approved: requests.filter(r => r.status === "approved" || r.status === "auto_refunded").length,
    rejected: requests.filter(r => r.status === "rejected").length,
    totalRefunded: requests
      .filter(r => r.status === "approved" || r.status === "auto_refunded")
      .reduce((sum, r) => sum + r.amount, 0),
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <RotateCcw className="w-6 h-6 text-primary" />
                  Widerrufs-Verwaltung
                </h1>
                <p className="text-sm text-muted-foreground">Verwalte Widerrufsanträge</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 relative z-10">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="border-yellow-500/20 bg-gradient-to-br from-yellow-500/10 to-transparent">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Ausstehend</p>
                    <p className="text-2xl font-bold text-yellow-400">{stats.pending}</p>
                  </div>
                  <Clock className="w-8 h-8 text-yellow-500/50" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="border-green-500/20 bg-gradient-to-br from-green-500/10 to-transparent">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Genehmigt</p>
                    <p className="text-2xl font-bold text-green-400">{stats.approved}</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-500/50" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="border-red-500/20 bg-gradient-to-br from-red-500/10 to-transparent">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Abgelehnt</p>
                    <p className="text-2xl font-bold text-red-400">{stats.rejected}</p>
                  </div>
                  <XCircle className="w-8 h-8 text-red-500/50" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card className="border-primary/20 bg-gradient-to-br from-primary/10 to-transparent">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Erstattet</p>
                    <p className="text-2xl font-bold text-primary">{formatAmount(stats.totalRefunded, "eur")}</p>
                  </div>
                  <Euro className="w-8 h-8 text-primary/50" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Pending Requests */}
        {pendingRequests.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-yellow-500" />
              Ausstehende Anträge ({pendingRequests.length})
            </h2>
            <div className="space-y-4">
              {pendingRequests.map((request, index) => (
                <motion.div
                  key={request.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="border-yellow-500/30">
                    <CardContent className="p-4">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium">{request.profiles?.display_name || request.user_email}</span>
                            {getStatusBadge(request.status)}
                            {!request.is_within_period && (
                              <Badge variant="outline" className="text-xs">
                                <AlertCircle className="w-3 h-3 mr-1" />
                                Nach 14 Tagen
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Euro className="w-3 h-3" />
                              {formatAmount(request.amount, request.currency)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Kauf: {format(new Date(request.payment_date), "dd.MM.yyyy", { locale: de })}
                            </span>
                            <span>
                              Antrag: {format(new Date(request.request_date), "dd.MM.yyyy HH:mm", { locale: de })}
                            </span>
                          </div>
                          {request.reason && (
                            <p className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                              "{request.reason}"
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openProcessDialog(request, "reject")}
                            disabled={processingId === request.id}
                            className="text-red-500 border-red-500/30 hover:bg-red-500/10"
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Ablehnen
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => openProcessDialog(request, "approve")}
                            disabled={processingId === request.id}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            {processingId === request.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Genehmigen
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Processed Requests */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Bearbeitete Anträge ({processedRequests.length})</h2>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : processedRequests.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">Keine bearbeiteten Anträge vorhanden.</p>
            </Card>
          ) : (
            <div className="space-y-2">
              {processedRequests.map((request) => (
                <Card key={request.id} className="border-border/50">
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <span className="font-medium">{request.profiles?.display_name || request.user_email}</span>
                        <span className="text-sm text-muted-foreground">
                          {formatAmount(request.amount, request.currency)}
                        </span>
                        {getStatusBadge(request.status)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {request.processed_at && format(new Date(request.processed_at), "dd.MM.yyyy HH:mm", { locale: de })}
                      </div>
                    </div>
                    {request.admin_notes && (
                      <p className="text-sm text-muted-foreground mt-2">Notiz: {request.admin_notes}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Process Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "approve" ? "Widerruf genehmigen" : "Widerruf ablehnen"}
            </DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-lg space-y-1">
                <p><strong>Nutzer:</strong> {selectedRequest.profiles?.display_name || selectedRequest.user_email}</p>
                <p><strong>Betrag:</strong> {formatAmount(selectedRequest.amount, selectedRequest.currency)}</p>
                <p><strong>Kaufdatum:</strong> {format(new Date(selectedRequest.payment_date), "dd.MM.yyyy", { locale: de })}</p>
                {selectedRequest.reason && <p><strong>Grund:</strong> {selectedRequest.reason}</p>}
              </div>

              {actionType === "approve" && (
                <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <p className="text-sm text-green-400">
                    ✓ Die Rückerstattung wird sofort über Stripe verarbeitet und das Abo wird deaktiviert.
                  </p>
                </div>
              )}

              {actionType === "reject" && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <p className="text-sm text-red-400">
                    ✗ Der Antrag wird abgelehnt. Bitte gib einen Grund an.
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">Admin-Notiz {actionType === "reject" && "(erforderlich)"}</label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder={actionType === "reject" ? "Grund für die Ablehnung..." : "Optionale Notiz..."}
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button
              onClick={handleProcess}
              disabled={processingId !== null || (actionType === "reject" && !adminNotes.trim())}
              variant={actionType === "approve" ? "default" : "destructive"}
            >
              {processingId ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : actionType === "approve" ? (
                "Genehmigen & Erstatten"
              ) : (
                "Ablehnen"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
