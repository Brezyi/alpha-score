import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  HelpCircle, 
  Camera, 
  Target, 
  TrendingUp, 
  Heart, 
  MessageSquare,
  Users,
  Sparkles,
  ChevronRight,
  Play,
  BookOpen,
  Lightbulb,
  ArrowRight,
  Zap,
  Trophy,
  CheckCircle2
} from "lucide-react";
import { cn } from "@/lib/utils";

interface HelpCenterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStartTour: () => void;
}

type TabId = "quickstart" | "features" | "faq";

const TABS = [
  { id: "quickstart" as TabId, label: "Schnellstart", icon: Play },
  { id: "features" as TabId, label: "Features", icon: BookOpen },
  { id: "faq" as TabId, label: "FAQ", icon: Lightbulb },
];

const QUICKSTART_STEPS = [
  {
    step: 1,
    icon: Camera,
    title: "Fotos hochladen",
    description: "Lade 3 Fotos hoch: frontal, seitlich und ganzkörper. Unsere KI analysiert über 50 Gesichtsmerkmale.",
    gradient: "from-blue-500 to-cyan-400",
    bgGlow: "bg-blue-500/20",
  },
  {
    step: 2,
    icon: TrendingUp,
    title: "Score & Analyse erhalten",
    description: "Du erhältst einen objektiven Score, siehst dein Potential und verstehst deine Stärken und Verbesserungsmöglichkeiten.",
    gradient: "from-primary to-emerald-400",
    bgGlow: "bg-primary/20",
  },
  {
    step: 3,
    icon: Target,
    title: "Personalisierten Plan umsetzen",
    description: "Folge deinem maßgeschneiderten Plan mit konkreten, wissenschaftlich fundierten Schritten für sichtbare Verbesserungen.",
    gradient: "from-amber-500 to-orange-400",
    bgGlow: "bg-amber-500/20",
  },
];

const FEATURES = [
  {
    icon: Camera,
    title: "KI-Analyse",
    description: "Objektive Bewertung basierend auf wissenschaftlichen Proportionen",
    href: "/upload",
    gradient: "from-blue-500 to-cyan-400",
  },
  {
    icon: Target,
    title: "Persönlicher Plan",
    description: "Maßgeschneiderte Empfehlungen für alle Bereiche",
    href: "/plan",
    gradient: "from-primary to-emerald-400",
  },
  {
    icon: Heart,
    title: "Lifestyle Tracking",
    description: "Tracke Schlaf, Wasser, Ernährung und mehr",
    href: "/lifestyle",
    gradient: "from-pink-500 to-rose-400",
  },
  {
    icon: TrendingUp,
    title: "Fortschritt",
    description: "Verfolge deine Entwicklung über Zeit",
    href: "/progress",
    gradient: "from-violet-500 to-purple-400",
  },
  {
    icon: MessageSquare,
    title: "AI Coach",
    description: "Persönlicher Assistent für alle Fragen",
    href: "/coach",
    gradient: "from-amber-500 to-orange-400",
  },
  {
    icon: Users,
    title: "Community",
    description: "Verbinde dich mit Freunden",
    href: "/friends",
    gradient: "from-teal-500 to-cyan-400",
  },
];

const FAQ_ITEMS = [
  {
    question: "Wie genau ist die KI-Analyse?",
    answer: "Die KI analysiert über 50 Gesichtsmerkmale basierend auf wissenschaftlich belegten Attraktivitäts-Standards. Die Genauigkeit liegt bei etwa 85-90% im Vergleich zu menschlichen Bewertungen.",
    icon: Zap,
  },
  {
    question: "Wie oft sollte ich eine Analyse machen?",
    answer: "Wir empfehlen eine neue Analyse alle 4-8 Wochen, um deinen Fortschritt zu tracken. Zu häufige Analysen zeigen keine signifikanten Änderungen.",
    icon: Target,
  },
  {
    question: "Sind meine Fotos sicher?",
    answer: "Ja! Deine Fotos werden verschlüsselt gespeichert und niemals an Dritte weitergegeben. Du kannst sie jederzeit vollständig löschen.",
    icon: CheckCircle2,
  },
  {
    question: "Was bringt Premium?",
    answer: "Mit Premium erhältst du unbegrenzte Analysen, detaillierte Ergebnisse, den AI Coach, alle Lifestyle-Tracker und den personalisierten Plan.",
    icon: Trophy,
  },
  {
    question: "Kann ich meinen Score verbessern?",
    answer: "Ja! Die meisten Nutzer verbessern ihren Score um 0.5-2 Punkte innerhalb von 3-6 Monaten durch konsequente Umsetzung des Plans.",
    icon: TrendingUp,
  },
];

