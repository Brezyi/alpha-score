import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { 
  ArrowLeft,
  Users,
  BarChart3,
  MessageSquare,
  Shield,
  Crown,
  History,
  HelpCircle,
  Star
} from "lucide-react";

interface DashboardStat {
  label: string;
  value: string | number;
  icon: React.ElementType;
  change?: string;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { role, isOwner } = useUserRole();
  const [stats, setStats] = useState<DashboardStat[]>([]);
  const [loading, setLoading] = useState(true);

  const [openTickets, setOpenTickets] = useState(0);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch total analyses count
        const { count: analysesCount } = await supabase
          .from('analyses')
          .select('*', { count: 'exact', head: true });

        // Fetch total users with roles
        const { count: usersCount } = await supabase
          .from('user_roles')
          .select('*', { count: 'exact', head: true });

        // Fetch open support tickets
        const { count: ticketsCount } = await supabase
          .from('support_tickets')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'open');

        setOpenTickets(ticketsCount || 0);

        setStats([
          { 
            label: "Gesamt-Analysen", 
            value: analysesCount || 0, 
            icon: BarChart3,
            change: "+12% diese Woche"
          },
          { 
            label: "Registrierte Nutzer", 
            value: usersCount || 0, 
            icon: Users,
            change: "+5 heute"
          },
          { 
            label: "Support-Tickets", 
            value: ticketsCount || 0, 
            icon: HelpCircle,
            change: ticketsCount ? `${ticketsCount} offen` : "Keine offenen"
          },
        ]);
      } catch (error) {
        console.error("Error fetching admin stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <button 
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Zurück</span>
          </button>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <h1 className="text-lg font-bold">Admin-Bereich</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-1 rounded-full bg-primary/20 text-primary font-medium capitalize">
              {role}
            </span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Role Badge */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
            {isOwner ? (
              <Crown className="w-6 h-6 text-primary" />
            ) : (
              <Shield className="w-6 h-6 text-primary" />
            )}
          </div>
          <div>
            <h2 className="text-2xl font-bold">
              {isOwner ? "Owner Dashboard" : "Admin Dashboard"}
            </h2>
            <p className="text-muted-foreground">
              {isOwner 
                ? "Vollzugriff auf alle Bereiche und Einstellungen" 
                : "Zugriff auf Nutzerübersicht und Moderation"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Icon className="w-5 h-5 text-muted-foreground" />
                    {stat.change && (
                      <span className="text-xs text-primary">{stat.change}</span>
                    )}
                  </div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Actions */}
        <h3 className="font-semibold mb-4">Schnellzugriff</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <Card 
            className="bg-card border-border hover:border-primary/50 transition-colors cursor-pointer"
            onClick={() => navigate("/admin/users")}
          >
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold">Nutzerverwaltung</p>
                <p className="text-sm text-muted-foreground">Nutzer anzeigen & verwalten</p>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="bg-card border-border hover:border-primary/50 transition-colors cursor-pointer relative"
            onClick={() => navigate("/admin/support")}
          >
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <HelpCircle className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold">Support</p>
                <p className="text-sm text-muted-foreground">Tickets verwalten</p>
              </div>
              {openTickets > 0 && (
                <Badge className="absolute top-3 right-3 bg-destructive">
                  {openTickets}
                </Badge>
              )}
            </CardContent>
          </Card>

          <Card 
            className="bg-card border-border hover:border-primary/50 transition-colors cursor-pointer"
            onClick={() => navigate("/admin/audit")}
          >
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <History className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold">Audit-Logs</p>
                <p className="text-sm text-muted-foreground">Aktivitätsprotokoll</p>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="bg-card border-border hover:border-primary/50 transition-colors cursor-pointer"
            onClick={() => navigate("/admin/testimonials")}
          >
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Star className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold">Bewertungen</p>
                <p className="text-sm text-muted-foreground">Testimonials verwalten</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Owner-Only Section */}
        {isOwner && (
          <>
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Crown className="w-4 h-4 text-primary" />
              Owner-Bereich
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card 
                className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30 hover:border-primary/50 transition-colors cursor-pointer"
                onClick={() => navigate("/admin/settings")}
              >
                <CardContent className="p-6">
                  <Shield className="w-8 h-8 text-primary mb-3" />
                  <p className="font-semibold">Systemeinstellungen</p>
                  <p className="text-sm text-muted-foreground">
                    App-Konfiguration, Sicherheit & Wartung
                  </p>
                </CardContent>
              </Card>

              <Card 
                className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30 hover:border-primary/50 transition-colors cursor-pointer"
                onClick={() => navigate("/admin/billing")}
              >
                <CardContent className="p-6">
                  <BarChart3 className="w-8 h-8 text-primary mb-3" />
                  <p className="font-semibold">Umsatz & Abos</p>
                  <p className="text-sm text-muted-foreground">
                    Zahlungen, Subscriptions & Revenue
                  </p>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
