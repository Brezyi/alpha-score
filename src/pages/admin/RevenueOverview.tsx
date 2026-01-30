import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, TrendingUp, CreditCard, Users, RefreshCw, Euro, Crown, Infinity, Download, AlertCircle, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";

interface SubscriptionData {
  id: string;
  stripe_customer_id: string;
  stripe_subscription_id: string | null;
  plan_type: "premium" | "lifetime";
  status: string;
  amount: number;
  currency: string;
  customer_email: string | null;
  current_period_end: string | null;
  created_at: string;
  cancel_at_period_end: boolean;
}

interface PaymentData {
  id: string;
  amount: number;
  currency: string;
  status: string;
  payment_type: string;
  customer_email: string | null;
  created_at: string;
}

interface RevenueStats {
  totalRevenue: number;
  monthlyRevenue: number;
  activeSubscriptions: number;
  lifetimePurchases: number;
  canceledSubscriptions: number;
}

interface AffiliateEarning {
  id: string;
  referrer_id: string;
  referrer_email?: string;
  referred_id: string;
  referred_email?: string;
  commission_amount: number;
  payment_amount: number;
  currency: string;
  status: string;
  created_at: string;
}

interface AffiliateStats {
  totalCommissions: number;
  pendingCommissions: number;
  paidCommissions: number;
  totalReferrals: number;
}

