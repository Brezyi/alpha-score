import { useRef, useEffect } from "react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Shield, User, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TicketMessage } from "@/hooks/useTicketMessages";

interface TicketChatProps {
  messages: TicketMessage[];
  loading: boolean;
  currentUserId: string;
}

export function TicketChat({ messages, loading, currentUserId }: TicketChatProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
        <User className="w-8 h-8 mb-2 opacity-50" />
        <p className="text-sm">Noch keine Nachrichten</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
      {messages.map((msg) => {
        const isOwn = msg.sender_id === currentUserId;
        const isAdmin = msg.is_admin;

        return (
          <div
            key={msg.id}
            className={cn(
              "flex gap-3",
              isOwn ? "flex-row-reverse" : "flex-row"
            )}
          >
            <Avatar className={cn(
              "w-8 h-8 shrink-0",
              isAdmin ? "bg-primary/20" : "bg-muted"
            )}>
              <AvatarFallback className={cn(
                isAdmin ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
              )}>
                {isAdmin ? <Shield className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </AvatarFallback>
            </Avatar>

            <div className={cn(
              "flex flex-col max-w-[75%]",
              isOwn ? "items-end" : "items-start"
            )}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium">
                  {isAdmin ? "Support-Team" : "Du"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(msg.created_at), "dd.MM. HH:mm", { locale: de })}
                </span>
              </div>
              <div className={cn(
                "px-4 py-2.5 rounded-2xl text-sm",
                isOwn
                  ? "bg-primary text-primary-foreground rounded-br-md"
                  : isAdmin
                    ? "bg-primary/10 border border-primary/20 rounded-bl-md"
                    : "bg-muted rounded-bl-md"
              )}>
                <p className="whitespace-pre-wrap">{msg.message}</p>
              </div>
            </div>
          </div>
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
}
