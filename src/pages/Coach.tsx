import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { 
  ArrowLeft, 
  Send, 
  Crown,
  Sparkles,
  User,
  Bot,
  Lock,
  Square,
  Mic,
  MicOff
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
}

// Web Speech API types
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

export default function Coach() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const { user, loading } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isPremium, loading: subscriptionLoading, createCheckout } = useSubscription();

  // Check if speech recognition is supported
  const isSpeechSupported = typeof window !== 'undefined' && 
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  // Initialize speech recognition
  useEffect(() => {
    if (!isSpeechSupported) return;

    const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognitionClass();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'de-DE';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      // Update input with transcript
      if (finalTranscript) {
        setInput(prev => prev + finalTranscript);
      } else if (interimTranscript) {
        // Show interim results in a temporary way
        setInput(prev => {
          // Remove previous interim and add new
          const baseText = prev.replace(/\[.*\]$/, '');
          return baseText + interimTranscript;
        });
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      if (event.error === 'not-allowed') {
        toast({
          title: "Mikrofon blockiert",
          description: "Bitte erlaube den Zugriff auf dein Mikrofon in den Browser-Einstellungen.",
          variant: "destructive",
        });
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [isSpeechSupported, toast]);

  const toggleListening = useCallback(async () => {
    if (!recognitionRef.current) {
      toast({
        title: "Nicht unterstützt",
        description: "Spracherkennung wird von deinem Browser nicht unterstützt. Versuche Chrome oder Edge.",
        variant: "destructive",
      });
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      // First request microphone permission explicitly
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Stop the stream immediately - we just needed permission
        stream.getTracks().forEach(track => track.stop());
        
        // Now start speech recognition
        recognitionRef.current.start();
        setIsListening(true);
        
        toast({
          title: "🎤 Mikrofon aktiv",
          description: "Sprich jetzt - ich höre zu!",
        });
      } catch (error: any) {
        console.error('Microphone permission error:', error);
        
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          toast({
            title: "Mikrofon-Zugriff benötigt",
            description: "Bitte klicke auf das Mikrofon-Symbol in der Adressleiste deines Browsers und erlaube den Zugriff.",
            variant: "destructive",
          });
        } else if (error.name === 'NotFoundError') {
          toast({
            title: "Kein Mikrofon gefunden",
            description: "Bitte schließe ein Mikrofon an oder prüfe deine Geräteeinstellungen.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Fehler",
            description: "Mikrofon konnte nicht aktiviert werden. Bitte prüfe deine Browser-Einstellungen.",
            variant: "destructive",
          });
        }
      }
    }
  }, [isListening, toast]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const stopStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
      // Mark the last message as no longer streaming
      setMessages(prev => {
        const updated = [...prev];
        if (updated.length > 0 && updated[updated.length - 1].role === "assistant") {
          updated[updated.length - 1] = { ...updated[updated.length - 1], isStreaming: false };
        }
        return updated;
      });
    }
  }, []);

  const streamChat = useCallback(async (userMessage: string) => {
    const newMessages: Message[] = [...messages, { role: "user", content: userMessage }];
    setMessages(newMessages);
    setIsLoading(true);

    // Create abort controller for this request
    abortControllerRef.current = new AbortController();

    let assistantContent = "";

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-coach`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ 
            messages: newMessages.map(m => ({ role: m.role, content: m.content }))
          }),
          signal: abortControllerRef.current.signal,
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Request failed: ${response.status}`);
      }

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      // Add empty assistant message with streaming indicator
      setMessages(prev => [...prev, { role: "assistant", content: "", isStreaming: true }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") {
            // Mark streaming as complete
            setMessages(prev => {
              const updated = [...prev];
              if (updated.length > 0) {
                updated[updated.length - 1] = { 
                  ...updated[updated.length - 1], 
                  isStreaming: false 
                };
              }
              return updated;
            });
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { 
                  role: "assistant", 
                  content: assistantContent,
                  isStreaming: true
                };
                return updated;
              });
            }
          } catch {
            // Partial JSON, wait for more data
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }

      // Ensure streaming is marked as complete
      setMessages(prev => {
        const updated = [...prev];
        if (updated.length > 0 && updated[updated.length - 1].role === "assistant") {
          updated[updated.length - 1] = { ...updated[updated.length - 1], isStreaming: false };
        }
        return updated;
      });

    } catch (error: any) {
      if (error.name === "AbortError") {
        // User cancelled, don't show error
        return;
      }
      console.error("Chat error:", error);
      toast({
        title: "Fehler",
        description: error.message || "Nachricht konnte nicht gesendet werden",
        variant: "destructive",
      });
      // Remove the user message if failed
      setMessages(messages);
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [messages, toast]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    setInput("");
    streamChat(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (subscriptionLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  // Premium gate
  if (!isPremium) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <button 
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Zurück</span>
            </button>
            <h1 className="text-lg font-bold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              AI Coach
            </h1>
            <div className="w-20" />
          </div>
        </header>

        <main className="container mx-auto px-4 py-12 max-w-md">
          <Card className="p-8 text-center bg-gradient-to-br from-primary/10 to-card border-primary/20">
            <Lock className="w-16 h-16 text-primary mx-auto mb-6" />
            <h2 className="text-2xl font-bold mb-3">Premium Feature</h2>
            <p className="text-muted-foreground mb-6">
              Der AI Coach ist ein exklusives Premium-Feature. Upgrade jetzt für personalisierte Looksmaxing-Beratung basierend auf deiner Analyse.
            </p>
            <Button 
              variant="hero" 
              size="lg" 
              className="w-full"
              onClick={() => createCheckout("premium")}
            >
              <Crown className="w-5 h-5" />
              Premium freischalten
            </Button>
            <p className="text-xs text-muted-foreground mt-4">
              Ab 9,99€/Monat • Jederzeit kündbar
            </p>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
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
          <h1 className="text-lg font-bold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            AI Coach
          </h1>
          <div className="w-20" />
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 py-6 max-w-2xl space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Bot className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-xl font-bold mb-2">Dein Looksmaxing Coach</h2>
              <p className="text-muted-foreground max-w-sm mx-auto">
                Ich kenne deine Analyse und gebe dir ehrliche, personalisierte Tipps. Frag mich alles!
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {[
                  "Was sollte ich zuerst verbessern?",
                  "Skincare Routine für Anfänger",
                  "Wie verbessere ich meine Jawline?",
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => {
                      setInput(suggestion);
                      textareaRef.current?.focus();
                    }}
                    className="px-3 py-2 text-sm rounded-full bg-card border border-border hover:border-primary/50 transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message, i) => (
            <div
              key={i}
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
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-3",
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-card border border-border"
                )}
              >
                {message.role === "assistant" ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-headings:my-2">
                    {message.content ? (
                      <>
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {message.content}
                        </ReactMarkdown>
                        {message.isStreaming && (
                          <span className="inline-block w-2 h-4 ml-1 bg-primary animate-pulse rounded-sm" />
                        )}
                      </>
                    ) : (
                      <span className="inline-flex gap-1 py-1">
                        <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      </span>
                    )}
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">
                    {message.content}
                  </p>
                )}
              </div>
              {message.role === "user" && (
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-muted-foreground" />
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input */}
      <div className="sticky bottom-0 bg-background border-t border-border">
        <form onSubmit={handleSubmit} className="container mx-auto px-4 py-4 max-w-2xl">
          <div className="flex gap-2">
            {/* Microphone Button */}
            {isSpeechSupported && (
              <Button
                type="button"
                size="icon"
                variant={isListening ? "default" : "outline"}
                className={cn(
                  "h-12 w-12 flex-shrink-0 transition-all",
                  isListening && "bg-destructive hover:bg-destructive/90 animate-pulse"
                )}
                onClick={toggleListening}
                disabled={isLoading}
              >
                {isListening ? (
                  <MicOff className="w-5 h-5" />
                ) : (
                  <Mic className="w-5 h-5" />
                )}
              </Button>
            )}
            
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isListening ? "Ich höre zu..." : "Schreib deine Frage..."}
              className={cn(
                "min-h-[48px] max-h-32 resize-none",
                isListening && "border-destructive"
              )}
              disabled={isLoading}
              rows={1}
            />
            {isLoading ? (
              <Button 
                type="button"
                size="icon" 
                variant="outline"
                className="h-12 w-12 flex-shrink-0"
                onClick={stopStreaming}
              >
                <Square className="w-4 h-4" />
              </Button>
            ) : (
              <Button 
                type="submit" 
                size="icon" 
                className="h-12 w-12 flex-shrink-0"
                disabled={!input.trim()}
              >
                <Send className="w-5 h-5" />
              </Button>
            )}
          </div>
          {isListening && (
            <p className="text-xs text-destructive mt-2 text-center animate-pulse">
              🎤 Sprich jetzt... Tippe auf das Mikrofon zum Beenden
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
