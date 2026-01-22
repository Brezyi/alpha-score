import { useState, useRef } from "react";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useSupport, TicketCategory, TicketStatus, SupportTicket } from "@/hooks/useSupport";
import { useTicketMessages } from "@/hooks/useTicketMessages";
import { ProfileMenu } from "@/components/ProfileMenu";
import { TicketChat } from "@/components/TicketChat";
import {
  ArrowLeft,
  HelpCircle,
  Upload,
  X,
  Clock,
  CheckCircle2,
  Loader2,
  MessageSquare,
  CreditCard,
  User,
  MoreHorizontal,
  Send,
  ChevronRight,
} from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { format } from "date-fns";
import { de } from "date-fns/locale";

const CATEGORIES: { value: TicketCategory; label: string; icon: React.ReactNode }[] = [
  { value: "technical", label: "Technisches Problem", icon: <MessageSquare className="w-4 h-4" /> },
  { value: "payment", label: "Zahlung", icon: <CreditCard className="w-4 h-4" /> },
  { value: "account", label: "Account", icon: <User className="w-4 h-4" /> },
  { value: "other", label: "Sonstiges", icon: <MoreHorizontal className="w-4 h-4" /> },
];

const STATUS_CONFIG: Record<TicketStatus, { label: string; color: string; icon: React.ReactNode }> = {
  open: { label: "Offen", color: "bg-yellow-500/20 text-yellow-400", icon: <Clock className="w-3 h-3" /> },
  in_progress: { label: "In Bearbeitung", color: "bg-blue-500/20 text-blue-400", icon: <Loader2 className="w-3 h-3" /> },
  closed: { label: "Geschlossen", color: "bg-green-500/20 text-green-400", icon: <CheckCircle2 className="w-3 h-3" /> },
};

