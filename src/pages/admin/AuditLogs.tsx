import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { ProfileMenu } from "@/components/ProfileMenu";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import {
  ArrowLeft,
  Shield,
  RefreshCw,
  Search,
  FileText,
  Edit,
  Trash2,
  Plus,
  LogIn,
  LogOut,
  AlertTriangle,
  UserPlus,
  CreditCard,
  Settings,
  Key,
  Loader2,
  User,
  Calendar,
} from "lucide-react";
import { Link } from "react-router-dom";

interface AuditLog {
  id: string;
  action_type: string;
  table_name: string;
  record_id: string | null;
  actor_id: string | null;
  target_user_id: string | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
}

const EVENT_CATEGORIES = {
  auth: ["LOGIN", "LOGOUT", "FAILED_LOGIN", "SIGNUP", "PASSWORD_RESET"],
  data: ["INSERT", "UPDATE", "DELETE"],
  subscription: ["SUBSCRIPTION_CHANGE", "PAYMENT_SUCCESS", "PAYMENT_FAILED"],
  settings: ["PROFILE_UPDATE"],
};

const getEventIcon = (actionType: string) => {
  const icons: Record<string, typeof LogIn> = {
    LOGIN: LogIn,
    LOGOUT: LogOut,
    FAILED_LOGIN: AlertTriangle,
    SIGNUP: UserPlus,
    PASSWORD_RESET: Key,
    INSERT: Plus,
    UPDATE: Edit,
    DELETE: Trash2,
    SUBSCRIPTION_CHANGE: CreditCard,
    PAYMENT_SUCCESS: CreditCard,
    PAYMENT_FAILED: AlertTriangle,
    PROFILE_UPDATE: Settings,
  };
  return icons[actionType] || FileText;
};

const getEventBadgeColor = (actionType: string) => {
  if (["LOGIN", "SIGNUP", "PAYMENT_SUCCESS"].includes(actionType)) {
    return "bg-green-500/20 text-green-400 border-green-500/30";
  }
  if (["LOGOUT", "UPDATE", "PROFILE_UPDATE"].includes(actionType)) {
    return "bg-blue-500/20 text-blue-400 border-blue-500/30";
  }
  if (["FAILED_LOGIN", "DELETE", "PAYMENT_FAILED"].includes(actionType)) {
    return "bg-red-500/20 text-red-400 border-red-500/30";
  }
  if (["INSERT", "SUBSCRIPTION_CHANGE", "PASSWORD_RESET"].includes(actionType)) {
    return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
  }
  return "bg-muted text-muted-foreground";
};

const getEventLabel = (log: AuditLog): string => {
  const metadata = log.metadata as Record<string, unknown> | null;
  if (metadata?.event) return String(metadata.event);

  const labels: Record<string, string> = {
    LOGIN: "Benutzer angemeldet",
    LOGOUT: "Benutzer abgemeldet",
    FAILED_LOGIN: "Fehlgeschlagener Login",
    SIGNUP: "Neuer Benutzer registriert",
    PASSWORD_RESET: "Passwort zurückgesetzt",
    INSERT: `Datensatz erstellt in ${log.table_name}`,
    UPDATE: `Datensatz aktualisiert in ${log.table_name}`,
    DELETE: `Datensatz gelöscht in ${log.table_name}`,
    SUBSCRIPTION_CHANGE: "Abo-Änderung",
    PAYMENT_SUCCESS: "Zahlung erfolgreich",
    PAYMENT_FAILED: "Zahlung fehlgeschlagen",
    PROFILE_UPDATE: "Profil aktualisiert",
  };
  
  // Special case for role changes
  if (log.table_name === "user_roles" && log.action_type === "UPDATE") {
    const oldRole = (log.old_values as Record<string, unknown>)?.role;
    const newRole = (log.new_values as Record<string, unknown>)?.role;
    if (oldRole && newRole) {
      return `Rolle geändert: ${oldRole} → ${newRole}`;
    }
  }
  
  return labels[log.action_type] || log.action_type;
};

