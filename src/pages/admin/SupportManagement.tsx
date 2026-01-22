import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { useSupport, SupportTicket, TicketStatus } from "@/hooks/useSupport";
import { useReports, Report, ReportStatus } from "@/hooks/useReports";
import { ProfileMenu } from "@/components/ProfileMenu";
import {
  ArrowLeft,
  Shield,
  Loader2,
  HelpCircle,
  Flag,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  MessageSquare,
  CreditCard,
  User,
  MoreHorizontal,
  Search,
  Filter,
} from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { format } from "date-fns";
import { de } from "date-fns/locale";

const TICKET_STATUS_CONFIG: Record<TicketStatus, { label: string; color: string }> = {
  open: { label: "Offen", color: "bg-yellow-500/20 text-yellow-400" },
  in_progress: { label: "In Bearbeitung", color: "bg-blue-500/20 text-blue-400" },
  closed: { label: "Geschlossen", color: "bg-green-500/20 text-green-400" },
};

const REPORT_STATUS_CONFIG: Record<ReportStatus, { label: string; color: string }> = {
  pending: { label: "Ausstehend", color: "bg-yellow-500/20 text-yellow-400" },
  reviewed: { label: "Geprüft", color: "bg-blue-500/20 text-blue-400" },
  resolved: { label: "Erledigt", color: "bg-green-500/20 text-green-400" },
  dismissed: { label: "Abgelehnt", color: "bg-muted text-muted-foreground" },
};

const CATEGORY_LABELS = {
  technical: "Technisch",
  payment: "Zahlung",
  account: "Account",
  other: "Sonstiges",
};

const REASON_LABELS = {
  inappropriate: "Unangemessen",
  harassment: "Belästigung",
  spam: "Spam",
  misinformation: "Falschinformation",
  other: "Sonstiges",
};

