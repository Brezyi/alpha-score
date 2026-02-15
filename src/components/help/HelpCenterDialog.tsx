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
import { useLanguage } from "@/contexts/LanguageContext";

interface HelpCenterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStartTour: () => void;
}

type TabId = "quickstart" | "features" | "faq";

export function HelpCenterDialog({ open, onOpenChange, onStartTour }: HelpCenterDialogProps) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<TabId>("quickstart");
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const navigate = useNavigate();

  const TABS = [
    { id: "quickstart" as TabId, label: t("help.quickstart"), icon: Play },
    { id: "features" as TabId, label: t("help.features"), icon: BookOpen },
    { id: "faq" as TabId, label: t("help.faq"), icon: Lightbulb },
  ];

  const QUICKSTART_STEPS = [
    {
      step: 1,
      icon: Camera,
      title: t("help.step1Title"),
      description: t("help.step1Desc"),
      gradient: "from-blue-500 to-cyan-400",
      bgGlow: "bg-blue-500/20",
    },
    {
      step: 2,
      icon: TrendingUp,
      title: t("help.step2Title"),
      description: t("help.step2Desc"),
      gradient: "from-primary to-emerald-400",
      bgGlow: "bg-primary/20",
    },
    {
      step: 3,
      icon: Target,
      title: t("help.step3Title"),
      description: t("help.step3Desc"),
      gradient: "from-amber-500 to-orange-400",
      bgGlow: "bg-amber-500/20",
    },
  ];

  const FEATURES = [
    {
      icon: Camera,
      title: t("help.aiAnalysis"),
      description: t("help.aiAnalysisDesc"),
      href: "/upload",
      gradient: "from-blue-500 to-cyan-400",
    },
    {
      icon: Target,
      title: t("help.personalPlan"),
      description: t("help.personalPlanDesc"),
      href: "/plan",
      gradient: "from-primary to-emerald-400",
    },
    {
      icon: Heart,
      title: t("help.lifestyleTracking"),
      description: t("help.lifestyleTrackingDesc"),
      href: "/lifestyle",
      gradient: "from-pink-500 to-rose-400",
    },
    {
      icon: TrendingUp,
      title: t("help.progressTracking"),
      description: t("help.progressTrackingDesc"),
      href: "/progress",
      gradient: "from-violet-500 to-purple-400",
    },
    {
      icon: MessageSquare,
      title: t("help.aiCoach"),
      description: t("help.aiCoachDesc"),
      href: "/coach",
      gradient: "from-amber-500 to-orange-400",
    },
    {
      icon: Users,
      title: t("help.community"),
      description: t("help.communityDesc"),
      href: "/friends",
      gradient: "from-teal-500 to-cyan-400",
    },
  ];

  const FAQ_ITEMS = [
    {
      question: t("help.faq1Q"),
      answer: t("help.faq1A"),
      icon: Zap,
    },
    {
      question: t("help.faq2Q"),
      answer: t("help.faq2A"),
      icon: Target,
    },
    {
      question: t("help.faq3Q"),
      answer: t("help.faq3A"),
      icon: CheckCircle2,
    },
    {
      question: t("help.faq4Q"),
      answer: t("help.faq4A"),
      icon: Trophy,
    },
    {
      question: t("help.faq5Q"),
      answer: t("help.faq5A"),
      icon: TrendingUp,
    },
  ];

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
              <span className="text-lg font-bold">{t("help.title")}</span>
              <p className="text-xs text-muted-foreground font-normal">{t("help.subtitle")}</p>
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
                    In <span className="text-primary font-semibold">{t("help.3steps")}</span> {t("help.toBestSelf")}
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
                            {t("help.step")} {item.step}
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
                    <span className="font-semibold">{t("help.startTour")}</span>
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
                    <span>{t("help.moreQuestions")}</span>
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
