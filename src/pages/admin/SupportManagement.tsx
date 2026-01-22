import { useState, useEffect } from "react";
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
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { ProfileMenu } from "@/components/ProfileMenu";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowLeft,
  Shield,
  Loader2,
  HelpCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  Image as ImageIcon,
  Paperclip,
  User,
  Calendar,
  MessageSquare,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { format } from "date-fns";
import { de } from "date-fns/locale";

const TICKET_STATUS_CONFIG: Record<TicketStatus, { label: string; color: string; icon: typeof Clock }> = {
  open: { label: "Offen", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", icon: AlertCircle },
  in_progress: { label: "In Bearbeitung", color: "bg-blue-500/20 text-blue-400 border-blue-500/30", icon: Clock },
  closed: { label: "Geschlossen", color: "bg-green-500/20 text-green-400 border-green-500/30", icon: CheckCircle2 },
};

const CATEGORY_CONFIG: Record<string, { label: string; color: string }> = {
  technical: { label: "Technisch", color: "bg-purple-500/20 text-purple-400" },
  payment: { label: "Zahlung", color: "bg-emerald-500/20 text-emerald-400" },
  account: { label: "Account", color: "bg-orange-500/20 text-orange-400" },
  other: { label: "Sonstiges", color: "bg-muted text-muted-foreground" },
};

const SupportManagement = () => {
  const { user, loading: authLoading } = useAuth();
  const { isAdminOrOwner, loading: roleLoading } = useUserRole();
  const { tickets, loading: ticketsLoading, updateTicketStatus } = useSupport();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [newStatus, setNewStatus] = useState<string>("");
  const [attachmentUrls, setAttachmentUrls] = useState<string[]>([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Load signed URLs for attachments when ticket is selected
  useEffect(() => {
    const loadAttachments = async () => {
      if (!selectedTicket?.attachment_urls?.length) {
        setAttachmentUrls([]);
        return;
      }

      setLoadingAttachments(true);
      const urls = await Promise.all(
        selectedTicket.attachment_urls.map(async (url) => {
          const path = url.includes('/support-attachments/')
            ? url.split('/support-attachments/')[1]
            : url;
          
          const { data, error } = await supabase.storage
            .from("support-attachments")
            .createSignedUrl(path, 3600);
          
          if (error) {
            console.error("Error creating signed URL:", error);
            return null;
          }
          return data?.signedUrl || null;
        })
      );
      setAttachmentUrls(urls.filter(Boolean) as string[]);
      setLoadingAttachments(false);
    };

    loadAttachments();
  }, [selectedTicket]);

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
    const matchesCategory = categoryFilter === "all" || ticket.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const handleTicketUpdate = async () => {
    if (selectedTicket && newStatus) {
      await updateTicketStatus(selectedTicket.id, newStatus as TicketStatus, adminNotes || undefined);
      setSelectedTicket(null);
      setAdminNotes("");
      setNewStatus("");
    }
  };

  const openTickets = tickets.filter((t) => t.status === "open").length;
  const inProgressTickets = tickets.filter((t) => t.status === "in_progress").length;
  const closedTickets = tickets.filter((t) => t.status === "closed").length;

  const isImageFile = (url: string) => {
    return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url);
  };

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
              <span className="text-xl font-bold">Support-Verwaltung</span>
            </div>
          </div>
          <ProfileMenu />
        </div>
      </header>

      <main className="container px-4 py-8 max-w-6xl">
        {/* Stats Overview */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-yellow-500/10 to-transparent border-yellow-500/20">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-yellow-400">{openTickets}</p>
                  <p className="text-sm text-muted-foreground">Offen</p>
                </div>
                <AlertCircle className="w-8 h-8 text-yellow-400/50" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-blue-500/10 to-transparent border-blue-500/20">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-blue-400">{inProgressTickets}</p>
                  <p className="text-sm text-muted-foreground">In Bearbeitung</p>
                </div>
                <Clock className="w-8 h-8 text-blue-400/50" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-500/10 to-transparent border-green-500/20">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-green-400">{closedTickets}</p>
                  <p className="text-sm text-muted-foreground">Geschlossen</p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-green-400/50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Tickets durchsuchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Status</SelectItem>
              <SelectItem value="open">Offen</SelectItem>
              <SelectItem value="in_progress">In Bearbeitung</SelectItem>
              <SelectItem value="closed">Geschlossen</SelectItem>
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue placeholder="Kategorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Kategorien</SelectItem>
              <SelectItem value="technical">Technisch</SelectItem>
              <SelectItem value="payment">Zahlung</SelectItem>
              <SelectItem value="account">Account</SelectItem>
              <SelectItem value="other">Sonstiges</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tickets List */}
        {ticketsLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
          </div>
        ) : filteredTickets.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <HelpCircle className="w-16 h-16 text-muted-foreground/50 mb-4" />
              <h3 className="text-xl font-medium mb-2">Keine Tickets gefunden</h3>
              <p className="text-muted-foreground max-w-sm">
                {searchTerm || statusFilter !== "all" || categoryFilter !== "all"
                  ? "Versuche andere Filtereinstellungen."
                  : "Aktuell gibt es keine Support-Anfragen."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredTickets.map((ticket) => {
              const statusConfig = TICKET_STATUS_CONFIG[ticket.status];
              const categoryConfig = CATEGORY_CONFIG[ticket.category] || CATEGORY_CONFIG.other;
              const StatusIcon = statusConfig.icon;
              const hasAttachments = ticket.attachment_urls && ticket.attachment_urls.length > 0;

              return (
                <Card 
                  key={ticket.id} 
                  className="hover:border-primary/50 transition-all cursor-pointer group"
                  onClick={() => {
                    setSelectedTicket(ticket);
                    setNewStatus(ticket.status);
                    setAdminNotes(ticket.admin_notes || "");
                  }}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      {/* Status Icon */}
                      <div className={`p-3 rounded-xl ${statusConfig.color} shrink-0`}>
                        <StatusIcon className="w-5 h-5" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <h4 className="font-semibold text-lg group-hover:text-primary transition-colors line-clamp-1">
                            {ticket.subject}
                          </h4>
                          <div className="flex items-center gap-2 shrink-0">
                            {hasAttachments && (
                              <Badge variant="outline" className="gap-1">
                                <Paperclip className="w-3 h-3" />
                                {ticket.attachment_urls?.length}
                              </Badge>
                            )}
                            <Badge className={categoryConfig.color}>
                              {categoryConfig.label}
                            </Badge>
                          </div>
                        </div>
                        
                        <p className="text-muted-foreground line-clamp-2 mb-3">
                          {ticket.description}
                        </p>

                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5" />
                            <span className="font-mono">{ticket.user_id.slice(0, 8)}...</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{format(new Date(ticket.created_at), "dd. MMM yyyy, HH:mm", { locale: de })}</span>
                          </div>
                          {ticket.admin_notes && (
                            <div className="flex items-center gap-1.5 text-primary">
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>Notiz vorhanden</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {/* Ticket Detail Dialog */}
      <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-primary" />
              Ticket Details
            </DialogTitle>
            <DialogDescription>
              #{selectedTicket?.id.slice(0, 8)} • Erstellt am {selectedTicket && format(new Date(selectedTicket.created_at), "dd.MM.yyyy 'um' HH:mm 'Uhr'", { locale: de })}
            </DialogDescription>
          </DialogHeader>
          
          {selectedTicket && (
            <div className="space-y-6 py-4">
              {/* Header Info */}
              <div className="flex items-center gap-3 flex-wrap">
                <Badge className={TICKET_STATUS_CONFIG[selectedTicket.status].color}>
                  {TICKET_STATUS_CONFIG[selectedTicket.status].label}
                </Badge>
                <Badge className={CATEGORY_CONFIG[selectedTicket.category]?.color || CATEGORY_CONFIG.other.color}>
                  {CATEGORY_CONFIG[selectedTicket.category]?.label || "Sonstiges"}
                </Badge>
                <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  User: <span className="font-mono">{selectedTicket.user_id.slice(0, 12)}...</span>
                </span>
              </div>

              {/* Subject & Description */}
              <div className="space-y-4">
                <div>
                  <Label className="text-muted-foreground text-xs uppercase tracking-wide">Betreff</Label>
                  <p className="font-medium text-lg mt-1">{selectedTicket.subject}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs uppercase tracking-wide">Beschreibung</Label>
                  <div className="mt-1 p-4 rounded-lg bg-muted/50 whitespace-pre-wrap text-sm">
                    {selectedTicket.description}
                  </div>
                </div>
              </div>

              {/* Attachments */}
              {selectedTicket.attachment_urls && selectedTicket.attachment_urls.length > 0 && (
                <div>
                  <Label className="text-muted-foreground text-xs uppercase tracking-wide flex items-center gap-2">
                    <Paperclip className="w-3.5 h-3.5" />
                    Anhänge ({selectedTicket.attachment_urls.length})
                  </Label>
                  <div className="mt-3">
                    {loadingAttachments ? (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm">Lade Anhänge...</span>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {attachmentUrls.map((url, index) => (
                          isImageFile(selectedTicket.attachment_urls![index]) ? (
                            <button
                              key={index}
                              onClick={() => {
                                setLightboxIndex(index);
                                setLightboxOpen(true);
                              }}
                              className="relative aspect-square rounded-lg overflow-hidden border border-border hover:border-primary/50 transition-colors group"
                            >
                              <img
                                src={url}
                                alt={`Anhang ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                <ImageIcon className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                            </button>
                          ) : (
                            <a
                              key={index}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 p-3 rounded-lg border border-border hover:border-primary/50 transition-colors"
                            >
                              <Paperclip className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm truncate">Datei {index + 1}</span>
                            </a>
                          )
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Admin Section */}
              <div className="border-t pt-6 space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" />
                  Admin-Aktionen
                </h4>
                
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Status ändern</Label>
                    <Select value={newStatus} onValueChange={setNewStatus}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-yellow-400" />
                            Offen
                          </div>
                        </SelectItem>
                        <SelectItem value="in_progress">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-blue-400" />
                            In Bearbeitung
                          </div>
                        </SelectItem>
                        <SelectItem value="closed">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-400" />
                            Geschlossen
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Admin-Notizen / Antwort</Label>
                  <Textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Notizen oder Antwort für den Nutzer eingeben..."
                    rows={4}
                    className="resize-none"
                  />
                </div>

                <Button onClick={handleTicketUpdate} className="w-full" size="lg">
                  Änderungen speichern
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Image Lightbox */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95 border-none">
          <div className="relative w-full h-full flex items-center justify-center min-h-[60vh]">
            {/* Close Button */}
            <button
              onClick={() => setLightboxOpen(false)}
              className="absolute top-4 right-4 z-50 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Navigation - Previous */}
            {attachmentUrls.length > 1 && (
              <button
                onClick={() => setLightboxIndex((prev) => (prev === 0 ? attachmentUrls.length - 1 : prev - 1))}
                className="absolute left-4 z-50 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            {/* Image */}
            {attachmentUrls[lightboxIndex] && (
              <img
                src={attachmentUrls[lightboxIndex]}
                alt={`Anhang ${lightboxIndex + 1}`}
                className="max-w-full max-h-[85vh] object-contain rounded-lg"
              />
            )}

            {/* Navigation - Next */}
            {attachmentUrls.length > 1 && (
              <button
                onClick={() => setLightboxIndex((prev) => (prev === attachmentUrls.length - 1 ? 0 : prev + 1))}
                className="absolute right-4 z-50 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}

            {/* Counter */}
            {attachmentUrls.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/50 text-white text-sm">
                {lightboxIndex + 1} / {attachmentUrls.length}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SupportManagement;
