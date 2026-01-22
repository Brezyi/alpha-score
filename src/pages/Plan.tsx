import { Button } from "@/components/ui/button";
import { 
  Zap, 
  ArrowLeft, 
  Sparkles, 
  Droplets, 
  Scissors, 
  Dumbbell, 
  Shirt, 
  SmilePlus,
  Brain,
  Check,
  Loader2,
  RefreshCw,
  Crown,
  Lock
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/hooks/useSubscription";
import { Progress } from "@/components/ui/progress";

type Task = {
  id: string;
  category: string;
  title: string;
  description: string | null;
  completed: boolean;
  priority: number;
};

type Analysis = {
  weaknesses: string[] | null;
  priorities: string[] | null;
  strengths: string[] | null;
};

const CATEGORIES = [
  { id: "skincare", name: "Skincare", icon: Droplets, color: "bg-cyan-500/20 text-cyan-400" },
  { id: "hair", name: "Haare & Bart", icon: Scissors, color: "bg-amber-500/20 text-amber-400" },
  { id: "body", name: "Körper & Gym", icon: Dumbbell, color: "bg-red-500/20 text-red-400" },
  { id: "style", name: "Style & Kleidung", icon: Shirt, color: "bg-purple-500/20 text-purple-400" },
  { id: "teeth", name: "Zähne & Lächeln", icon: SmilePlus, color: "bg-emerald-500/20 text-emerald-400" },
  { id: "mindset", name: "Mindset & Haltung", icon: Brain, color: "bg-blue-500/20 text-blue-400" },
];

const DEFAULT_TASKS: Record<string, { title: string; description: string }[]> = {
  skincare: [
    { title: "Morgens Gesicht reinigen", description: "Sanfter Cleanser für deinen Hauttyp" },
    { title: "Sonnenschutz auftragen (SPF 30+)", description: "Täglich, auch bei Bewölkung" },
    { title: "Abends Feuchtigkeitscreme", description: "Auf feuchte Haut auftragen" },
    { title: "Retinol 2-3x pro Woche", description: "Abends, langsam einführen" },
    { title: "Ausreichend Wasser trinken (2-3L)", description: "Hydration von innen" },
  ],
  hair: [
    { title: "Friseurtermin alle 4-6 Wochen", description: "Regelmäßiger Schnitt für sauberen Look" },
    { title: "Haarstyling-Produkt finden", description: "Matt-Paste, Pomade oder Sea Salt Spray" },
    { title: "Augenbrauen trimmen/zupfen", description: "Sauber halten, nicht übertreiben" },
    { title: "Bartpflege (falls vorhanden)", description: "Trimmen, Öl, klare Konturen" },
  ],
  body: [
    { title: "3-4x pro Woche Training", description: "Kraft- oder Ausdauertraining" },
    { title: "Protein-Ziel erreichen (1.6g/kg)", description: "Muskeln brauchen Protein" },
    { title: "8 Stunden Schlaf", description: "Regeneration ist alles" },
    { title: "Körperhaltung verbessern", description: "Schultern zurück, Brust raus" },
    { title: "Körperfett optimieren", description: "Definiertes Gesicht bei 12-15% KFA" },
  ],
  style: [
    { title: "Kleiderschrank ausmisten", description: "Weg mit schlecht sitzenden Teilen" },
    { title: "Basis-Garderobe aufbauen", description: "Neutrale Farben, gute Passform" },
    { title: "Passende Schuhgröße/Stil", description: "Saubere, zeitlose Schuhe" },
    { title: "Accessoires reduzieren", description: "Weniger ist mehr - eine gute Uhr reicht" },
  ],
  teeth: [
    { title: "2x täglich Zähne putzen", description: "Mindestens 2 Minuten" },
    { title: "Zahnseide täglich", description: "Zwischen den Zähnen nicht vergessen" },
    { title: "Zahnarzt alle 6 Monate", description: "Professionelle Reinigung" },
    { title: "Whitening-Stripes probieren", description: "Für ein helleres Lächeln" },
  ],
  mindset: [
    { title: "Aufrechte Körperhaltung üben", description: "Selbstbewusstsein ausstrahlen" },
    { title: "Blickkontakt halten", description: "3-5 Sekunden, dann wegschauen" },
    { title: "Langsamer sprechen", description: "Wirkt selbstbewusster" },
    { title: "Täglich 10 Min. Meditation", description: "Innere Ruhe und Fokus" },
  ],
};

const Plan = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [latestAnalysis, setLatestAnalysis] = useState<Analysis | null>(null);
  const [activeCategory, setActiveCategory] = useState("skincare");
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isPremium, loading: subLoading } = useSubscription();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(session.user);
      } else {
        navigate("/login");
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
      } else {
        navigate("/login");
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Fetch tasks and latest analysis
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      try {
        // Fetch user tasks
        const { data: tasksData, error: tasksError } = await supabase
          .from("user_tasks")
          .select("*")
          .eq("user_id", user.id)
          .order("priority", { ascending: true });

        if (tasksError) throw tasksError;
        setTasks(tasksData || []);

        // Fetch latest completed analysis
        const { data: analysisData, error: analysisError } = await supabase
          .from("analyses")
          .select("weaknesses, priorities, strengths")
          .eq("user_id", user.id)
          .eq("status", "completed")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (analysisError) throw analysisError;
        setLatestAnalysis(analysisData);

      } catch (error: any) {
        console.error("Error fetching data:", error);
      } finally {
        setTasksLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user]);

  const generateDefaultTasks = async () => {
    if (!user) return;
    setGenerating(true);

    try {
      // Delete existing tasks
      await supabase
        .from("user_tasks")
        .delete()
        .eq("user_id", user.id);

      // Create default tasks for all categories
      const allTasks: any[] = [];
      
      Object.entries(DEFAULT_TASKS).forEach(([category, categoryTasks]) => {
        categoryTasks.forEach((task, index) => {
          allTasks.push({
            user_id: user.id,
            category,
            title: task.title,
            description: task.description,
            priority: index + 1,
            completed: false,
          });
        });
      });

      const { data, error } = await supabase
        .from("user_tasks")
        .insert(allTasks)
        .select();

      if (error) throw error;

      setTasks(data || []);
      toast({
        title: "Plan erstellt!",
        description: "Dein personalisierter Looksmax-Plan ist bereit.",
      });
    } catch (error: any) {
      console.error("Error generating tasks:", error);
      toast({
        title: "Fehler",
        description: "Plan konnte nicht erstellt werden.",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const toggleTask = async (taskId: string, completed: boolean) => {
    try {
      const { error } = await supabase
        .from("user_tasks")
        .update({ completed: !completed })
        .eq("id", taskId);

      if (error) throw error;

      setTasks(prev => 
        prev.map(t => t.id === taskId ? { ...t, completed: !completed } : t)
      );
    } catch (error: any) {
      console.error("Error toggling task:", error);
    }
  };

  if (loading || subLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Premium gate
  if (!isPremium) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border">
          <div className="container px-4">
            <div className="flex items-center justify-between h-16">
              <Link to="/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-5 h-5" />
                <span>Zurück</span>
              </Link>
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                <span className="font-bold">FaceRank</span>
              </div>
            </div>
          </div>
        </header>

        <main className="container px-4 py-16 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Lock className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-3xl font-bold mb-4">Premium Feature</h1>
            <p className="text-muted-foreground mb-8">
              Der personalisierte Looksmax-Plan ist nur für Premium-Mitglieder verfügbar. 
              Erhalte deinen maßgeschneiderten Verbesserungsplan.
            </p>
            <Link to="/pricing">
              <Button variant="hero" size="lg">
                <Crown className="w-5 h-5" />
                Premium werden
              </Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const categoryTasks = tasks.filter(t => t.category === activeCategory);
  const completedCount = categoryTasks.filter(t => t.completed).length;
  const totalCount = categoryTasks.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const overallCompleted = tasks.filter(t => t.completed).length;
  const overallTotal = tasks.length;
  const overallProgress = overallTotal > 0 ? (overallCompleted / overallTotal) * 100 : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border">
        <div className="container px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-5 h-5" />
              <span>Dashboard</span>
            </Link>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <span className="font-bold">Looksmax Plan</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container px-4 py-8">
        {/* Title & Analysis Info */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Dein Looksmax-Plan</h1>
          <p className="text-muted-foreground">
            {latestAnalysis ? (
              <>Basierend auf deiner Analyse – fokussiere dich auf die Prioritäten.</>
            ) : (
              <>Starte mit dem Standard-Plan oder mache eine Analyse für personalisierte Empfehlungen.</>
            )}
          </p>
        </div>

        {/* Overall Progress */}
        {tasks.length > 0 && (
          <div className="p-6 rounded-2xl glass-card mb-8">
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold">Gesamtfortschritt</span>
              <span className="text-sm text-muted-foreground">
                {overallCompleted} / {overallTotal} Aufgaben
              </span>
            </div>
            <Progress value={overallProgress} className="h-3" />
            <p className="text-sm text-muted-foreground mt-2">
              {overallProgress >= 100 ? "🎉 Alles erledigt! Du bist auf dem besten Weg." :
               overallProgress >= 75 ? "💪 Fast geschafft! Bleib dran." :
               overallProgress >= 50 ? "👍 Gute Fortschritte! Weiter so." :
               overallProgress >= 25 ? "🚀 Guter Start! Jeden Tag ein bisschen besser." :
               "📋 Beginne mit deinem Plan!"}
            </p>
          </div>
        )}

        {/* Analysis Insights */}
        {latestAnalysis && latestAnalysis.priorities && latestAnalysis.priorities.length > 0 && (
          <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 mb-8">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Deine Prioritäten aus der Analyse</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {latestAnalysis.priorities.slice(0, 4).map((priority, i) => (
                <span key={i} className="px-3 py-1 rounded-full bg-background/50 text-sm">
                  {priority}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Empty State / Generate Button */}
        {tasks.length === 0 && !tasksLoading && (
          <div className="text-center py-12 rounded-2xl glass-card mb-8">
            <Sparkles className="w-12 h-12 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Noch kein Plan erstellt</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Generiere deinen personalisierten Looksmax-Plan mit Aufgaben in allen wichtigen Kategorien.
            </p>
            <Button variant="hero" size="lg" onClick={generateDefaultTasks} disabled={generating}>
              {generating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Wird erstellt...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Plan generieren
                </>
              )}
            </Button>
          </div>
        )}

        {/* Category Tabs */}
        {tasks.length > 0 && (
          <>
            <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
              {CATEGORIES.map((cat) => {
                const catTasks = tasks.filter(t => t.category === cat.id);
                const catCompleted = catTasks.filter(t => t.completed).length;
                const isActive = activeCategory === cat.id;
                
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl whitespace-nowrap transition-all ${
                      isActive 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-card border border-border hover:border-primary/50"
                    }`}
                  >
                    <cat.icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{cat.name}</span>
                    {catTasks.length > 0 && (
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                        isActive ? "bg-primary-foreground/20" : "bg-muted"
                      }`}>
                        {catCompleted}/{catTasks.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Category Progress */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">
                  {CATEGORIES.find(c => c.id === activeCategory)?.name}
                </span>
                <span className="text-sm font-medium">{completedCount}/{totalCount}</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {/* Tasks List */}
            <div className="space-y-3 mb-8">
              {categoryTasks.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Keine Aufgaben in dieser Kategorie.
                </p>
              ) : (
                categoryTasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => toggleTask(task.id, task.completed)}
                    className={`flex items-start gap-4 p-4 rounded-xl cursor-pointer transition-all ${
                      task.completed 
                        ? "bg-muted/30 opacity-60" 
                        : "glass-card hover:border-primary/50"
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                      task.completed 
                        ? "bg-primary border-primary" 
                        : "border-muted-foreground/50 hover:border-primary"
                    }`}>
                      {task.completed && <Check className="w-4 h-4 text-primary-foreground" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium ${task.completed ? "line-through" : ""}`}>
                        {task.title}
                      </p>
                      {task.description && (
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {task.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Reset Button */}
            <div className="text-center">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={generateDefaultTasks}
                disabled={generating}
              >
                <RefreshCw className={`w-4 h-4 ${generating ? "animate-spin" : ""}`} />
                Plan zurücksetzen
              </Button>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default Plan;
