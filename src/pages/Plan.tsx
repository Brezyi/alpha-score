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
  Lock,
  Target,
  AlertCircle,
  Flame
} from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/hooks/useSubscription";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useGlobalSettings } from "@/contexts/SystemSettingsContext";
import { motion, AnimatePresence } from "framer-motion";
import { useOptimizedAnimations } from "@/hooks/useReducedMotion";
import { FaceFitnessExercises } from "@/components/FaceFitnessExercises";
import { MobileAppLayout } from "@/components/mobile/MobileAppLayout";
import { MobilePlanContent } from "@/components/mobile/MobilePlanContent";
import { Capacitor } from "@capacitor/core";

const isNative = Capacitor.isNativePlatform();

type Task = {
  id: string;
  category: string;
  title: string;
  description: string | null;
  completed: boolean;
  priority: number;
};

type Analysis = {
  id: string;
  looks_score: number | null;
  weaknesses: string[] | null;
  priorities: string[] | null;
  strengths: string[] | null;
  detailed_results: any;
};

const Plan = () => {
  const { user, loading } = useAuth();
  const { t } = useLanguage();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [latestAnalysis, setLatestAnalysis] = useState<Analysis | null>(null);
  const [activeCategory, setActiveCategory] = useState("skincare");
  const [focusAreas, setFocusAreas] = useState<string[]>([]);
  const [initialExercise, setInitialExercise] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { isPremium, loading: subLoading } = useSubscription();
  const { settings } = useGlobalSettings();
  const { shouldReduce, containerVariants, itemVariants, hoverScale, tapScale, hoverScaleSmall } = useOptimizedAnimations();

  const CATEGORIES = [
    { id: "skincare", name: t("plan.skincare"), icon: Droplets, color: "bg-cyan-500/10 text-cyan-500", borderColor: "border-cyan-500/20" },
    { id: "hair", name: t("plan.hairBeard"), icon: Scissors, color: "bg-purple-500/10 text-purple-500", borderColor: "border-purple-500/20" },
    { id: "body", name: t("plan.bodyGym"), icon: Dumbbell, color: "bg-orange-500/10 text-orange-500", borderColor: "border-orange-500/20" },
    { id: "style", name: t("plan.styleClothing"), icon: Shirt, color: "bg-pink-500/10 text-pink-500", borderColor: "border-pink-500/20" },
    { id: "teeth", name: t("plan.teethSmile"), icon: SmilePlus, color: "bg-emerald-500/10 text-emerald-500", borderColor: "border-emerald-500/20" },
    { id: "mindset", name: t("plan.mindsetPosture"), icon: Brain, color: "bg-blue-500/10 text-blue-500", borderColor: "border-blue-500/20" },
  ];

  // Handle scroll to face-fitness section and auto-expand exercise
  useEffect(() => {
    if (location.hash === "#face-fitness") {
      const params = new URLSearchParams(location.search);
      const exercise = params.get("exercise");
      if (exercise) {
        setInitialExercise(exercise);
      }
      
      setTimeout(() => {
        const element = document.getElementById("face-fitness");
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 300);
    }
  }, [location]);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      try {
        const { data: tasksData, error: tasksError } = await supabase
          .from("user_tasks")
          .select("*")
          .eq("user_id", user.id)
          .order("priority", { ascending: true });

        if (tasksError) throw tasksError;
        setTasks(tasksData || []);

        const { data: analysisData, error: analysisError } = await supabase
          .from("analyses")
          .select("id, looks_score, weaknesses, priorities, strengths, detailed_results")
          .eq("user_id", user.id)
          .eq("status", "completed")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (analysisError) throw analysisError;
        setLatestAnalysis(analysisData);

        if (tasksData && tasksData.length > 0) {
          const firstCatWithTasks = CATEGORIES.find(c => 
            tasksData.some(t => t.category === c.id)
          );
          if (firstCatWithTasks) {
            setActiveCategory(firstCatWithTasks.id);
          }
        }

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

  const generatePersonalizedPlan = async () => {
    if (!user) return;
    
    if (!latestAnalysis) {
      toast({
        title: t("plan.noAnalysis"),
        description: t("plan.noAnalysisDesc"),
        variant: "destructive",
      });
      return;
    }

    setGenerating(true);

    try {
      const { data: session } = await supabase.auth.getSession();
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-personalized-plan`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.session?.access_token}`,
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Plan generation failed");
      }

      const { data: freshTasks, error: fetchError } = await supabase
        .from("user_tasks")
        .select("*")
        .eq("user_id", user.id)
        .order("priority", { ascending: true });

      if (fetchError) {
        console.error("Error fetching fresh tasks:", fetchError);
        setTasks(result.tasks || []);
      } else {
        setTasks(freshTasks || []);
      }
      
      setFocusAreas(result.focus_areas || []);

      toast({
        title: t("plan.generated"),
        description: t("plan.generatedDesc"),
      });

      const tasksToUse = freshTasks || result.tasks || [];
      if (tasksToUse.length > 0) {
        const firstCat = CATEGORIES.find(c => 
          tasksToUse.some((t: Task) => t.category === c.id)
        );
        if (firstCat) setActiveCategory(firstCat.id);
      }

    } catch (error: any) {
      console.error("Error generating plan:", error);
      toast({
        title: t("common.error"),
        description: error.message || t("plan.noAnalysisDesc"),
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
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </motion.div>
      </div>
    );
  }

  if (isNative && isPremium) {
    return (
      <MobileAppLayout title={t("nav.plan")} showLogo={false}>
        <MobilePlanContent
          tasks={tasks}
          loading={tasksLoading}
          generating={generating}
          latestScore={latestAnalysis?.looks_score ?? null}
          onToggleTask={toggleTask}
          onGeneratePlan={generatePersonalizedPlan}
        />
      </MobileAppLayout>
    );
  }

  if (!isPremium) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border">
          <div className="container px-4">
            <div className="flex items-center justify-between h-16">
              <Link to="/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-5 h-5" />
                <span>{t("nav.back")}</span>
              </Link>
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                <span className="font-bold">{settings.app_name}</span>
              </div>
            </div>
          </div>
        </header>

        <main className="container px-4 py-16 text-center">
          <motion.div 
            className="max-w-md mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div 
              className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            >
              <Lock className="w-10 h-10 text-primary" />
            </motion.div>
            <h1 className="text-3xl font-bold mb-4">{t("dashboard.premiumFeature")}</h1>
            <p className="text-muted-foreground mb-8">
              {t("plan.premiumDesc")}
            </p>
            <Link to="/pricing">
              <Button variant="hero" size="lg">
                <Crown className="w-5 h-5" />
                {t("plan.goPremium")}
              </Button>
            </Link>
          </motion.div>
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

  const detailedResults = latestAnalysis?.detailed_results as any || {};
  const subScores = [
    { name: t("plan.symmetry"), score: detailedResults.face_symmetry?.score, icon: Target },
    { name: t("plan.jawline"), score: detailedResults.jawline?.score, icon: Zap },
    { name: t("plan.eyes"), score: detailedResults.eyes?.score, icon: Sparkles },
    { name: t("plan.skin"), score: detailedResults.skin?.score, icon: Droplets },
    { name: t("plan.hair"), score: detailedResults.hair?.score, icon: Scissors },
    { name: t("plan.charisma"), score: detailedResults.overall_vibe?.score, icon: Flame },
  ].filter(s => s.score !== undefined);

  return (
    <div className="min-h-screen bg-background">
      <motion.header 
        className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <div className="container px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-5 h-5" />
              <span>{t("common.dashboard")}</span>
            </Link>
            <motion.div 
              className="flex items-center gap-2"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Sparkles className="w-5 h-5 text-primary" />
              <span className="font-bold">{t("plan.headerTitle")}</span>
            </motion.div>
          </div>
        </div>
      </motion.header>

      <main className="container px-4 py-8">
        <motion.div 
          className="mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h1 className="text-3xl font-bold mb-2">{t("plan.title")}</h1>
          <p className="text-muted-foreground">
            {latestAnalysis ? (
              <>{t("plan.subtitle")} ({t("plan.subtitleScore")} {latestAnalysis.looks_score?.toFixed(1)})</>
            ) : (
              <>{t("plan.subtitleNoAnalysis")}</>
            )}
          </p>
        </motion.div>

        {subScores.length > 0 && (
          <motion.div 
            className="mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h3 className="text-sm font-medium text-muted-foreground mb-3">{t("plan.yourSubScores")}</h3>
            <motion.div 
              className="grid grid-cols-3 md:grid-cols-6 gap-2"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {subScores.map((item, index) => (
                <motion.div
                  key={item.name}
                  variants={itemVariants}
                  whileHover={hoverScale}
                  whileTap={tapScale}
                >
                  <Card className={cn(
                    "p-3 text-center cursor-pointer transition-shadow hover:shadow-lg",
                    item.score >= 7 ? "border-green-500/30 bg-green-500/5" :
                    item.score >= 5 ? "border-yellow-500/30 bg-yellow-500/5" :
                    "border-red-500/30 bg-red-500/5"
                  )}>
                    {!shouldReduce && (
                      <motion.div
                        initial={{ rotate: 0 }}
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ delay: 0.5 + index * 0.1, duration: 0.5 }}
                      >
                        <item.icon className={cn(
                          "w-4 h-4 mx-auto mb-1",
                          item.score >= 7 ? "text-green-500" :
                          item.score >= 5 ? "text-yellow-500" :
                          "text-red-500"
                        )} />
                      </motion.div>
                    )}
                    {shouldReduce && (
                      <item.icon className={cn(
                        "w-4 h-4 mx-auto mb-1",
                        item.score >= 7 ? "text-green-500" :
                        item.score >= 5 ? "text-yellow-500" :
                        "text-red-500"
                      )} />
                    )}
                    <div className="text-xs text-muted-foreground">{item.name}</div>
                    <div className={cn(
                      "text-lg font-bold",
                      item.score >= 7 ? "text-green-500" :
                      item.score >= 5 ? "text-yellow-500" :
                      "text-red-500"
                    )}>
                      {item.score.toFixed(1)}
                    </div>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        )}

        <AnimatePresence>
          {(focusAreas.length > 0 || (latestAnalysis?.priorities && latestAnalysis.priorities.length > 0)) && (
            <motion.div
              initial={{ opacity: 0, y: 20, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -20, height: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="p-4 bg-primary/5 border-primary/20 mb-6">
                <div className="flex items-center gap-2 mb-3">
                  {!shouldReduce ? (
                    <motion.div
                      animate={{ rotate: [0, 360] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    >
                      <Target className="w-4 h-4 text-primary" />
                    </motion.div>
                  ) : (
                    <Target className="w-4 h-4 text-primary" />
                  )}
                  <span className="text-sm font-medium text-primary">{t("plan.topPriorities")}</span>
                </div>
                <motion.div 
                  className="space-y-2"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {(focusAreas.length > 0 ? focusAreas : latestAnalysis?.priorities || []).slice(0, 3).map((item, i) => (
                    <motion.div 
                      key={i} 
                      className="flex items-start gap-3"
                      variants={itemVariants}
                    >
                      <motion.div 
                        className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0"
                        whileHover={{ scale: 1.2 }}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.4 + i * 0.1, type: "spring" }}
                      >
                        {i + 1}
                      </motion.div>
                      <span className="text-sm">{item}</span>
                    </motion.div>
                  ))}
                </motion.div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {tasks.length > 0 && (
          <motion.div 
            className="p-6 rounded-2xl glass-card mb-6 overflow-hidden relative"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            {!shouldReduce && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5"
                animate={{ x: ["-100%", "100%"] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              />
            )}
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold">{t("plan.overallProgress")}</span>
                <span className="text-sm text-muted-foreground">
                  {overallCompleted} / {overallTotal} {t("plan.tasks")}
                </span>
              </div>
              <div className="relative">
                <Progress value={overallProgress} className="h-3" />
                {!shouldReduce && (
                  <motion.div
                    className="absolute top-0 left-0 h-full w-full pointer-events-none"
                    initial={false}
                  >
                    <motion.div
                      className="absolute top-0 h-full w-4 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                      animate={{ left: ["0%", "100%"] }}
                      transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                    />
                  </motion.div>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {overallProgress >= 100 ? t("plan.allDone") :
                 overallProgress >= 75 ? t("plan.almostDone") :
                 overallProgress >= 50 ? t("plan.goodProgress") :
                 overallProgress >= 25 ? t("plan.goodStart") :
                 t("plan.startPlan")}
              </p>
            </div>
          </motion.div>
        )}

        {tasks.length === 0 && !tasksLoading && (
          <motion.div 
            className="text-center py-12 rounded-2xl glass-card mb-8"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            {!latestAnalysis ? (
              <>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200 }}
                >
                  <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                </motion.div>
                <h3 className="text-xl font-bold mb-2">{t("plan.doAnalysisFirst")}</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  {t("plan.doAnalysisFirstDesc")}
                </p>
                <Link to="/upload">
                  <Button variant="hero" size="lg">
                    <Sparkles className="w-5 h-5" />
                    {t("plan.startAnalysis")}
                  </Button>
                </Link>
              </>
            ) : (
              <>
                {!shouldReduce ? (
                  <motion.div
                    animate={{ 
                      rotate: [0, 10, -10, 0],
                      scale: [1, 1.1, 1]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Sparkles className="w-12 h-12 text-primary mx-auto mb-4" />
                  </motion.div>
                ) : (
                  <Sparkles className="w-12 h-12 text-primary mx-auto mb-4" />
                )}
                <h3 className="text-xl font-bold mb-2">{t("plan.planReady")}</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  {t("plan.planReadyDesc")}
                </p>
                <motion.div whileHover={hoverScale} whileTap={tapScale}>
                  <Button variant="hero" size="lg" onClick={generatePersonalizedPlan} disabled={generating}>
                    {generating ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        {t("plan.generatingAI")}
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        {t("plan.generatePlan")}
                      </>
                    )}
                  </Button>
                </motion.div>
              </>
            )}
          </motion.div>
        )}

        {tasks.length > 0 && (
          <>
            <motion.div 
              className="flex items-center gap-3 mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Check className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold">{t("plan.yourPlan")}</h3>
                <p className="text-sm text-muted-foreground">{t("plan.basedOnAnalysis")}</p>
              </div>
            </motion.div>

            <motion.div 
              className="grid md:grid-cols-3 gap-4 mb-6"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {CATEGORIES.map((cat, index) => {
                const catTasks = tasks.filter(t => t.category === cat.id);
                if (catTasks.length === 0) return null;
                
                const catCompleted = catTasks.filter(t => t.completed).length;
                const catProgress = (catCompleted / catTasks.length) * 100;
                
                return (
                  <motion.div
                    key={cat.id}
                    className="p-4 rounded-xl bg-muted/30 border border-border/50"
                    variants={itemVariants}
                    whileHover={hoverScaleSmall}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", cat.color)}>
                        <cat.icon className="w-4 h-4" />
                      </div>
                      <span className="font-semibold">{cat.name}</span>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      {catTasks.slice(0, 3).map((task, i) => (
                        <div 
                          key={task.id} 
                          className="flex items-center gap-2 text-sm cursor-pointer"
                          onClick={() => toggleTask(task.id, task.completed)}
                        >
                          <div className={cn(
                            "w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                            task.completed 
                              ? "bg-primary border-primary" 
                              : "border-muted-foreground/30"
                          )}>
                            {task.completed && <Check className="w-3 h-3 text-primary-foreground" />}
                          </div>
                          <span className={task.completed ? "line-through text-muted-foreground" : ""}>
                            {task.title}
                          </span>
                        </div>
                      ))}
                      {catTasks.length > 3 && (
                        <button
                          onClick={() => setActiveCategory(cat.id)}
                          className="text-xs text-primary hover:underline pl-6"
                        >
                          +{catTasks.length - 3} {t("common.more")}
                        </button>
                      )}
                    </div>
                    
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <motion.div 
                        className="h-full rounded-full bg-primary"
                        initial={{ width: 0 }}
                        animate={{ width: `${catProgress}%` }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                      />
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 text-right">{Math.round(catProgress)}%</div>
                  </motion.div>
                );
              })}
            </motion.div>

            <motion.div
              key={activeCategory}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-6 rounded-2xl mb-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {(() => {
                    const cat = CATEGORIES.find(c => c.id === activeCategory);
                    if (!cat) return null;
                    return (
                      <>
                        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", cat.color)}>
                          <cat.icon className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold">{cat.name}</h4>
                          <p className="text-sm text-muted-foreground">{completedCount} {t("plan.ofCompleted")} {totalCount} {t("plan.completed")}</p>
                        </div>
                      </>
                    );
                  })()}
                </div>
                <div className="text-2xl font-bold text-primary">{Math.round(progress)}%</div>
              </div>

              <div className="space-y-2">
                <AnimatePresence mode="popLayout">
                  {categoryTasks.map((task) => (
                    <motion.div
                      key={task.id}
                      layout={!shouldReduce}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -100 }}
                      onClick={() => toggleTask(task.id, task.completed)}
                      className={cn(
                        "flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all",
                        task.completed 
                          ? "bg-muted/20 opacity-60" 
                          : "bg-muted/30 hover:bg-muted/50"
                      )}
                    >
                      <div className={cn(
                        "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5",
                        task.completed 
                          ? "bg-primary border-primary" 
                          : "border-muted-foreground/50 hover:border-primary"
                      )}>
                        {task.completed && <Check className="w-3 h-3 text-primary-foreground" />}
                      </div>
                      <div className="flex-1">
                        <p className={cn("font-medium text-sm", task.completed && "line-through")}>
                          {task.title}
                        </p>
                        {task.description && (
                          <p className="text-xs text-muted-foreground mt-1">{task.description}</p>
                        )}
                      </div>
                      {task.priority === 1 && !task.completed && (
                        <span className="px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 text-xs">
                          {t("common.priority")}
                        </span>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>

            <motion.div
              id="face-fitness"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="glass-card p-6 rounded-2xl mb-6 scroll-mt-20"
            >
              <FaceFitnessExercises initialExpandedExercise={initialExercise} />
            </motion.div>

            <div className="text-center">
              <motion.div whileHover={hoverScale} whileTap={tapScale}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={generatePersonalizedPlan}
                  disabled={generating || !latestAnalysis}
                >
                  {generating ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-2" />
                  )}
                  {t("plan.regenerate")}
                </Button>
              </motion.div>
              <p className="text-xs text-muted-foreground mt-2">
                {t("plan.basedOnCurrentAnalysis")}
              </p>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default Plan;
