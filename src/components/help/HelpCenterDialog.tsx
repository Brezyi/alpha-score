import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  ExternalLink
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
    description: "Lade 3 Fotos hoch: frontal, seitlich und ganzkörper. Die KI analysiert deine Gesichtszüge.",
    color: "bg-primary/20 text-primary",
  },
  {
    step: 2,
    icon: TrendingUp,
    title: "Score erhalten",
    description: "Du erhältst einen objektiven Score und siehst dein Potential. Verstehe deine Stärken und Schwächen.",
    color: "bg-blue-500/20 text-blue-500",
  },
  {
    step: 3,
    icon: Target,
    title: "Plan umsetzen",
    description: "Folge deinem personalisierten Plan mit konkreten Schritten für sichtbare Verbesserungen.",
    color: "bg-success/20 text-success",
  },
];

const FEATURES = [
  {
    icon: Camera,
    title: "KI-Analyse",
    description: "Objektive Bewertung deiner Gesichtszüge basierend auf wissenschaftlichen Proportionen.",
    href: "/upload",
  },
  {
    icon: Target,
    title: "Persönlicher Plan",
    description: "Maßgeschneiderte Empfehlungen für Skincare, Haare, Fitness und mehr.",
    href: "/plan",
  },
  {
    icon: Heart,
    title: "Lifestyle Tracking",
    description: "Tracke Schlaf, Wasser, Ernährung und Supplements für optimale Ergebnisse.",
    href: "/lifestyle",
  },
  {
    icon: TrendingUp,
    title: "Fortschritt",
    description: "Verfolge deine Entwicklung über Zeit und schalte Achievements frei.",
    href: "/progress",
  },
  {
    icon: MessageSquare,
    title: "AI Coach",
    description: "Persönlicher Assistent für alle Fragen rund ums Looksmaxxing.",
    href: "/coach",
  },
  {
    icon: Users,
    title: "Community",
    description: "Verbinde dich mit Freunden und finde Accountability Partner.",
    href: "/friends",
  },
];

const FAQ_ITEMS = [
  {
    question: "Wie genau ist die KI-Analyse?",
    answer: "Die KI analysiert über 50 Gesichtsmerkmale basierend auf wissenschaftlich belegten Attraktivitäts-Standards. Die Genauigkeit liegt bei etwa 85-90% im Vergleich zu menschlichen Bewertungen.",
  },
  {
    question: "Wie oft sollte ich eine Analyse machen?",
    answer: "Wir empfehlen eine neue Analyse alle 4-8 Wochen, um deinen Fortschritt zu tracken. Zu häufige Analysen zeigen keine signifikanten Änderungen.",
  },
  {
    question: "Sind meine Fotos sicher?",
    answer: "Ja! Deine Fotos werden verschlüsselt gespeichert und niemals an Dritte weitergegeben. Du kannst sie jederzeit löschen.",
  },
  {
    question: "Was bringt Premium?",
    answer: "Mit Premium erhältst du unbegrenzte Analysen, detaillierte Ergebnisse, den AI Coach, alle Lifestyle-Tracker und den personalisierten Plan.",
  },
  {
    question: "Kann ich meinen Score wirklich verbessern?",
    answer: "Ja! Die meisten Nutzer verbessern ihren Score um 0.5-2 Punkte innerhalb von 3-6 Monaten durch konsequente Umsetzung des Plans.",
  },
];

export function HelpCenterDialog({ open, onOpenChange, onStartTour }: HelpCenterDialogProps) {
  const [activeTab, setActiveTab] = useState<TabId>("quickstart");
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const handleStartTour = () => {
    onOpenChange(false);
    // Small delay to let dialog close
    setTimeout(() => {
      onStartTour();
    }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <HelpCircle className="w-4 h-4 text-primary" />
            </div>
            Hilfe-Center
          </DialogTitle>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-muted rounded-lg">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-xs sm:text-sm font-medium transition-all",
                activeTab === tab.id
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <tab.icon className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto pr-1 -mr-1">
          <AnimatePresence mode="wait">
            {activeTab === "quickstart" && (
              <motion.div
                key="quickstart"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4 py-2"
              >
                <p className="text-sm text-muted-foreground">
                  So funktioniert Glowmaxxed in 3 einfachen Schritten:
                </p>

                <div className="space-y-3">
                  {QUICKSTART_STEPS.map((item) => (
                    <div
                      key={item.step}
                      className="flex items-start gap-3 p-3 rounded-xl bg-muted/50"
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                        item.color
                      )}>
                        <item.icon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-primary">
                            Schritt {item.step}
                          </span>
                        </div>
                        <h4 className="font-semibold text-sm">{item.title}</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={handleStartTour}
                  className="w-full gap-2"
                  variant="outline"
                >
                  <Sparkles className="w-4 h-4" />
                  Interaktive Tour starten
                </Button>
              </motion.div>
            )}

            {activeTab === "features" && (
              <motion.div
                key="features"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-2 py-2"
              >
                {FEATURES.map((feature) => (
                  <a
                    key={feature.title}
                    href={feature.href}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/70 transition-colors group"
                  >
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <feature.icon className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm">{feature.title}</h4>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {feature.description}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </a>
                ))}
              </motion.div>
            )}

            {activeTab === "faq" && (
              <motion.div
                key="faq"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-2 py-2"
              >
                {FAQ_ITEMS.map((item, index) => (
                  <div
                    key={index}
                    className="border border-border rounded-xl overflow-hidden"
                  >
                    <button
                      onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                      className="w-full flex items-center justify-between p-3 text-left hover:bg-muted/50 transition-colors"
                    >
                      <span className="font-medium text-sm pr-2">{item.question}</span>
                      <ChevronRight
                        className={cn(
                          "w-4 h-4 shrink-0 text-muted-foreground transition-transform",
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
                          className="overflow-hidden"
                        >
                          <p className="px-3 pb-3 text-sm text-muted-foreground">
                            {item.answer}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}

                <a
                  href="/support"
                  className="flex items-center justify-center gap-2 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors text-sm font-medium"
                >
                  <ExternalLink className="w-4 h-4" />
                  Zum Support-Center
                </a>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
