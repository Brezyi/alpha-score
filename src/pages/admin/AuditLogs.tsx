import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Shield, History, UserPlus, UserMinus, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";

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
  created_at: string;
}

export default function AuditLogs() {
  const navigate = useNavigate();
  const { isOwner, isAdmin } = useUserRole();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    if (!isOwner && !isAdmin) {
      navigate("/dashboard");
      return;
    }
    fetchLogs();
  }, [isOwner, isAdmin, navigate, filter]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (filter !== "all") {
        query = query.eq("action_type", filter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setLogs((data as AuditLog[]) || []);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case "INSERT":
        return <UserPlus className="w-4 h-4 text-green-500" />;
      case "UPDATE":
        return <RefreshCw className="w-4 h-4 text-blue-500" />;
      case "DELETE":
        return <UserMinus className="w-4 h-4 text-red-500" />;
      default:
        return <History className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getActionBadge = (actionType: string) => {
    switch (actionType) {
      case "INSERT":
        return <Badge className="bg-green-500/20 text-green-500 hover:bg-green-500/30">Erstellt</Badge>;
      case "UPDATE":
        return <Badge className="bg-blue-500/20 text-blue-500 hover:bg-blue-500/30">Geändert</Badge>;
      case "DELETE":
        return <Badge className="bg-red-500/20 text-red-500 hover:bg-red-500/30">Gelöscht</Badge>;
      default:
        return <Badge variant="secondary">{actionType}</Badge>;
    }
  };

  const formatRoleChange = (log: AuditLog) => {
    if (log.table_name === "user_roles") {
      const oldRole = log.old_values?.role as string | undefined;
      const newRole = log.new_values?.role as string | undefined;

      if (log.action_type === "INSERT") {
        return `Rolle "${newRole}" zugewiesen`;
      } else if (log.action_type === "UPDATE") {
        return `Rolle geändert: ${oldRole} → ${newRole}`;
      } else if (log.action_type === "DELETE") {
        return `Rolle "${oldRole}" entfernt`;
      }
    }
    return log.metadata?.event as string || "Unbekannte Aktion";
  };

  const truncateId = (id: string | null) => {
    if (!id) return "-";
    return `${id.slice(0, 8)}...`;
  };

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
            <History className="w-5 h-5 text-primary" />
            <h1 className="text-lg font-bold">Audit-Logs</h1>
          </div>
          <div className="w-20" />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Title */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Aktivitätsprotokoll</h2>
            <p className="text-muted-foreground">
              Alle Admin-Aktionen und Rollenänderungen
            </p>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4 flex items-center gap-4">
            <span className="text-sm text-muted-foreground">Filter:</span>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Alle Aktionen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Aktionen</SelectItem>
                <SelectItem value="INSERT">Nur Erstellungen</SelectItem>
                <SelectItem value="UPDATE">Nur Änderungen</SelectItem>
                <SelectItem value="DELETE">Nur Löschungen</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchLogs}
              className="ml-auto"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Aktualisieren
            </Button>
          </CardContent>
        </Card>

        {/* Logs Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Letzte 100 Einträge
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Keine Audit-Logs vorhanden</p>
                <p className="text-sm">Änderungen an Rollen werden hier protokolliert</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Zeitpunkt</TableHead>
                    <TableHead>Aktion</TableHead>
                    <TableHead>Beschreibung</TableHead>
                    <TableHead>Betroffener Nutzer</TableHead>
                    <TableHead>Ausgeführt von</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-sm">
                            {format(new Date(log.created_at), "dd.MM.yyyy", { locale: de })}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(log.created_at), "HH:mm:ss", { locale: de })}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getActionIcon(log.action_type)}
                          {getActionBadge(log.action_type)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{formatRoleChange(log)}</span>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {truncateId(log.target_user_id)}
                        </code>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {truncateId(log.actor_id)}
                        </code>
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
