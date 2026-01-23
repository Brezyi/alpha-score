import { useRef, useState } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { 
  Camera, 
  BarChart3, 
  CheckCircle2, 
  MessageSquare, 
  TrendingUp,
  Sparkles,
  ChevronRight,
  Star,
  Droplets,
  Scissors,
  Dumbbell,
  Flame,
  Shirt
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

type FeatureTab = "analysis" | "plan" | "progress" | "coach";

const FeatureShowcase = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [activeTab, setActiveTab] = useState<FeatureTab>("analysis");

  const tabs = [
    { id: "analysis" as const, label: "KI-Analyse", icon: Camera },
    { id: "plan" as const, label: "Dein Plan", icon: CheckCircle2 },
    { id: "progress" as const, label: "Fortschritt", icon: TrendingUp },
    { id: "coach" as const, label: "AI Coach", icon: MessageSquare },
  ];

  return (
    <section ref={ref} className="relative py-24 overflow-hidden" id="preview">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-card/30 to-background" />
      
      <div className="container relative z-10 px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm text-muted-foreground">App Vorschau</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Alles auf einen <span className="text-gradient">Blick</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Entdecke alle Features, bevor du startest – von der KI-Analyse bis zum persönlichen Coach.
          </p>
        </motion.div>

        {/* Tab Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-wrap justify-center gap-2 mb-12"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-all duration-300 ${
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                  : "glass hover:bg-accent"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </motion.div>

        {/* Content Area */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="max-w-5xl mx-auto"
        >
          <AnimatePresence mode="wait">
            {activeTab === "analysis" && <AnalysisPreview key="analysis" />}
            {activeTab === "plan" && <PlanPreview key="plan" />}
            {activeTab === "progress" && <ProgressPreview key="progress" />}
            {activeTab === "coach" && <CoachPreview key="coach" />}
          </AnimatePresence>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="text-center mt-12"
        >
          <Link to="/register">
            <Button variant="hero" size="lg" className="group">
              Jetzt kostenlos starten
              <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

// Analysis Preview Component
const AnalysisPreview = () => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    transition={{ duration: 0.4 }}
    className="grid md:grid-cols-2 gap-8 items-center"
  >
    {/* Score Display */}
    <div className="glass-card p-6 rounded-2xl">
      <div className="text-center mb-6">
        <div className="text-sm text-muted-foreground mb-2">Dein Looks Score</div>
        <div className="relative inline-flex items-center justify-center">
          <svg className="w-40 h-40 transform -rotate-90">
            <circle
              cx="80"
              cy="80"
              r="70"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-muted/30"
            />
            <circle
              cx="80"
              cy="80"
              r="70"
              stroke="url(#scoreGradient)"
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={440}
              strokeDashoffset={440 - (440 * 6.8) / 10}
            />
            <defs>
              <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="hsl(var(--primary))" />
                <stop offset="100%" stopColor="hsl(153, 100%, 60%)" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-5xl font-black text-primary">6.8</span>
            <span className="text-xs text-muted-foreground">von 10</span>
          </div>
        </div>
      </div>
      
      {/* Potential */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-primary/10 mb-4">
        <span className="text-sm">Dein Potenzial</span>
        <span className="font-bold text-primary">8.2</span>
      </div>
      
      {/* Mini Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-xl bg-muted/50 text-center">
          <div className="text-lg font-bold text-foreground">Top 25%</div>
          <div className="text-xs text-muted-foreground">Ranking</div>
        </div>
        <div className="p-3 rounded-xl bg-muted/50 text-center">
          <div className="text-lg font-bold text-primary">+1.4</div>
          <div className="text-xs text-muted-foreground">Potenzial</div>
        </div>
      </div>
    </div>

    {/* Details List */}
    <div className="space-y-4">
      <h3 className="text-xl font-bold mb-4">Detaillierte Analyse</h3>
      {[
        { label: "Gesichtssymmetrie", score: 7.2, color: "bg-emerald-500" },
        { label: "Jawline Definition", score: 6.5, color: "bg-blue-500" },
        { label: "Hautqualität", score: 5.8, color: "bg-orange-500" },
        { label: "Augenbereich", score: 7.8, color: "bg-purple-500" },
        { label: "Haare & Styling", score: 6.0, color: "bg-pink-500" },
      ].map((item) => (
        <div key={item.label} className="glass-card p-4 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">{item.label}</span>
            <span className="font-bold">{item.score}</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${item.score * 10}%` }}
              transition={{ duration: 1, delay: 0.5 }}
              className={`h-full rounded-full ${item.color}`}
            />
          </div>
        </div>
      ))}
    </div>
  </motion.div>
);

// Plan Preview Component
const PlanPreview = () => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    transition={{ duration: 0.4 }}
    className="glass-card p-6 md:p-8 rounded-2xl"
  >
    <div className="flex items-center gap-3 mb-6">
      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
        <CheckCircle2 className="w-5 h-5 text-primary" />
      </div>
      <div>
        <h3 className="text-xl font-bold">Dein persönlicher Plan</h3>
        <p className="text-sm text-muted-foreground">Basierend auf deiner Analyse</p>
      </div>
    </div>

    <div className="grid md:grid-cols-3 gap-4">
      {[
        {
          icon: Droplets,
          title: "Skincare",
          color: "bg-cyan-500/10 text-cyan-500",
          tasks: ["Morgen-Routine etablieren", "SPF 50 täglich", "Retinol 2x/Woche"],
          progress: 45,
        },
        {
          icon: Scissors,
          title: "Haare & Grooming",
          color: "bg-purple-500/10 text-purple-500",
          tasks: ["Friseur-Termin buchen", "Augenbrauen zupfen", "Bartpflege optimieren"],
          progress: 30,
        },
        {
          icon: Dumbbell,
          title: "Fitness",
          color: "bg-orange-500/10 text-orange-500",
          tasks: ["3x/Woche Training", "Protein-Ziel erreichen", "Körperhaltung verbessern"],
          progress: 60,
        },
      ].map((category) => (
        <div key={category.title} className="p-4 rounded-xl bg-muted/30 border border-border/50">
          <div className="flex items-center gap-2 mb-3">
            <div className={`w-8 h-8 rounded-lg ${category.color} flex items-center justify-center`}>
              <category.icon className="w-4 h-4" />
            </div>
            <span className="font-semibold">{category.title}</span>
          </div>
          
          <div className="space-y-2 mb-4">
            {category.tasks.map((task, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <div className={`w-4 h-4 rounded-full border-2 ${i === 0 ? "bg-primary border-primary" : "border-muted-foreground/30"} flex items-center justify-center`}>
                  {i === 0 && <CheckCircle2 className="w-3 h-3 text-primary-foreground" />}
                </div>
                <span className={i === 0 ? "line-through text-muted-foreground" : ""}>{task}</span>
              </div>
            ))}
          </div>
          
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div 
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${category.progress}%` }}
            />
          </div>
          <div className="text-xs text-muted-foreground mt-1 text-right">{category.progress}%</div>
        </div>
      ))}
    </div>
  </motion.div>
);

// Progress Preview Component
const ProgressPreview = () => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    transition={{ duration: 0.4 }}
    className="grid md:grid-cols-3 gap-6"
  >
    {/* Chart */}
    <div className="glass-card p-6 rounded-2xl md:col-span-2">
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
        <BarChart3 className="w-5 h-5 text-primary" />
        Score-Entwicklung
      </h3>
      
      <div className="relative h-48">
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-8 w-8 flex flex-col justify-between text-xs text-muted-foreground">
          <span>10</span>
          <span>7.5</span>
          <span>5</span>
          <span>2.5</span>
        </div>
        
        {/* Chart area */}
        <div className="absolute left-10 right-0 top-0 bottom-8 border-l border-b border-border/50">
          {/* Grid lines */}
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="absolute left-0 right-0 border-t border-border/20" style={{ top: `${i * 25}%` }} />
          ))}
          
          {/* Data line */}
          <svg className="absolute inset-0 w-full h-full overflow-visible">
            <motion.path
              d="M 0 120 Q 50 110, 80 100 T 160 85 T 240 65 T 320 45"
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="3"
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 1.5, delay: 0.3 }}
            />
            {/* Data points */}
            {[[0, 120], [80, 100], [160, 75], [240, 55], [320, 40]].map(([x, y], i) => (
              <motion.circle
                key={i}
                cx={x}
                cy={y}
                r="6"
                fill="hsl(var(--primary))"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5 + i * 0.1 }}
              />
            ))}
          </svg>
        </div>
        
        {/* X-axis labels */}
        <div className="absolute left-10 right-0 bottom-0 flex justify-between text-xs text-muted-foreground">
          <span>Start</span>
          <span>Monat 1</span>
          <span>Monat 2</span>
          <span>Monat 3</span>
          <span>Jetzt</span>
        </div>
      </div>
    </div>

    {/* Streak & Stats */}
    <div className="space-y-4">
      {/* Streak Card */}
      <div className="glass-card p-5 rounded-2xl">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
            <Flame className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="text-3xl font-black">12</div>
            <div className="text-xs text-muted-foreground">Tage Streak</div>
          </div>
        </div>
        <div className="flex gap-1">
          {[...Array(7)].map((_, i) => (
            <div 
              key={i} 
              className={`flex-1 h-2 rounded-full ${i < 5 ? 'bg-gradient-to-r from-orange-500 to-red-500' : 'bg-muted/50'}`} 
            />
          ))}
        </div>
        <div className="text-xs text-muted-foreground mt-2 text-center">5/7 Tage diese Woche</div>
      </div>

      {/* Improvement Card */}
      <div className="glass-card p-5 rounded-2xl">
        <div className="text-center mb-4">
          <div className="text-3xl font-black text-primary">+2.2</div>
          <div className="text-xs text-muted-foreground">Durchschnittliche Verbesserung</div>
        </div>
        
        <div className="space-y-2">
          {[
            { icon: Droplets, label: "Skincare Routine", value: "+0.8", color: "text-cyan-500" },
            { icon: Scissors, label: "Hairstyle Optimierung", value: "+0.6", color: "text-purple-500" },
            { icon: Dumbbell, label: "Fitness & Body", value: "+0.5", color: "text-orange-500" },
            { icon: Shirt, label: "Style & Grooming", value: "+0.3", color: "text-pink-500" },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <item.icon className={`w-4 h-4 ${item.color}`} />
                <span className="text-muted-foreground">{item.label}</span>
              </div>
              <span className="font-bold text-primary">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* Milestones - Full Width */}
    <div className="glass-card p-6 rounded-2xl md:col-span-3">
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
        <Star className="w-5 h-5 text-primary" />
        Meilensteine
      </h3>
      
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { emoji: "🎯", title: "Erste Analyse", unlocked: true },
          { emoji: "📈", title: "+0.5 Score", unlocked: true },
          { emoji: "🔥", title: "7-Tage Streak", unlocked: true },
          { emoji: "⭐", title: "Score 7.0", unlocked: false },
          { emoji: "🏆", title: "Top 10%", unlocked: false },
        ].map((milestone) => (
          <div 
            key={milestone.title}
            className={`flex flex-col items-center gap-2 p-4 rounded-xl text-center ${
              milestone.unlocked ? "bg-primary/10" : "bg-muted/30 opacity-60"
            }`}
          >
            <span className="text-3xl">{milestone.emoji}</span>
            <span className={`text-xs font-medium ${milestone.unlocked ? "" : "text-muted-foreground"}`}>
              {milestone.title}
            </span>
            {milestone.unlocked && <CheckCircle2 className="w-4 h-4 text-primary" />}
          </div>
        ))}
      </div>
    </div>
  </motion.div>
);

