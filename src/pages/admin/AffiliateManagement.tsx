import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  ArrowLeft, Users, DollarSign, TrendingUp, Clock,
  Check, X, Search, Banknote, Eye
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface AffiliateUser {
  user_id: string;
  display_name: string;
  email: string;
  referral_code: string;
  referral_count: number;
  conversion_count: number;
  total_earnings: number;
  pending_earnings: number;
  paid_earnings: number;
  payout_method: string | null;
  pending_payout_requests: number;
}

interface PayoutRequest {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  payout_method: string;
  payout_email: string | null;
  payout_iban: string | null;
  payout_bic: string | null;
  payout_account_holder: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
}

export default function AffiliateManagement() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [affiliates, setAffiliates] = useState<AffiliateUser[]>([]);
  const [payoutRequests, setPayoutRequests] = useState<PayoutRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<PayoutRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [processing, setProcessing] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [affiliateRes, payoutRes] = await Promise.all([
      supabase.rpc("get_affiliate_overview"),
      supabase.from("payout_requests").select("*").order("created_at", { ascending: false }),
    ]);

    if (affiliateRes.data) setAffiliates(affiliateRes.data as unknown as AffiliateUser[]);
    if (payoutRes.data) setPayoutRequests(payoutRes.data as PayoutRequest[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleProcessRequest = async (status: "completed" | "rejected") => {
    if (!selectedRequest) return;
    setProcessing(true);

    const { error } = await supabase
      .from("payout_requests")
      .update({
        status,
        admin_notes: adminNotes || null,
        processed_at: new Date().toISOString(),
        processed_by: (await supabase.auth.getUser()).data.user?.id,
      })
      .eq("id", selectedRequest.id);

    if (error) {
      toast({ title: "Fehler", description: "Konnte nicht aktualisiert werden.", variant: "destructive" });
    } else {
      toast({ title: status === "completed" ? "Ausgezahlt" : "Abgelehnt", description: `Anfrage wurde ${status === "completed" ? "als ausgezahlt markiert" : "abgelehnt"}.` });
      setSelectedRequest(null);
      setAdminNotes("");
      fetchData();
    }
    setProcessing(false);
  };

  const filteredAffiliates = affiliates.filter(
    (a) => a.display_name.toLowerCase().includes(search.toLowerCase()) ||
           a.email.toLowerCase().includes(search.toLowerCase()) ||
           a.referral_code.toLowerCase().includes(search.toLowerCase())
  );

  const pendingRequests = payoutRequests.filter((r) => r.status === "pending");
  const totalPending = pendingRequests.reduce((s, r) => s + Number(r.amount), 0);

  // Match payout request to affiliate name
  const getAffiliateName = (userId: string) => {
    const aff = affiliates.find((a) => a.user_id === userId);
    return aff?.display_name || "Unbekannt";
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => navigate("/admin")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" /><span>Zurück</span>
          </button>
          <h1 className="text-lg font-bold">Affiliate-Verwaltung</h1>
          {pendingRequests.length > 0 && (
            <Badge className="bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/30">
              {pendingRequests.length} offen
            </Badge>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card><CardContent className="p-4">
            <Users className="w-5 h-5 text-muted-foreground mb-2" />
            <p className="text-2xl font-bold">{affiliates.length}</p>
            <p className="text-sm text-muted-foreground">Affiliates</p>
          </CardContent></Card>
          <Card><CardContent className="p-4">
            <TrendingUp className="w-5 h-5 text-muted-foreground mb-2" />
            <p className="text-2xl font-bold">{affiliates.reduce((s, a) => s + Number(a.referral_count), 0)}</p>
            <p className="text-sm text-muted-foreground">Einladungen gesamt</p>
          </CardContent></Card>
          <Card><CardContent className="p-4">
            <DollarSign className="w-5 h-5 text-green-500 mb-2" />
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">€{affiliates.reduce((s, a) => s + Number(a.total_earnings), 0).toFixed(2)}</p>
            <p className="text-sm text-muted-foreground">Provisionen gesamt</p>
          </CardContent></Card>
          <Card><CardContent className="p-4">
            <Clock className="w-5 h-5 text-yellow-500 mb-2" />
            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">€{totalPending.toFixed(2)}</p>
            <p className="text-sm text-muted-foreground">Auszahlungen offen</p>
          </CardContent></Card>
        </div>

        {/* Pending Payout Requests */}
        {pendingRequests.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Banknote className="w-5 h-5 text-yellow-500" />
                Offene Auszahlungsanfragen ({pendingRequests.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pendingRequests.map((req) => (
                  <div key={req.id} className="flex items-center justify-between p-4 rounded-xl border border-yellow-500/20 bg-yellow-500/5">
                    <div>
                      <p className="font-medium">{getAffiliateName(req.user_id)}</p>
                      <p className="text-sm text-muted-foreground">
                        €{Number(req.amount).toFixed(2)} · {req.payout_method === "bank" ? "Banküberweisung" : "PayPal"}
                        {req.payout_method === "bank" && req.payout_iban && (
                          <span className="ml-1">· IBAN: {req.payout_iban.slice(0, 6)}...{req.payout_iban.slice(-4)}</span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">{format(new Date(req.created_at), "dd.MM.yyyy HH:mm", { locale: de })}</p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => { setSelectedRequest(req); setAdminNotes(""); }}>
                      <Eye className="w-4 h-4 mr-1" />Details
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* All Affiliates */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-base">
                <Users className="w-5 h-5 text-primary" />Alle Affiliates
              </span>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Suchen..." value={search} onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-9 text-sm" />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="animate-pulse space-y-3">
                {[1,2,3].map(i => <div key={i} className="h-12 bg-muted rounded" />)}
              </div>
            ) : filteredAffiliates.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">Keine Affiliates gefunden</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nutzer</TableHead>
                      <TableHead className="text-center">Code</TableHead>
                      <TableHead className="text-center">Einladungen</TableHead>
                      <TableHead className="text-center">Conversions</TableHead>
                      <TableHead className="text-right">Verdient</TableHead>
                      <TableHead className="text-right">Ausstehend</TableHead>
                      <TableHead className="text-center">Methode</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAffiliates.map((a) => (
                      <TableRow key={a.user_id}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{a.display_name}</p>
                            <p className="text-xs text-muted-foreground">{a.email}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{a.referral_code}</code>
                        </TableCell>
                        <TableCell className="text-center font-medium">{a.referral_count}</TableCell>
                        <TableCell className="text-center font-medium">{a.conversion_count}</TableCell>
                        <TableCell className="text-right font-medium text-green-600 dark:text-green-400">€{Number(a.total_earnings).toFixed(2)}</TableCell>
                        <TableCell className="text-right font-medium text-yellow-600 dark:text-yellow-400">€{Number(a.pending_earnings).toFixed(2)}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="text-xs">
                            {a.payout_method === "bank" ? "Bank" : a.payout_method === "paypal" ? "PayPal" : "–"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* All Payout Requests History */}
        {payoutRequests.filter(r => r.status !== "pending").length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Banknote className="w-5 h-5 text-primary" />Bearbeitete Auszahlungen
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {payoutRequests.filter(r => r.status !== "pending").map((req) => (
                  <div key={req.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div>
                      <p className="font-medium text-sm">{getAffiliateName(req.user_id)}</p>
                      <p className="text-xs text-muted-foreground">
                        €{Number(req.amount).toFixed(2)} · {format(new Date(req.created_at), "dd.MM.yyyy", { locale: de })}
                      </p>
                    </div>
                    <Badge className={cn(
                      req.status === "completed" ? "bg-green-500/10 text-green-600 border-green-500/30"
                        : "bg-destructive/10 text-destructive border-destructive/30"
                    )}>
                      {req.status === "completed" ? "Ausgezahlt" : "Abgelehnt"}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Detail Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={(open) => { if (!open) setSelectedRequest(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Auszahlungsanfrage</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Nutzer</p>
                  <p className="font-medium">{getAffiliateName(selectedRequest.user_id)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Betrag</p>
                  <p className="font-medium text-lg">€{Number(selectedRequest.amount).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Methode</p>
                  <p className="font-medium">{selectedRequest.payout_method === "bank" ? "Banküberweisung" : "PayPal"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Datum</p>
                  <p className="font-medium">{format(new Date(selectedRequest.created_at), "dd.MM.yyyy HH:mm", { locale: de })}</p>
                </div>
              </div>

              {selectedRequest.payout_method === "paypal" && selectedRequest.payout_email && (
                <div className="p-3 rounded-lg bg-muted/50 border border-border">
                  <p className="text-xs text-muted-foreground mb-1">PayPal E-Mail</p>
                  <p className="font-mono text-sm">{selectedRequest.payout_email}</p>
                </div>
              )}

              {selectedRequest.payout_method === "bank" && (
                <div className="p-3 rounded-lg bg-muted/50 border border-border space-y-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Kontoinhaber</p>
                    <p className="font-medium text-sm">{selectedRequest.payout_account_holder || "–"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">IBAN</p>
                    <p className="font-mono text-sm">{selectedRequest.payout_iban || "–"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">BIC</p>
                    <p className="font-mono text-sm">{selectedRequest.payout_bic || "–"}</p>
                  </div>
                </div>
              )}

              <div>
                <p className="text-sm font-medium mb-1">Admin-Notiz (optional)</p>
                <Textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="z.B. Überwiesen am ..." rows={2} />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="destructive" size="sm" onClick={() => handleProcessRequest("rejected")} disabled={processing}>
              <X className="w-4 h-4 mr-1" />Ablehnen
            </Button>
            <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleProcessRequest("completed")} disabled={processing}>
              <Check className="w-4 h-4 mr-1" />Als ausgezahlt markieren
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
