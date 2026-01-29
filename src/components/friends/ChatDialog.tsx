import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, Loader2, ArrowLeft } from "lucide-react";
import { useFriendMessages } from "@/hooks/useFriendMessages";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { containsForbiddenContent } from "@/lib/displayNameValidation";
import { useToast } from "@/hooks/use-toast";

interface ChatDialogProps {
  open: boolean;
  onClose: () => void;
  friendId: string;
  friendName: string | null;
  friendAvatar: string | null;
}

export function ChatDialog({ open, onClose, friendId, friendName, friendAvatar }: ChatDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { messages, loading, sending, sendMessage } = useFriendMessages(friendId);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSend = async () => {
    const trimmed = newMessage.trim();
    if (!trimmed || sending) return;
    
    // Filter für Beleidigungen und illegale Inhalte
    if (containsForbiddenContent(trimmed)) {
      toast({
        title: "Nachricht blockiert",
        description: "Deine Nachricht enthält unzulässige Inhalte und kann nicht gesendet werden.",
        variant: "destructive",
      });
      return;
    }
    
    const success = await sendMessage(trimmed);
    if (success) {
      setNewMessage("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md h-[80vh] flex flex-col p-0 gap-0 rounded-3xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b bg-card">
          <Button variant="ghost" size="icon" className="shrink-0" onClick={onClose}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <Avatar className="w-10 h-10">
            <AvatarImage src={friendAvatar || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {friendName?.[0]?.toUpperCase() || "?"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate">{friendName || "Chat"}</p>
            <p className="text-xs text-muted-foreground">Online</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/30">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Avatar className="w-16 h-16 mb-4">
                <AvatarImage src={friendAvatar || undefined} />
                <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                  {friendName?.[0]?.toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
              <p className="font-medium">{friendName}</p>
              <p className="text-sm text-muted-foreground mt-1">
                Starte die Unterhaltung!
              </p>
            </div>
          ) : (
            <>
              {messages.map((msg, index) => {
                const isMe = msg.sender_id === user?.id;
                const showDate = index === 0 || 
                  new Date(msg.created_at).toDateString() !== new Date(messages[index - 1].created_at).toDateString();

                return (
                  <div key={msg.id}>
                    {showDate && (
                      <div className="text-center my-4">
                        <span className="text-xs text-muted-foreground bg-background px-3 py-1 rounded-full">
                          {format(new Date(msg.created_at), "EEEE, d. MMMM", { locale: de })}
                        </span>
                      </div>
                    )}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn("flex", isMe ? "justify-end" : "justify-start")}
                    >
                      <div className={cn(
                        "max-w-[75%] rounded-2xl px-4 py-2.5",
                        isMe 
                          ? "bg-primary text-primary-foreground rounded-br-md" 
                          : "bg-card border border-border rounded-bl-md"
                      )}>
                        <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                        <p className={cn(
                          "text-[10px] mt-1",
                          isMe ? "text-primary-foreground/70" : "text-muted-foreground"
                        )}>
                          {format(new Date(msg.created_at), "HH:mm", { locale: de })}
                        </p>
                      </div>
                    </motion.div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input */}
        <div className="p-4 border-t bg-card">
          <div className="flex gap-2 items-end">
            <Textarea
              placeholder="Nachricht schreiben..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={sending}
              className="min-h-[44px] max-h-[120px] rounded-xl resize-none py-3"
              rows={1}
              inputMode="text"
              autoComplete="off"
              autoCorrect="on"
            />
            <Button 
              onClick={handleSend} 
              disabled={!newMessage.trim() || sending}
              className="h-11 w-11 rounded-xl shrink-0"
            >
              {sending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}