// Coach Preview Component
const CoachPreview = () => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    transition={{ duration: 0.4 }}
    className="glass-card p-6 md:p-8 rounded-2xl max-w-2xl mx-auto"
  >
    <div className="flex items-center gap-3 mb-6">
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-emerald-400 flex items-center justify-center">
        <MessageSquare className="w-6 h-6 text-primary-foreground" />
      </div>
      <div>
        <h3 className="text-xl font-bold">AI Looksmax Coach</h3>
        <p className="text-sm text-muted-foreground">24/7 für deine Fragen da</p>
      </div>
    </div>

    <div className="space-y-4 mb-6">
      {/* User Message */}
      <div className="flex justify-end">
        <div className="bg-primary text-primary-foreground px-4 py-3 rounded-2xl rounded-br-md max-w-[80%]">
          <p className="text-sm">Wie kann ich meine Jawline verbessern?</p>
        </div>
      </div>
      
      {/* AI Response */}
      <div className="flex justify-start">
        <div className="bg-muted px-4 py-3 rounded-2xl rounded-bl-md max-w-[85%]">
          <p className="text-sm mb-3">
            Für eine definiertere Jawline empfehle ich dir folgende Strategien:
          </p>
          <ul className="text-sm space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-primary">1.</span>
              <span><strong>Körperfett reduzieren</strong> – Ein niedrigerer KFA macht die Gesichtszüge schärfer</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">2.</span>
              <span><strong>Mewing praktizieren</strong> – Korrekte Zungenposition stärkt die Kaumuskulatur</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">3.</span>
              <span><strong>Kaugummi kauen</strong> – Stärkt die Masseter-Muskeln für mehr Definition</span>
            </li>
          </ul>
        </div>
      </div>
    </div>

    {/* Input Preview */}
    <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border">
      <input 
        type="text" 
        placeholder="Stelle eine Frage..." 
        className="flex-1 bg-transparent border-none outline-none text-sm"
        disabled
      />
      <Button size="sm" variant="default" disabled>
        Senden
      </Button>
    </div>
    
    <p className="text-xs text-muted-foreground text-center mt-3">
      Premium-Feature • Unbegrenzte Fragen
    </p>
  </motion.div>
);

export default FeatureShowcase;