const Support = () => {
  const { user, loading: authLoading } = useAuth();
  const { tickets, loading, creating, createTicket } = useSupport();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [category, setCategory] = useState<TicketCategory>("technical");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  
  // Ticket detail dialog
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replyMessage, setReplyMessage] = useState("");
  
  // Messages hook
  const { messages, loading: messagesLoading, sending, sendMessage } = useTicketMessages(
    selectedTicket?.id || null
  );

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...newFiles].slice(0, 3)); // Max 3 files
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!description.trim()) return;

    const result = await createTicket({
      category,
      subject: subject.trim() || `${CATEGORIES.find(c => c.value === category)?.label} Anfrage`,
      description: description.trim(),
      attachments: files.length > 0 ? files : undefined,
    });

    if (result) {
      setCategory("technical");
      setSubject("");
      setDescription("");
      setFiles([]);
    }
  };

  const handleSendReply = async () => {
    if (!replyMessage.trim() || !selectedTicket) return;
    
    const result = await sendMessage(replyMessage, false);
    if (result) {
      setReplyMessage("");
    }
  };

  const userTickets = tickets.filter((t) => t.user_id === user.id);
  const hasUnreadAdminReply = (ticket: SupportTicket) => {
    // Check if there are admin messages for this ticket
    return ticket.admin_notes !== null || messages.some(m => m.is_admin && m.ticket_id === ticket.id);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-card border-b border-border">
        <div className="container flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-4">
            <Link to="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <HelpCircle className="w-6 h-6 text-primary" />
              <span className="text-xl font-bold">Support</span>
            </div>
          </div>
          <ProfileMenu />
        </div>
      </header>

      <main className="container px-4 py-8 max-w-4xl">
        <Tabs defaultValue="new" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="new">Neue Anfrage</TabsTrigger>
            <TabsTrigger value="tickets">
              Meine Tickets
              {userTickets.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {userTickets.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="new">
            <Card>
              <CardHeader>
                <CardTitle>Support-Anfrage erstellen</CardTitle>
                <CardDescription>
                  Beschreibe dein Problem und wir helfen dir so schnell wie möglich.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Category */}
                  <div className="space-y-2">
                    <Label>Kategorie</Label>
                    <Select value={category} onValueChange={(v) => setCategory(v as TicketCategory)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            <div className="flex items-center gap-2">
                              {cat.icon}
                              {cat.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Subject */}
                  <div className="space-y-2">
                    <Label htmlFor="subject">Betreff (optional)</Label>
                    <Input
                      id="subject"
                      placeholder="Kurze Zusammenfassung des Problems"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      maxLength={100}
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label htmlFor="description">
                      Beschreibung <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                      id="description"
                      placeholder="Beschreibe dein Problem im Detail..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={5}
                      required
                      maxLength={2000}
                    />
                    <p className="text-xs text-muted-foreground text-right">
                      {description.length}/2000
                    </p>
                  </div>

                  {/* File Upload */}
                  <div className="space-y-2">
                    <Label>Anhänge (optional, max. 3 Dateien)</Label>
                    <div className="flex flex-wrap gap-2">
                      {files.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted"
                        >
                          <span className="text-sm truncate max-w-[150px]">{file.name}</span>
                          <button
                            type="button"
                            onClick={() => removeFile(index)}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      {files.length < 3 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Datei hinzufügen
                        </Button>
                      )}
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      onChange={handleFileChange}
                      accept="image/*,.pdf,.doc,.docx"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={!description.trim() || creating}
                    className="w-full"
                  >
                    {creating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Wird gesendet...
                      </>
                    ) : (
                      "Anfrage absenden"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tickets">
            <div className="space-y-4">
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : userTickets.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <HelpCircle className="w-12 h-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">Keine Tickets</h3>
                    <p className="text-muted-foreground">
                      Du hast noch keine Support-Anfragen erstellt.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                userTickets.map((ticket) => {
                  const statusConfig = STATUS_CONFIG[ticket.status];
                  const categoryConfig = CATEGORIES.find((c) => c.value === ticket.category);

                  return (
                    <Card 
                      key={ticket.id} 
                      className="cursor-pointer hover:border-primary/50 transition-colors"
                      onClick={() => setSelectedTicket(ticket)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline" className="shrink-0">
                                {categoryConfig?.icon}
                                <span className="ml-1">{categoryConfig?.label}</span>
                              </Badge>
                              <Badge className={statusConfig.color}>
                                {statusConfig.icon}
                                <span className="ml-1">{statusConfig.label}</span>
                              </Badge>
                              {ticket.admin_notes && (
                                <Badge variant="secondary" className="gap-1">
                                  <MessageSquare className="w-3 h-3" />
                                  Antwort
                                </Badge>
                              )}
                            </div>
                            <h4 className="font-medium mb-1 truncate">{ticket.subject}</h4>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {ticket.description}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(ticket.created_at), "dd. MMM yyyy", { locale: de })}
                            </p>
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Ticket Detail Dialog */}
        <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-primary" />
                Ticket Details
              </DialogTitle>
            </DialogHeader>
            
            {selectedTicket && (
              <div className="flex-1 overflow-hidden flex flex-col">
                {/* Ticket Info */}
                <div className="space-y-3 pb-4 border-b">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={STATUS_CONFIG[selectedTicket.status].color}>
                      {STATUS_CONFIG[selectedTicket.status].icon}
                      <span className="ml-1">{STATUS_CONFIG[selectedTicket.status].label}</span>
                    </Badge>
                    <Badge variant="outline">
                      {CATEGORIES.find(c => c.value === selectedTicket.category)?.icon}
                      <span className="ml-1">{CATEGORIES.find(c => c.value === selectedTicket.category)?.label}</span>
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(selectedTicket.created_at), "dd.MM.yyyy HH:mm", { locale: de })}
                    </span>
                  </div>
                  <h4 className="font-semibold">{selectedTicket.subject}</h4>
                  <p className="text-sm text-muted-foreground">{selectedTicket.description}</p>
                </div>

                {/* Chat Messages */}
                <div className="flex-1 overflow-y-auto py-4">
                  <TicketChat 
                    messages={messages} 
                    loading={messagesLoading} 
                    currentUserId={user.id} 
                  />
                </div>

                {/* Reply Input */}
                {selectedTicket.status !== "closed" && (
                  <div className="pt-4 border-t">
                    <div className="flex gap-2">
                      <Input
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                        placeholder="Antwort schreiben..."
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSendReply();
                          }
                        }}
                        disabled={sending}
                      />
                      <Button 
                        onClick={handleSendReply} 
                        disabled={!replyMessage.trim() || sending}
                        size="icon"
                      >
                        {sending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Drücke Enter zum Senden
                    </p>
                  </div>
                )}

                {selectedTicket.status === "closed" && (
                  <div className="pt-4 border-t text-center">
                    <p className="text-sm text-muted-foreground">
                      Dieses Ticket ist geschlossen. Erstelle ein neues Ticket für weitere Hilfe.
                    </p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default Support;
