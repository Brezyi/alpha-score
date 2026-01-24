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
  Eye,
  Lock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import beforeImage from "@/assets/transformation-before.jpg";
import afterImage from "@/assets/transformation-after.jpg";

type FeatureTab = "potential" | "analysis" | "plan" | "progress" | "coach";

const FeatureShowcase = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [activeTab, setActiveTab] = useState<FeatureTab>("potential");

  const tabs = [
    { id: "analysis" as const, label: "KI-Analyse", icon: Camera },
    { id: "plan" as const, label: "Dein Plan", icon: CheckCircle2 },
    { id: "potential" as const, label: "Dein Potenzial", icon: Eye },
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
          <p className="text-lg text-muted-foreground mb-6">
            Entdecke alle Features, bevor du startest – von der KI-Analyse bis zum persönlichen Coach.
          </p>
          
          {/* Potential Teaser Stats */}
          <div className="flex flex-wrap justify-center gap-4 md:gap-6">
            <div className="glass-card px-5 py-3 rounded-xl">
              <div className="text-2xl font-black text-primary">+1.4</div>
              <div className="text-xs text-muted-foreground">Ø Potenzial</div>
            </div>
            <div className="glass-card px-5 py-3 rounded-xl">
              <div className="text-2xl font-black text-foreground">Top 25%</div>
              <div className="text-xs text-muted-foreground">Erreichbar</div>
            </div>
            <div className="glass-card px-5 py-3 rounded-xl">
              <div className="text-2xl font-black text-primary">8.2</div>
              <div className="text-xs text-muted-foreground">Max Score</div>
            </div>
          </div>
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
            {activeTab === "potential" && <PotentialPreview key="potential" />}
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

// Potential Preview Component (Before/After Slider)
const PotentialPreview = () => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = (clientX: number) => {
    if (!containerRef.current || !isDragging) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = Math.max(0, Math.min((x / rect.width) * 100, 100));
    setSliderPosition(percent);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center gap-8"
    >
      {/* Top Row: Before/After Slider + Stats Side by Side */}
      <div className="flex flex-col md:flex-row gap-8 items-center justify-center w-full">
        {/* Before/After Slider */}
        <div
          ref={containerRef}
          className="relative aspect-[3/4] w-64 rounded-2xl overflow-hidden cursor-ew-resize select-none glow-box flex-shrink-0"
          onMouseMove={(e) => handleMove(e.clientX)}
          onTouchMove={(e) => handleMove(e.touches[0].clientX)}
          onMouseDown={() => setIsDragging(true)}
          onTouchStart={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          onMouseLeave={() => setIsDragging(false)}
          onTouchEnd={() => setIsDragging(false)}
        >
          {/* Before Image */}
          <div className="absolute inset-0">
            <img 
              src={beforeImage} 
              alt="Vorher" 
              className="w-full h-full object-cover"
              draggable={false}
            />
            <div className="absolute top-4 left-4 px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-sm">
              <span className="text-orange-400 text-sm font-bold">Score: 5.2</span>
            </div>
          </div>

          {/* After Image */}
          <div
            className="absolute inset-0"
            style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
          >
            <img 
              src={afterImage} 
              alt="Nachher" 
              className="w-full h-full object-cover"
              draggable={false}
            />
            <div className="absolute top-4 left-4 px-3 py-1.5 rounded-lg bg-primary/80 backdrop-blur-sm">
              <span className="text-primary-foreground text-sm font-bold">Score: 7.4</span>
            </div>
          </div>

          {/* Slider Line */}
          <div
            className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_20px_rgba(255,255,255,0.5)]"
            style={{ left: `${sliderPosition}%`, transform: "translateX(-50%)" }}
          >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center">
              <div className="flex gap-0.5">
                <div className="w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent border-r-gray-600" />
                <div className="w-0 h-0 border-t-4 border-b-4 border-l-4 border-transparent border-l-gray-600" />
              </div>
            </div>
          </div>

          {/* Labels */}
          <div className="absolute bottom-4 left-4 px-3 py-1.5 rounded-lg bg-black/50 backdrop-blur-sm text-white text-sm font-medium">
            Vorher
          </div>
          <div className="absolute bottom-4 right-4 px-3 py-1.5 rounded-lg bg-primary/80 backdrop-blur-sm text-primary-foreground text-sm font-medium">
            Nachher
          </div>
        </div>

        {/* Score Improvement Info */}
        <div className="p-6 rounded-2xl glass-card text-center w-full max-w-sm">
          <div className="flex flex-col items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
              <TrendingUp className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-bold">+2.2 Punkte</h3>
              <p className="text-muted-foreground text-sm">Durchschnittliche Verbesserung</p>
            </div>
          </div>
          <div className="space-y-3">
            {[
              { label: "Skincare Routine", value: "+0.8" },
              { label: "Hairstyle Optimierung", value: "+0.6" },
              { label: "Fitness & Body", value: "+0.5" },
              { label: "Style & Grooming", value: "+0.3" },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
              >
                <span className="text-sm text-muted-foreground">{item.label}</span>
                <span className="text-sm font-semibold text-primary">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Unsere KI zeigt dir, wie du mit den richtigen Verbesserungen aussehen könntest.
      </p>
    </motion.div>
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
    className="grid md:grid-cols-2 gap-8"
  >
    {/* Chart */}
    <div className="glass-card p-6 rounded-2xl">
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

    {/* Achievements - styled like the in-app AchievementsGrid */}
    <div className="glass-card p-6 rounded-2xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold flex items-center gap-2">
          🏆 Achievements
        </h3>
        <span className="text-sm text-muted-foreground">
          3/5 freigeschaltet
        </span>
      </div>
      
      <div className="grid grid-cols-5 gap-3">
        {[
          { emoji: "📸", title: "Erste Schritte", description: "Schließe deine erste Analyse ab", xp: 50, unlocked: true },
          { emoji: "⬆️", title: "Erste Verbesserung", description: "Verbessere deinen Score", xp: 100, unlocked: true },
          { emoji: "🔥", title: "Wochenkrieger", description: "7 Tage Streak erreicht", xp: 100, unlocked: true },
          { emoji: "🌟", title: "+1 Punkt", description: "Score um 1 Punkt verbessert", xp: 200, unlocked: false },
          { emoji: "👑", title: "Monatsmeister", description: "30 Tage Streak erreicht", xp: 500, unlocked: false },
        ].map((achievement, index) => (
          <motion.div 
            key={achievement.title}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            className={`relative aspect-square rounded-xl flex items-center justify-center text-2xl cursor-pointer transition-all ${
              achievement.unlocked 
                ? "bg-primary/10 border-2 border-primary/30 hover:scale-110 hover:border-primary/50" 
                : "bg-muted/50 border-2 border-transparent grayscale opacity-50"
            }`}
            title={`${achievement.title}: ${achievement.description} (+${achievement.xp} XP)`}
          >
            {achievement.unlocked ? (
              <span>{achievement.emoji}</span>
            ) : (
              <div className="relative">
                <span className="blur-[2px]">{achievement.emoji}</span>
                <Lock className="absolute inset-0 m-auto w-4 h-4 text-muted-foreground" />
              </div>
            )}
            
            {achievement.unlocked && (
              <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-green-500 border-2 border-background" />
            )}
          </motion.div>
        ))}
      </div>
      
      <p className="text-xs text-muted-foreground mt-3 text-center">
        Schalte Achievements frei und sammle XP
      </p>
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