export default function AuditLogs() {
  const navigate = useNavigate();
  const { isOwner, isAdmin, loading: roleLoading } = useUserRole();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState<string>("");

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);

      if (filter !== "all") {
        query = query.eq("action_type", filter);
      }

      if (categoryFilter !== "all") {
        const eventTypes = EVENT_CATEGORIES[categoryFilter as keyof typeof EVENT_CATEGORIES] || [];
        if (eventTypes.length > 0) {
          query = query.in("action_type", eventTypes);
        }
      }

      if (dateFilter) {
        const startOfDay = new Date(dateFilter);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(dateFilter);
        endOfDay.setHours(23, 59, 59, 999);
        query = query
          .gte("created_at", startOfDay.toISOString())
          .lte("created_at", endOfDay.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;
      setLogs((data as AuditLog[]) || []);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
    } finally {
      setLoading(false);
    }
  }, [filter, categoryFilter, dateFilter]);

  useEffect(() => {
    if (!roleLoading && !isOwner && !isAdmin) {
      navigate("/dashboard");
      return;
    }
    fetchLogs();
  }, [isOwner, isAdmin, roleLoading, navigate, fetchLogs]);

  const filteredLogs = logs.filter((log) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      log.action_type.toLowerCase().includes(searchLower) ||
      log.table_name.toLowerCase().includes(searchLower) ||
      log.actor_id?.toLowerCase().includes(searchLower) ||
      getEventLabel(log).toLowerCase().includes(searchLower)
    );
  });

  const truncateId = (id: string | null) => {
    if (!id) return "-";
    return id.slice(0, 8) + "...";
  };

  if (roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-card border-b border-border">
        <div className="container flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-4">
            <Link to="/admin">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-primary" />
              <span className="text-xl font-bold">Audit-Logs</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={fetchLogs} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Aktualisieren
            </Button>
            <ProfileMenu />
          </div>
        </div>
      </header>

      <main className="container px-4 py-8 max-w-7xl">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-green-500/10 to-transparent border-green-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <LogIn className="w-5 h-5 text-green-400" />
                <div>
                  <p className="text-2xl font-bold text-green-400">
                    {logs.filter((l) => l.action_type === "LOGIN").length}
                  </p>
                  <p className="text-xs text-muted-foreground">Logins</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-red-500/10 to-transparent border-red-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                <div>
                  <p className="text-2xl font-bold text-red-400">
                    {logs.filter((l) => l.action_type === "FAILED_LOGIN").length}
                  </p>
                  <p className="text-xs text-muted-foreground">Fehlversuche</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-blue-500/10 to-transparent border-blue-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Edit className="w-5 h-5 text-blue-400" />
                <div>
                  <p className="text-2xl font-bold text-blue-400">
                    {logs.filter((l) => ["UPDATE", "PROFILE_UPDATE"].includes(l.action_type)).length}
                  </p>
                  <p className="text-xs text-muted-foreground">Änderungen</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-yellow-500/10 to-transparent border-yellow-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-yellow-400" />
                <div>
                  <p className="text-2xl font-bold text-yellow-400">
                    {logs.filter((l) => ["PAYMENT_SUCCESS", "SUBSCRIPTION_CHANGE"].includes(l.action_type)).length}
                  </p>
                  <p className="text-xs text-muted-foreground">Zahlungen</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Logs durchsuchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue placeholder="Kategorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Kategorien</SelectItem>
              <SelectItem value="auth">Authentifizierung</SelectItem>
              <SelectItem value="data">Datenänderungen</SelectItem>
              <SelectItem value="subscription">Abos & Zahlungen</SelectItem>
              <SelectItem value="settings">Einstellungen</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Aktion" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Aktionen</SelectItem>
              <SelectItem value="LOGIN">Login</SelectItem>
              <SelectItem value="LOGOUT">Logout</SelectItem>
              <SelectItem value="FAILED_LOGIN">Fehlgeschlagen</SelectItem>
              <SelectItem value="SIGNUP">Registrierung</SelectItem>
              <SelectItem value="INSERT">Erstellt</SelectItem>
              <SelectItem value="UPDATE">Aktualisiert</SelectItem>
              <SelectItem value="DELETE">Gelöscht</SelectItem>
              <SelectItem value="SUBSCRIPTION_CHANGE">Abo-Änderung</SelectItem>
              <SelectItem value="PAYMENT_SUCCESS">Zahlung OK</SelectItem>
              <SelectItem value="PAYMENT_FAILED">Zahlung Fehl</SelectItem>
            </SelectContent>
          </Select>
          <Input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full sm:w-[160px]"
          />
        </div>

        {/* Logs Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <FileText className="w-12 h-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">Keine Logs gefunden</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[180px]">Zeitpunkt</TableHead>
                    <TableHead className="w-[140px]">Aktion</TableHead>
                    <TableHead>Beschreibung</TableHead>
                    <TableHead className="w-[120px]">Benutzer</TableHead>
                    <TableHead className="w-[100px]">Ziel</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => {
                    const Icon = getEventIcon(log.action_type);
                    return (
                      <TableRow key={log.id}>
                        <TableCell className="font-mono text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="w-3.5 h-3.5" />
                            {format(new Date(log.created_at), "dd.MM.yy HH:mm:ss", { locale: de })}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`gap-1.5 ${getEventBadgeColor(log.action_type)}`}>
                            <Icon className="w-3 h-3" />
                            {log.action_type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{getEventLabel(log)}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <User className="w-3.5 h-3.5" />
                            <span className="font-mono">{truncateId(log.actor_id)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-sm text-muted-foreground">
                            {truncateId(log.target_user_id)}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground mt-4 text-center">
          Audit-Logs sind unveränderbar und können nicht gelöscht werden. Zeige die letzten 200 Einträge.
        </p>
      </main>
    </div>
  );
}
