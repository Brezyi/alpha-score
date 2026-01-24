import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { useCoachHistory } from "@/hooks/useCoachHistory";
import { ConversationSidebar } from "@/components/coach/ConversationSidebar";
import { CrisisHotlineCard } from "@/components/coach/CrisisHotlineCard";
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
  MicOff,
  Plus
} from "lucide-react";
import { cn } from "@/lib/utils";

// Keywords that trigger crisis hotline display
const CRISIS_KEYWORDS = [
  'depression', 'depressionen', 'depressiv', 'deprimiert',
  'suizid', 'selbstmord', 'umbringen', 'sterben wollen', 'nicht mehr leben',
  'selbstverletzung', 'ritzen', 'cutting',
  'essstörung', 'magersucht', 'bulimie', 'anorexie',
  'panikattacke', 'angststörung',
  'hoffnungslos', 'keinen sinn', 'aufgeben'
];

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

interface UserAnalysis {
  looks_score: number | null;
  weaknesses: string[] | null;
  priorities: string[] | null;
}

export default function Coach() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechPreview, setSpeechPreview] = useState("");
  const [userAnalysis, setUserAnalysis] = useState<UserAnalysis | null>(null);
  const [showCrisisHotline, setShowCrisisHotline] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([
    "Was sollte ich zuerst verbessern?",
    "Skincare Routine für Anfänger",
    "Wie verbessere ich meine Jawline?",
  ]);
  const { user, loading } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const speechHeardRef = useRef(false);
  const speechPreviewRef = useRef("");
  const hasLoadedAnalysis = useRef(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isPremium, loading: subscriptionLoading, createCheckout } = useSubscription();

  // Check for crisis keywords in messages
  const checkForCrisisKeywords = useCallback((text: string) => {
    const lowerText = text.toLowerCase();
    return CRISIS_KEYWORDS.some(keyword => lowerText.includes(keyword));
  }, []);
  
  // Chat history
  const {
    conversations,
    archivedConversations,
    currentConversationId,
    setCurrentConversationId,
    loadMessages,
    createConversation,
    saveMessage,
    deleteConversation,
    deleteAllConversations,
    archiveConversation,
    unarchiveConversation,
    renameConversation
  } = useCoachHistory();

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
      speechHeardRef.current = true;
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
        setSpeechPreview("");
        speechPreviewRef.current = "";
        const cleaned = finalTranscript.trim();
        if (!cleaned) return;
        setInput(prev => (prev.trim().length ? `${prev.trimEnd()} ` : "") + cleaned);
      } else if (interimTranscript) {
        const preview = interimTranscript.trim();
        speechPreviewRef.current = preview;
        setSpeechPreview(preview);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      setSpeechPreview("");

      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        toast({
          title: "Mikrofon blockiert",
          description: "Bitte erlaube den Zugriff auf dein Mikrofon (Browser-Popup oder Mikrofon-Symbol in der Adressleiste).",
          variant: "destructive",
        });
      } else if (event.error === 'no-speech') {
        toast({
          title: "Keine Sprache erkannt",
          description: "Bitte sprich lauter / näher ans Mikrofon und versuche es erneut.",
          variant: "destructive",
        });
      } else if (event.error === 'audio-capture') {
        toast({
          title: "Mikrofon nicht verfügbar",
          description: "Kein Audio-Eingang gefunden oder von einer anderen App belegt.",
          variant: "destructive",
        });
      } else if (event.error === 'network') {
        toast({
          title: "Spracherkennung-Problem",
          description: "Netzwerk-/Service-Fehler. Bitte kurz warten und erneut versuchen.",
          variant: "destructive",
        });
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      // If we only got interim results, commit them when the user stops recording
      const preview = speechPreviewRef.current.trim();
      if (preview) {
        setInput(prev => (prev.trim().length ? `${prev.trimEnd()} ` : "") + preview);
      }
      speechPreviewRef.current = "";
      setSpeechPreview("");

      if (!speechHeardRef.current && !preview) {
        toast({
          title: "Keine Transkription",
          description: "Wenn nichts passiert: nutze Chrome/Edge (Firefox/iOS kann Probleme machen).",
          variant: "destructive",
        });
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [isSpeechSupported, toast]);

  const toggleListening = useCallback(() => {
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
      setSpeechPreview("");
    } else {
      try {
        // IMPORTANT: start() should happen directly in the click handler (user gesture)
        speechHeardRef.current = false;
        setSpeechPreview("");
        recognitionRef.current.start();
        setIsListening(true);

        // Also trigger mic permission prompt when needed
        if (navigator.mediaDevices?.getUserMedia) {
          void navigator.mediaDevices
            .getUserMedia({ audio: true })
            .then((stream) => {
              stream.getTracks().forEach((track) => track.stop());
            })
            .catch((error: any) => {
              console.error('Microphone permission error:', error);
              recognitionRef.current?.stop();
              setIsListening(false);

              if (error?.name === 'NotAllowedError' || error?.name === 'PermissionDeniedError') {
                toast({
                  title: "Mikrofon-Zugriff benötigt",
                  description: "Bitte erlaube Mikrofonzugriff (Browser-Popup oder Mikrofon-Symbol in der Adressleiste).",
                  variant: "destructive",
                });
              } else if (error?.name === 'NotFoundError') {
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
            });
        }
      } catch (error) {
        console.error('Failed to start speech recognition:', error);
        toast({
          title: "Fehler",
          description: "Spracherkennung konnte nicht gestartet werden.",
          variant: "destructive",
        });
      }
    }
  }, [isListening, toast]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  // Load user analysis and create personalized greeting
  useEffect(() => {
    if (!user || !isPremium || hasLoadedAnalysis.current) return;
    
    const loadAnalysisAndGreet = async () => {
      hasLoadedAnalysis.current = true;
      
      const { data: analysis } = await supabase
        .from('analyses')
        .select('looks_score, weaknesses, priorities')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (analysis) {
        setUserAnalysis(analysis);
        
        // Generate personalized suggestions from weaknesses
        if (analysis.weaknesses?.length) {
          const personalSuggestions = analysis.weaknesses.slice(0, 3).map(
            (weakness: string) => `Wie verbessere ich ${weakness}?`
          );
          setSuggestions(personalSuggestions);
        }
        
        // Only set greeting if no conversation is loaded
        if (!currentConversationId) {
          const topWeakness = analysis.weaknesses?.[0];
          const greeting = topWeakness 
            ? `Score: ${analysis.looks_score}/10. Dein größtes Potenzial: **${topWeakness}**. Was willst du wissen?`
            : `Score: ${analysis.looks_score}/10. Frag mich, was du verbessern kannst.`;
          
          setMessages([{ role: "assistant", content: greeting }]);
        }
      }
    };
    
    loadAnalysisAndGreet();
  }, [user, isPremium, currentConversationId]);

  // Load conversation when selected
  useEffect(() => {
    if (currentConversationId) {
      loadMessages(currentConversationId).then((msgs) => {
        setMessages(msgs);
      });
    }
  }, [currentConversationId, loadMessages]);

  // Handle new conversation
  const handleNewConversation = useCallback(async () => {
    setCurrentConversationId(null);
    
    // Reset to greeting
    if (userAnalysis) {
      const topWeakness = userAnalysis.weaknesses?.[0];
      const greeting = topWeakness 
        ? `Score: ${userAnalysis.looks_score}/10. Dein größtes Potenzial: **${topWeakness}**. Was willst du wissen?`
        : `Score: ${userAnalysis.looks_score}/10. Frag mich, was du verbessern kannst.`;
      setMessages([{ role: "assistant", content: greeting }]);
    } else {
      setMessages([]);
    }
  }, [setCurrentConversationId, userAnalysis]);

  // Handle conversation selection
  const handleSelectConversation = useCallback(async (id: string) => {
    setCurrentConversationId(id);
  }, [setCurrentConversationId]);

  // Handle conversation deletion
  const handleDeleteConversation = useCallback(async (id: string) => {
    await deleteConversation(id);
    toast({ title: "Gespräch gelöscht" });
  }, [deleteConversation, toast]);

  // Handle delete all
  const handleDeleteAllConversations = useCallback(async () => {
    await deleteAllConversations();
    toast({ title: "Alle Gespräche gelöscht" });
  }, [deleteAllConversations, toast]);

  // Handle archive
  const handleArchiveConversation = useCallback(async (id: string) => {
    await archiveConversation(id);
    toast({ title: "Gespräch archiviert" });
  }, [archiveConversation, toast]);

  // Handle unarchive
  const handleUnarchiveConversation = useCallback(async (id: string) => {
    await unarchiveConversation(id);
    toast({ title: "Gespräch wiederhergestellt" });
  }, [unarchiveConversation, toast]);

  // Handle rename
  const handleRenameConversation = useCallback(async (id: string, newTitle: string) => {
    await renameConversation(id, newTitle);
    toast({ title: "Gespräch umbenannt" });
  }, [renameConversation, toast]);

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
    // Check for crisis keywords in user message
    if (checkForCrisisKeywords(userMessage)) {
      setShowCrisisHotline(true);
    }

    const newMessages: Message[] = [...messages, { role: "user", content: userMessage }];
    setMessages(newMessages);
    setIsLoading(true);

    // Create or get conversation ID
    let convId = currentConversationId;
    if (!convId) {
      convId = await createConversation();
      if (convId) {
        setCurrentConversationId(convId);
      }
    }

    // Save user message
    if (convId) {
      await saveMessage(convId, "user", userMessage);
    }

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

      // Ensure streaming is marked as complete and save assistant message
      setMessages(prev => {
        const updated = [...prev];
        if (updated.length > 0 && updated[updated.length - 1].role === "assistant") {
          updated[updated.length - 1] = { ...updated[updated.length - 1], isStreaming: false };
        }
        return updated;
      });

      // Save assistant message after streaming complete
      if (convId && assistantContent) {
        await saveMessage(convId, "assistant", assistantContent);
        
        // Check for crisis keywords in AI response
        if (checkForCrisisKeywords(assistantContent)) {
          setShowCrisisHotline(true);
        }
      }

    } catch (error: any) {
      if (error.name === "AbortError") {
        // User cancelled, still save partial response if any
        if (convId && assistantContent) {
          await saveMessage(convId, "assistant", assistantContent);
        }
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
  }, [messages, toast, currentConversationId, createConversation, setCurrentConversationId, saveMessage]);

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
          <div className="flex items-center gap-2">
            <button 
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Zurück</span>
            </button>
          </div>
          <h1 className="text-lg font-bold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            AI Coach
          </h1>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNewConversation}
              title="Neues Gespräch"
            >
              <Plus className="w-5 h-5" />
            </Button>
            <ConversationSidebar
              conversations={conversations}
              archivedConversations={archivedConversations}
              currentConversationId={currentConversationId}
              onSelectConversation={handleSelectConversation}
              onNewConversation={handleNewConversation}
              onDeleteConversation={handleDeleteConversation}
              onDeleteAllConversations={handleDeleteAllConversations}
              onArchiveConversation={handleArchiveConversation}
              onUnarchiveConversation={handleUnarchiveConversation}
              onRenameConversation={handleRenameConversation}
            />
          </div>
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 py-6 max-w-2xl space-y-4">
          {messages.length <= 1 && (
            <div className="text-center py-8 animate-fade-in">
              {messages.length === 0 && (
                <div className="glass-card p-8 rounded-2xl max-w-md mx-auto">
                  {/* Clean gradient avatar */}
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/20">
                    <Bot className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <h2 className="text-xl font-bold mb-2">Coach Alex</h2>
                  <p className="text-sm text-muted-foreground mb-1">Dein Personal Trainer für Looks</p>
                  <p className="text-muted-foreground max-w-sm mx-auto text-sm">
                    {userAnalysis 
                      ? `Score: ${userAnalysis.looks_score}/10 • Los geht's, Champ!`
                      : "Bereit zum Grinden?"
                    }
                  </p>
                </div>
              )}
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {suggestions.map((suggestion, idx) => (
                  <button
                    key={suggestion}
                    onClick={() => {
                      setInput(suggestion);
                      textareaRef.current?.focus();
                    }}
                    className="px-4 py-2.5 text-sm rounded-xl bg-card border border-border hover:border-primary/50 hover:bg-primary/5 transition-colors"
                    style={{ animationDelay: `${idx * 75}ms` }}
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
                "flex gap-3 animate-fade-in",
                message.role === "user" ? "justify-end" : "justify-start"
              )}
              style={{ animationDelay: `${Math.min(i * 50, 200)}ms` }}
            >
              {message.role === "assistant" && (
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center flex-shrink-0 shadow-md shadow-primary/20">
                  <Bot className="w-5 h-5 text-primary-foreground" />
                </div>
              )}
              <div
                className={cn(
                  "max-w-[85%] px-4 py-3",
                  message.role === "user"
                    ? "bg-primary text-primary-foreground rounded-2xl rounded-br-md shadow-sm"
                    : "bg-muted rounded-2xl rounded-bl-md"
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
                          <span className="inline-block w-1.5 h-4 ml-0.5 bg-primary/70 rounded-sm animate-[pulse_1s_ease-in-out_infinite]" />
                        )}
                      </>
                    ) : (
                      <span className="inline-flex gap-1.5 py-1 items-center">
                        <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-[pulse_1.2s_ease-in-out_infinite]" />
                        <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-[pulse_1.2s_ease-in-out_0.2s_infinite]" />
                        <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-[pulse_1.2s_ease-in-out_0.4s_infinite]" />
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
                <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-secondary-foreground" />
                </div>
              )}
            </div>
          ))}
          
          {/* Crisis Hotline Card */}
          {showCrisisHotline && (
            <CrisisHotlineCard onDismiss={() => setShowCrisisHotline(false)} />
          )}
          
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
                variant={isListening ? "destructive" : "outline"}
                className="h-12 w-12 flex-shrink-0 transition-colors"
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
            <div className="mt-2 text-center animate-fade-in">
              <p className="text-xs text-destructive">
                🎙️ Sprich jetzt… Tippe auf das Mikrofon zum Beenden
              </p>
              {speechPreview && (
                <p className="text-xs text-muted-foreground mt-1 italic">
                  "{speechPreview}"
                </p>
              )}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
