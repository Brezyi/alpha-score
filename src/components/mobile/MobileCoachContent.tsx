import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { 
  Send, 
  Bot, 
  User, 
  Sparkles,
  Mic,
  MicOff,
  Square,
  Plus,
  MoreVertical,
  MessageSquare
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Haptics, ImpactStyle } from "@capacitor/haptics";

interface Message {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
}

interface MobileCoachContentProps {
  messages: Message[];
  isLoading: boolean;
  isListening: boolean;
  speechSupported: boolean;
  suggestions: string[];
  onSend: (message: string) => void;
  onStopStreaming: () => void;
  onToggleListening: () => void;
  onNewConversation: () => void;
}

export const MobileCoachContent = ({
  messages,
  isLoading,
  isListening,
  speechSupported,
  suggestions,
  onSend,
  onStopStreaming,
  onToggleListening,
  onNewConversation
}: MobileCoachContentProps) => {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch {}
    
    onSend(input.trim());
    setInput("");
    
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestionClick = async (suggestion: string) => {
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch {}
    onSend(suggestion);
  };

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + "px";
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Welcome State */}
        {messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-8"
          >
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Bot className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-lg font-bold mb-2">AI Looksmax Coach</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Frag mich alles über Skincare, Style und Selbstverbesserung
            </p>
          </motion.div>
        )}

        {/* Messages */}
        <AnimatePresence mode="popLayout">
          {messages.map((message, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={cn(
                "flex gap-3",
                message.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {message.role === "assistant" && (
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
              )}
              
              <div className={cn(
                "max-w-[85%] rounded-2xl px-4 py-3",
                message.role === "user"
                  ? "bg-primary text-primary-foreground rounded-br-sm"
                  : "bg-card border border-border rounded-bl-sm"
              )}>
                {message.role === "assistant" ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-headings:my-2">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {message.content || (message.isStreaming ? "..." : "")}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                )}
              </div>

              {message.role === "user" && (
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-primary-foreground" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing Indicator */}
        {isLoading && !messages[messages.length - 1]?.isStreaming && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-3"
          >
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Bot className="w-4 h-4 text-primary" />
            </div>
            <div className="bg-card border border-border rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex gap-1">
                <motion.div
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                  className="w-2 h-2 rounded-full bg-primary"
                />
                <motion.div
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                  className="w-2 h-2 rounded-full bg-primary"
                />
                <motion.div
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                  className="w-2 h-2 rounded-full bg-primary"
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* Suggestions */}
        {messages.length <= 1 && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-2"
          >
            <p className="text-xs text-muted-foreground text-center">
              Probier eine dieser Fragen:
            </p>
            {suggestions.map((suggestion, i) => (
              <motion.button
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full p-3 rounded-xl bg-card border border-border text-left text-sm hover:bg-accent/50 active:scale-[0.98] transition-all"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary flex-shrink-0" />
                  <span>{suggestion}</span>
                </div>
              </motion.button>
            ))}
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-border bg-background p-4 safe-area-bottom">
        <div className="flex items-end gap-2">
          {/* New Chat Button */}
          <button
            onClick={onNewConversation}
            className="p-2.5 rounded-full bg-card border border-border hover:bg-accent/50 transition-colors flex-shrink-0"
          >
            <Plus className="w-5 h-5" />
          </button>

          {/* Input */}
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                adjustTextareaHeight();
              }}
              onKeyDown={handleKeyDown}
              placeholder="Schreib eine Nachricht..."
              className="min-h-[44px] max-h-[120px] resize-none pr-12 rounded-2xl bg-card border-border"
              rows={1}
              disabled={isLoading}
            />
            
            {/* Voice Button */}
            {speechSupported && !input.trim() && (
              <button
                onClick={onToggleListening}
                className={cn(
                  "absolute right-2 bottom-2 p-2 rounded-full transition-colors",
                  isListening 
                    ? "bg-red-500 text-white animate-pulse" 
                    : "bg-muted hover:bg-accent"
                )}
              >
                {isListening ? (
                  <MicOff className="w-4 h-4" />
                ) : (
                  <Mic className="w-4 h-4" />
                )}
              </button>
            )}
          </div>

          {/* Send/Stop Button */}
          {isLoading ? (
            <Button
              onClick={onStopStreaming}
              size="icon"
              variant="destructive"
              className="rounded-full h-11 w-11 flex-shrink-0"
            >
              <Square className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSend}
              disabled={!input.trim()}
              size="icon"
              className="rounded-full h-11 w-11 flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