export function HelpCenterDialog({ open, onOpenChange, onStartTour }: HelpCenterDialogProps) {
  const [activeTab, setActiveTab] = useState<TabId>("quickstart");
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const navigate = useNavigate();

  const handleStartTour = () => {
    onOpenChange(false);
    setTimeout(() => {
      onStartTour();
    }, 300);
  };

  const handleNavigate = (href: string) => {
    onOpenChange(false);
    setTimeout(() => navigate(href), 200);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[85vh] overflow-hidden flex flex-col p-0 gap-0 bg-background/95 backdrop-blur-xl border-border/50">
        {/* Decorative header gradient */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />
        
        <DialogHeader className="p-4 pb-2 relative">
          <DialogTitle className="flex items-center gap-3">
            <motion.div 
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/30"
            >
              <HelpCircle className="w-5 h-5 text-primary-foreground" />
            </motion.div>
            <div>
              <span className="text-lg font-bold">Hilfe-Center</span>
              <p className="text-xs text-muted-foreground font-normal">Alles was du wissen musst</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Enhanced Tabs */}
        <div className="px-4 pb-3">
          <div className="flex gap-1 p-1 bg-muted/50 backdrop-blur-sm rounded-xl border border-border/30">
            {TABS.map((tab, index) => (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200",
                  activeTab === tab.id
                    ? "bg-background shadow-md text-foreground border border-border/50"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                )}
              >
                <tab.icon className={cn(
                  "w-4 h-4 transition-colors",
                  activeTab === tab.id && "text-primary"
                )} />
                <span>{tab.label}</span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          <AnimatePresence mode="wait">
            {activeTab === "quickstart" && (
              <motion.div
                key="quickstart"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {/* Hero text */}
                <div className="text-center py-2">
                  <p className="text-sm text-muted-foreground">
                    In <span className="text-primary font-semibold">3 einfachen Schritten</span> zu deinem besten Selbst
                  </p>
                </div>

                {/* Steps with connecting line */}
                <div className="relative space-y-3">
                  {/* Connecting line */}
                  <div className="absolute left-[23px] top-8 bottom-8 w-0.5 bg-gradient-to-b from-blue-500 via-primary to-amber-500 rounded-full" />
                  
                  {QUICKSTART_STEPS.map((item, index) => (
                    <motion.div
                      key={item.step}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="relative flex items-start gap-4 p-4 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/30 hover:border-border/60 transition-colors"
                    >
                      {/* Step number with gradient */}
                      <div className={cn(
                        "relative z-10 w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                        "bg-gradient-to-br shadow-lg",
                        item.gradient
                      )}>
                        <item.icon className="w-6 h-6 text-white" />
                      </div>
                      
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                            Schritt {item.step}
                          </span>
                        </div>
                        <h4 className="font-bold text-base mb-1">{item.title}</h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Tour Button */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <Button
                    onClick={handleStartTour}
                    className="w-full h-12 gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/20"
                  >
                    <Sparkles className="w-5 h-5" />
                    <span className="font-semibold">Interaktive Tour starten</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </motion.div>
              </motion.div>
            )}

            {activeTab === "features" && (
              <motion.div
                key="features"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-2 gap-2"
              >
                {FEATURES.map((feature, index) => (
                  <motion.button
                    key={feature.title}
                    onClick={() => handleNavigate(feature.href)}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="group p-4 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/30 hover:border-primary/30 hover:bg-card/80 transition-all duration-200 text-left"
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center mb-3",
                      "bg-gradient-to-br shadow-md",
                      feature.gradient
                    )}>
                      <feature.icon className="w-5 h-5 text-white" />
                    </div>
                    <h4 className="font-semibold text-sm mb-1 group-hover:text-primary transition-colors">
                      {feature.title}
                    </h4>
                    <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                      {feature.description}
                    </p>
                    <ChevronRight className="w-4 h-4 mt-2 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </motion.button>
                ))}
              </motion.div>
            )}

            {activeTab === "faq" && (
              <motion.div
                key="faq"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="space-y-2"
              >
                {FAQ_ITEMS.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="rounded-2xl bg-card/50 backdrop-blur-sm border border-border/30 overflow-hidden"
                  >
                    <button
                      onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                      className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/30 transition-colors"
                    >
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                        expandedFaq === index ? "bg-primary/20" : "bg-muted"
                      )}>
                        <item.icon className={cn(
                          "w-4 h-4 transition-colors",
                          expandedFaq === index ? "text-primary" : "text-muted-foreground"
                        )} />
                      </div>
                      <span className="flex-1 font-medium text-sm">{item.question}</span>
                      <ChevronRight
                        className={cn(
                          "w-4 h-4 text-muted-foreground transition-transform duration-200",
                          expandedFaq === index && "rotate-90"
                        )}
                      />
                    </button>
                    <AnimatePresence>
                      {expandedFaq === index && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 pt-0">
                            <div className="pl-11 pr-2">
                              <p className="text-sm text-muted-foreground leading-relaxed">
                                {item.answer}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}

                {/* Support Link */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="pt-2"
                >
                  <button
                    onClick={() => handleNavigate("/support")}
                    className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl bg-gradient-to-r from-muted/50 to-muted/30 hover:from-muted hover:to-muted/50 border border-border/30 transition-all text-sm font-medium group"
                  >
                    <MessageSquare className="w-4 h-4 text-primary" />
                    <span>Noch Fragen? Zum Support-Center</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