export default function RevenueOverview() {
  const navigate = useNavigate();
  const { isOwner, isAdmin, loading: roleLoading } = useUserRole();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [subscriptions, setSubscriptions] = useState<SubscriptionData[]>([]);
  const [payments, setPayments] = useState<PaymentData[]>([]);
  const [stats, setStats] = useState<RevenueStats>({
    totalRevenue: 0,
    monthlyRevenue: 0,
    activeSubscriptions: 0,
    lifetimePurchases: 0,
    canceledSubscriptions: 0,
  });
  const [affiliateEarnings, setAffiliateEarnings] = useState<AffiliateEarning[]>([]);
  const [affiliateStats, setAffiliateStats] = useState<AffiliateStats>({
    totalCommissions: 0,
    pendingCommissions: 0,
    paidCommissions: 0,
    totalReferrals: 0,
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Wait for role check to complete before redirecting
    if (roleLoading) {
      return; // Still loading roles
    }
    if (!isOwner && !isAdmin) {
      navigate("/admin");
      return;
    }
  }, [isOwner, isAdmin, roleLoading, navigate]);
  
  // Fetch data when roles are confirmed
  useEffect(() => {
    if (!roleLoading && (isOwner || isAdmin)) {
      fetchLocalData();
    }
  }, [roleLoading, isOwner, isAdmin]);

  const fetchLocalData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch subscriptions from local database
      const { data: subsData, error: subsError } = await supabase
        .from("subscriptions")
        .select("*")
        .order("created_at", { ascending: false });

      if (subsError) {
        console.error("Error fetching subscriptions:", subsError);
        throw new Error("Fehler beim Laden der Abonnements");
      }

      // Fetch recent payments
      const { data: paymentsData, error: paymentsError } = await supabase
        .from("payments")
        .select("*")
        .eq("status", "succeeded")
        .order("created_at", { ascending: false })
        .limit(50);

      if (paymentsError) {
        console.error("Error fetching payments:", paymentsError);
      }

      const subs = (subsData || []) as SubscriptionData[];
      const pays = (paymentsData || []) as PaymentData[];

      setSubscriptions(subs);
      setPayments(pays);

      // Calculate stats from local data
      const activeMonthly = subs.filter(s => s.status === "active" && s.plan_type === "premium");
      const activeLifetime = subs.filter(s => s.status === "active" && s.plan_type === "lifetime");
      const canceled = subs.filter(s => s.status === "canceled");

      const monthlyRevenue = activeMonthly.reduce((sum, s) => sum + (s.amount || 0), 0);
      const totalFromPayments = pays.reduce((sum, p) => sum + (p.amount || 0), 0);

      setStats({
        totalRevenue: totalFromPayments || (monthlyRevenue + activeLifetime.reduce((sum, s) => sum + (s.amount || 0), 0)),
        monthlyRevenue: monthlyRevenue,
        activeSubscriptions: activeMonthly.length,
        lifetimePurchases: activeLifetime.length,
        canceledSubscriptions: canceled.length,
      });

      // Fetch affiliate earnings (owner only)
      if (isOwner) {
        const { data: affiliateData, error: affiliateError } = await supabase
          .from("affiliate_earnings")
          .select("*")
          .order("created_at", { ascending: false });

        if (!affiliateError && affiliateData) {
          // Fetch referrer emails from profiles
          const referrerIds = [...new Set(affiliateData.map(a => a.referrer_id))];
          const { data: profiles } = await supabase
            .from("profiles")
            .select("user_id, display_name")
            .in("user_id", referrerIds);

          const profileMap = new Map(profiles?.map(p => [p.user_id, p.display_name]) || []);

          const enrichedEarnings = affiliateData.map(earning => ({
            ...earning,
            referrer_email: profileMap.get(earning.referrer_id) || earning.referrer_id.slice(0, 8),
          }));

          setAffiliateEarnings(enrichedEarnings);

          const pending = affiliateData.filter(e => e.status === "pending");
          const paid = affiliateData.filter(e => e.status === "paid");

          setAffiliateStats({
            totalCommissions: affiliateData.reduce((sum, e) => sum + Number(e.commission_amount), 0),
            pendingCommissions: pending.reduce((sum, e) => sum + Number(e.commission_amount), 0),
            paidCommissions: paid.reduce((sum, e) => sum + Number(e.commission_amount), 0),
            totalReferrals: affiliateData.length,
          });
        }
      }

    } catch (err) {
      const message = err instanceof Error ? err.message : "Unbekannter Fehler";
      setError(message);
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const syncWithStripe = async () => {
    if (!isOwner) {
      toast({
        title: "Keine Berechtigung",
        description: "Nur Owner können Stripe-Daten synchronisieren.",
        variant: "destructive",
      });
      return;
    }

    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("sync-stripe-data");
      
      if (error) throw error;

      toast({
        title: "Synchronisation erfolgreich",
        description: `${data.syncedSubscriptions} Abos und ${data.syncedPayments} Zahlungen synchronisiert.`,
      });

      // Refresh local data
      await fetchLocalData();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Synchronisation fehlgeschlagen";
      toast({
        title: "Fehler bei Synchronisation",
        description: message,
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  const formatCurrency = (amount: number, currency = "eur") => {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const getPlanBadge = (plan: string) => {
    if (plan === "lifetime") {
      return (
        <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white">
          <Infinity className="w-3 h-3 mr-1" />
          Lifetime
        </Badge>
      );
    }
    return (
      <Badge className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
        <Crown className="w-3 h-3 mr-1" />
        Premium
      </Badge>
    );
  };

  const getStatusBadge = (status: string, cancelAtPeriodEnd?: boolean) => {
    if (cancelAtPeriodEnd && status === "active") {
      return <Badge className="bg-yellow-500/20 text-yellow-500">Kündigung ausstehend</Badge>;
    }
    switch (status) {
      case "active":
        return <Badge className="bg-green-500/20 text-green-500">Aktiv</Badge>;
      case "canceled":
        return <Badge className="bg-red-500/20 text-red-500">Gekündigt</Badge>;
      case "past_due":
        return <Badge className="bg-orange-500/20 text-orange-500">Überfällig</Badge>;
      case "trialing":
        return <Badge className="bg-blue-500/20 text-blue-500">Testphase</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // Show loading while checking roles
  if (roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isOwner && !isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate("/admin")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Zurück</span>
          </button>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h1 className="text-lg font-bold">Umsatz & Abos</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={fetchLocalData} disabled={loading} variant="outline" size="sm">
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Aktualisieren
            </Button>
            {isOwner && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button disabled={syncing} size="sm">
                    <Download className={`w-4 h-4 mr-2 ${syncing ? "animate-spin" : ""}`} />
                    Stripe Sync
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Stripe-Daten synchronisieren?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Dies holt alle aktuellen Abonnements und Zahlungen von Stripe und speichert sie lokal. 
                      Der Vorgang kann einige Sekunden dauern.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                    <AlertDialogAction onClick={syncWithStripe}>Synchronisieren</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl space-y-6">
        {/* Error Display */}
        {error && (
          <Card className="border-destructive bg-destructive/10">
            <CardContent className="flex items-center gap-3 p-4">
              <AlertCircle className="w-5 h-5 text-destructive" />
              <div>
                <p className="font-medium text-destructive">Fehler beim Laden</p>
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
              <Button variant="outline" size="sm" onClick={fetchLocalData} className="ml-auto">
                Erneut versuchen
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Title */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
            <Euro className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Umsatzübersicht</h2>
            <p className="text-muted-foreground">
              Lokale Daten - Stripe Webhooks synchronisieren automatisch
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Euro className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</p>
                  <p className="text-xs text-muted-foreground">Gesamtumsatz</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{formatCurrency(stats.monthlyRevenue)}</p>
                  <p className="text-xs text-muted-foreground">Monatlich (MRR)</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.activeSubscriptions}</p>
                  <p className="text-xs text-muted-foreground">Aktive Abos</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <Infinity className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.lifetimePurchases}</p>
                  <p className="text-xs text-muted-foreground">Lifetime-Käufe</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                  <Users className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.canceledSubscriptions}</p>
                  <p className="text-xs text-muted-foreground">Gekündigt</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Subscriptions Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Alle Abonnements
            </CardTitle>
            <CardDescription>
              Abos und Lifetime-Käufe aus der lokalen Datenbank
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : subscriptions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Noch keine Abonnements</p>
                <p className="text-sm">Nutze "Stripe Sync" um Daten zu laden</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kunde</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Betrag</TableHead>
                    <TableHead>Erstellt</TableHead>
                    <TableHead>Läuft bis</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscriptions.map((sub) => (
                    <TableRow key={sub.id}>
                      <TableCell className="font-medium">
                        {sub.customer_email || "Unbekannt"}
                      </TableCell>
                      <TableCell>{getPlanBadge(sub.plan_type)}</TableCell>
                      <TableCell>{getStatusBadge(sub.status, sub.cancel_at_period_end)}</TableCell>
                      <TableCell>{formatCurrency(sub.amount, sub.currency)}</TableCell>
                      <TableCell>
                        {format(new Date(sub.created_at), "dd.MM.yyyy", { locale: de })}
                      </TableCell>
                      <TableCell>
                        {sub.current_period_end 
                          ? format(new Date(sub.current_period_end), "dd.MM.yyyy", { locale: de })
                          : sub.plan_type === "lifetime" ? "∞" : "—"
                        }
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Recent Payments */}
        {payments.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Euro className="w-5 h-5" />
                Letzte Zahlungen
              </CardTitle>
              <CardDescription>
                Die letzten 50 erfolgreichen Zahlungen
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kunde</TableHead>
                    <TableHead>Typ</TableHead>
                    <TableHead>Betrag</TableHead>
                    <TableHead>Datum</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.slice(0, 10).map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">
                        {payment.customer_email || "Unbekannt"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {payment.payment_type === "subscription" ? "Abo" : "Einmalig"}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatCurrency(payment.amount, payment.currency)}</TableCell>
                      <TableCell>
                        {format(new Date(payment.created_at), "dd.MM.yyyy HH:mm", { locale: de })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Affiliate Earnings Section - Owner Only */}
        {isOwner && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-500" />
                Affiliate Provisionen
              </CardTitle>
              <CardDescription>
                Übersicht aller Affiliate-Einnahmen und Auszahlungen
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Affiliate Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                  <p className="text-2xl font-bold text-green-500">
                    {new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(affiliateStats.totalCommissions)}
                  </p>
                  <p className="text-xs text-muted-foreground">Gesamt-Provisionen</p>
                </div>
                <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                  <p className="text-2xl font-bold text-yellow-500">
                    {new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(affiliateStats.pendingCommissions)}
                  </p>
                  <p className="text-xs text-muted-foreground">Ausstehend</p>
                </div>
                <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <p className="text-2xl font-bold text-blue-500">
                    {new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(affiliateStats.paidCommissions)}
                  </p>
                  <p className="text-xs text-muted-foreground">Ausgezahlt</p>
                </div>
                <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                  <p className="text-2xl font-bold text-primary">{affiliateStats.totalReferrals}</p>
                  <p className="text-xs text-muted-foreground">Vermittlungen</p>
                </div>
              </div>

              {/* Affiliate Table */}
              {affiliateEarnings.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Noch keine Affiliate-Provisionen</p>
                  <p className="text-sm">Provisionen werden automatisch bei Abo-Zahlungen erstellt</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Affiliate</TableHead>
                      <TableHead>Zahlung</TableHead>
                      <TableHead>Provision (20%)</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Datum</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {affiliateEarnings.slice(0, 20).map((earning) => (
                      <TableRow key={earning.id}>
                        <TableCell className="font-medium">
                          {earning.referrer_email || earning.referrer_id.slice(0, 8)}
                        </TableCell>
                        <TableCell>
                          {new Intl.NumberFormat("de-DE", { style: "currency", currency: earning.currency.toUpperCase() }).format(earning.payment_amount)}
                        </TableCell>
                        <TableCell className="text-green-500 font-medium">
                          {new Intl.NumberFormat("de-DE", { style: "currency", currency: earning.currency.toUpperCase() }).format(earning.commission_amount)}
                        </TableCell>
                        <TableCell>
                          {earning.status === "pending" ? (
                            <Badge className="bg-yellow-500/20 text-yellow-500">Ausstehend</Badge>
                          ) : earning.status === "paid" ? (
                            <Badge className="bg-green-500/20 text-green-500">Ausgezahlt</Badge>
                          ) : (
                            <Badge variant="secondary">{earning.status}</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {format(new Date(earning.created_at), "dd.MM.yyyy", { locale: de })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