const SupportManagement = () => {
  const { user, loading: authLoading } = useAuth();
  const { isAdminOrOwner, loading: roleLoading } = useUserRole();
  const { tickets, loading: ticketsLoading, updateTicketStatus } = useSupport();
  const { reports, loading: reportsLoading, updateReportStatus } = useReports();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [newStatus, setNewStatus] = useState<string>("");

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || !isAdminOrOwner) {
    return <Navigate to="/dashboard" replace />;
  }

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || ticket.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredReports = reports.filter((report) => {
    const matchesSearch =
      (report.description?.toLowerCase() || "").includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || report.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleTicketUpdate = async () => {
    if (selectedTicket && newStatus) {
      await updateTicketStatus(selectedTicket.id, newStatus as TicketStatus, adminNotes || undefined);
      setSelectedTicket(null);
      setAdminNotes("");
      setNewStatus("");
    }
  };

  const handleReportUpdate = async () => {
    if (selectedReport && newStatus) {
      await updateReportStatus(selectedReport.id, newStatus as ReportStatus, adminNotes || undefined);
      setSelectedReport(null);
      setAdminNotes("");
      setNewStatus("");
    }
  };

  const openTickets = tickets.filter((t) => t.status === "open").length;
  const pendingReports = reports.filter((r) => r.status === "pending").length;

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
              <span className="text-xl font-bold">Support & Reports</span>
            </div>
          </div>
          <ProfileMenu />
        </div>
      </header>

      <main className="container px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-500/20">
                  <HelpCircle className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{openTickets}</p>
                  <p className="text-xs text-muted-foreground">Offene Tickets</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-500/20">
                  <Flag className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{pendingReports}</p>
                  <p className="text-xs text-muted-foreground">Offene Reports</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/20">
                  <MessageSquare className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{tickets.length}</p>
                  <p className="text-xs text-muted-foreground">Tickets gesamt</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <Shield className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{reports.length}</p>
                  <p className="text-xs text-muted-foreground">Reports gesamt</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Suchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Status</SelectItem>
              <SelectItem value="open">Offen</SelectItem>
              <SelectItem value="pending">Ausstehend</SelectItem>
              <SelectItem value="in_progress">In Bearbeitung</SelectItem>
              <SelectItem value="reviewed">Geprüft</SelectItem>
              <SelectItem value="resolved">Erledigt</SelectItem>
              <SelectItem value="closed">Geschlossen</SelectItem>
              <SelectItem value="dismissed">Abgelehnt</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Tabs defaultValue="tickets" className="space-y-6">
          <TabsList>
            <TabsTrigger value="tickets" className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4" />
              Support-Tickets
              {openTickets > 0 && (
                <Badge variant="secondary">{openTickets}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <Flag className="w-4 h-4" />
              Reports
              {pendingReports > 0 && (
                <Badge variant="destructive">{pendingReports}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Tickets Tab */}
          <TabsContent value="tickets">
            {ticketsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : filteredTickets.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <HelpCircle className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Keine Tickets</h3>
                  <p className="text-muted-foreground">
                    Keine Support-Anfragen gefunden.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredTickets.map((ticket) => (
                  <Card key={ticket.id} className="hover:border-primary/50 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline">
                              {CATEGORY_LABELS[ticket.category as keyof typeof CATEGORY_LABELS]}
                            </Badge>
                            <Badge className={TICKET_STATUS_CONFIG[ticket.status].color}>
                              {TICKET_STATUS_CONFIG[ticket.status].label}
                            </Badge>
                          </div>
                          <h4 className="font-medium mb-1">{ticket.subject}</h4>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {ticket.description}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            User ID: {ticket.user_id.slice(0, 8)}... • {format(new Date(ticket.created_at), "dd. MMM yyyy HH:mm", { locale: de })}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedTicket(ticket);
                            setNewStatus(ticket.status);
                            setAdminNotes(ticket.admin_notes || "");
                          }}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports">
            {reportsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : filteredReports.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Flag className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Keine Reports</h3>
                  <p className="text-muted-foreground">
                    Keine Meldungen gefunden.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredReports.map((report) => (
                  <Card key={report.id} className="hover:border-primary/50 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline">
                              {report.reported_content_type}
                            </Badge>
                            <Badge variant="destructive">
                              {REASON_LABELS[report.reason as keyof typeof REASON_LABELS]}
                            </Badge>
                            <Badge className={REPORT_STATUS_CONFIG[report.status].color}>
                              {REPORT_STATUS_CONFIG[report.status].label}
                            </Badge>
                          </div>
                          {report.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {report.description}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-2">
                            Reporter: {report.reporter_id.slice(0, 8)}...
                            {report.reported_user_id && ` • Reported: ${report.reported_user_id.slice(0, 8)}...`}
                            {" • "}{format(new Date(report.created_at), "dd. MMM yyyy HH:mm", { locale: de })}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedReport(report);
                            setNewStatus(report.status);
                            setAdminNotes(report.admin_notes || "");
                          }}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Ticket Detail Dialog */}
      <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Ticket Details</DialogTitle>
            <DialogDescription>
              Ticket #{selectedTicket?.id.slice(0, 8)}
            </DialogDescription>
          </DialogHeader>
          {selectedTicket && (
            <div className="space-y-4 py-4">
              <div>
                <Label className="text-muted-foreground">Betreff</Label>
                <p className="font-medium">{selectedTicket.subject}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Beschreibung</Label>
                <p className="text-sm whitespace-pre-wrap">{selectedTicket.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Kategorie</Label>
                  <p>{CATEGORY_LABELS[selectedTicket.category as keyof typeof CATEGORY_LABELS]}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Erstellt</Label>
                  <p>{format(new Date(selectedTicket.created_at), "dd.MM.yyyy HH:mm", { locale: de })}</p>
                </div>
              </div>
              
              <div className="border-t pt-4 space-y-4">
                <div className="space-y-2">
                  <Label>Status ändern</Label>
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Offen</SelectItem>
                      <SelectItem value="in_progress">In Bearbeitung</SelectItem>
                      <SelectItem value="closed">Geschlossen</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Admin-Notizen / Antwort</Label>
                  <Textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Notizen oder Antwort für den Nutzer..."
                    rows={3}
                  />
                </div>
                <Button onClick={handleTicketUpdate} className="w-full">
                  Speichern
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Report Detail Dialog */}
      <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Report Details</DialogTitle>
            <DialogDescription>
              Report #{selectedReport?.id.slice(0, 8)}
            </DialogDescription>
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Grund</Label>
                  <p className="font-medium">
                    {REASON_LABELS[selectedReport.reason as keyof typeof REASON_LABELS]}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Content-Typ</Label>
                  <p>{selectedReport.reported_content_type}</p>
                </div>
              </div>
              {selectedReport.description && (
                <div>
                  <Label className="text-muted-foreground">Beschreibung</Label>
                  <p className="text-sm whitespace-pre-wrap">{selectedReport.description}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Reporter ID</Label>
                  <p className="text-sm font-mono">{selectedReport.reporter_id.slice(0, 12)}...</p>
                </div>
                {selectedReport.reported_user_id && (
                  <div>
                    <Label className="text-muted-foreground">Reported User ID</Label>
                    <p className="text-sm font-mono">{selectedReport.reported_user_id.slice(0, 12)}...</p>
                  </div>
                )}
              </div>

              <div className="border-t pt-4 space-y-4">
                <div className="space-y-2">
                  <Label>Status ändern</Label>
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Ausstehend</SelectItem>
                      <SelectItem value="reviewed">Geprüft</SelectItem>
                      <SelectItem value="resolved">Erledigt</SelectItem>
                      <SelectItem value="dismissed">Abgelehnt</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Admin-Notizen</Label>
                  <Textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Interne Notizen zur Bearbeitung..."
                    rows={3}
                  />
                </div>
                <Button onClick={handleReportUpdate} className="w-full">
                  Speichern
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SupportManagement;
