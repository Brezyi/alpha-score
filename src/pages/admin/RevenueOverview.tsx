import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
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
import { ArrowLeft, TrendingUp, CreditCard, Users, RefreshCw, Euro, Crown, Infinity } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";

interface SubscriptionData {
  id: string;
  customer_email: string;
  status: string;
  plan: "premium" | "lifetime";
  amount: number;
  current_period_end?: string;
  created: string;
}

interface RevenueStats {
  totalRevenue: number;
  monthlyRevenue: number;
  activeSubscriptions: number;
  lifetimePurchases: number;
}

export default function RevenueOverview() {
  const navigate = useNavigate();
  const { isOwner } = useUserRole();
  const [loading, setLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState<SubscriptionData[]>([]);
  const [stats, setStats] = useState<RevenueStats>({
    totalRevenue: 0,
    monthlyRevenue: 0,
    activeSubscriptions: 0,
    lifetimePurchases: 0,
  });

  useEffect(() => {
    if (!isOwner) {
      navigate("/admin");
      return;
    }
    fetchRevenueData();
  }, [isOwner, navigate]);

  const fetchRevenueData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("get-revenue-data");
      
      if (error) {
        console.error("Error fetching revenue data:", error);
        // Use mock data for display
        setStats({
          totalRevenue: 0,
          monthlyRevenue: 0,
          activeSubscriptions: 0,
          lifetimePurchases: 0,
        });
        setSubscriptions([]);
      } else if (data) {
        setStats(data.stats || {
          totalRevenue: 0,
          monthlyRevenue: 0,
          activeSubscriptions: 0,
          lifetimePurchases: 0,
        });
        setSubscriptions(data.subscriptions || []);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500/20 text-green-500">Aktiv</Badge>;
      case "canceled":
        return <Badge className="bg-red-500/20 text-red-500">Gekündigt</Badge>;
      case "past_due":
        return <Badge className="bg-yellow-500/20 text-yellow-500">Überfällig</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (!isOwner) return null;

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
          <Button onClick={fetchRevenueData} disabled={loading} variant="outline" size="sm">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Aktualisieren
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl space-y-6">
        {/* Title */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
            <Euro className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Umsatzübersicht</h2>
            <p className="text-muted-foreground">
              Stripe-Abonnements und Einmalzahlungen
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
        </div>

        {/* Subscriptions Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Aktive Abonnements
            </CardTitle>
            <CardDescription>
              Alle zahlenden Kunden und deren Abos
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
                <p className="text-sm">Zahlende Kunden erscheinen hier</p>
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
                        {sub.customer_email}
                      </TableCell>
                      <TableCell>{getPlanBadge(sub.plan)}</TableCell>
                      <TableCell>{getStatusBadge(sub.status)}</TableCell>
                      <TableCell>{formatCurrency(sub.amount)}</TableCell>
                      <TableCell>
                        {format(new Date(sub.created), "dd.MM.yyyy", { locale: de })}
                      </TableCell>
                      <TableCell>
                        {sub.current_period_end 
                          ? format(new Date(sub.current_period_end), "dd.MM.yyyy", { locale: de })
                          : "—"
                        }
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
