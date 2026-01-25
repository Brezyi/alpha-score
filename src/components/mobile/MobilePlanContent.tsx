import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
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
  Target,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Haptics, ImpactStyle } from "@capacitor/haptics";

interface Task {
  id: string;
  category: string;
  title: string;
  description: string | null;
  completed: boolean;
  priority: number;
}

interface MobilePlanContentProps {
  tasks: Task[];
  loading: boolean;
  generating: boolean;
  latestScore: number | null;
  onToggleTask: (taskId: string, completed: boolean) => void;
  onGeneratePlan: () => void;
}

const CATEGORIES = [
  { id: "skincare", name: "Skincare", icon: Droplets, color: "text-cyan-500", bgColor: "bg-cyan-500/10" },
  { id: "hair", name: "Haare", icon: Scissors, color: "text-purple-500", bgColor: "bg-purple-500/10" },
  { id: "body", name: "Körper", icon: Dumbbell, color: "text-orange-500", bgColor: "bg-orange-500/10" },
  { id: "style", name: "Style", icon: Shirt, color: "text-pink-500", bgColor: "bg-pink-500/10" },
  { id: "teeth", name: "Zähne", icon: SmilePlus, color: "text-emerald-500", bgColor: "bg-emerald-500/10" },
  { id: "mindset", name: "Mindset", icon: Brain, color: "text-blue-500", bgColor: "bg-blue-500/10" },
];

export const MobilePlanContent = ({
  tasks,
  loading,
  generating,
  latestScore,
  onToggleTask,
  onGeneratePlan
}: MobilePlanContentProps) => {
  const [activeCategory, setActiveCategory] = useState("skincare");

  const handleToggleTask = async (taskId: string, completed: boolean) => {
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch {}
    onToggleTask(taskId, completed);
  };

  const handleCategoryChange = async (categoryId: string) => {
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch {}
    setActiveCategory(categoryId);
  };

  const categoryTasks = tasks.filter(t => t.category === activeCategory);
  const completedCount = categoryTasks.filter(t => t.completed).length;
  const totalCount = categoryTasks.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const overallCompleted = tasks.filter(t => t.completed).length;
  const overallTotal = tasks.length;
  const overallProgress = overallTotal > 0 ? (overallCompleted / overallTotal) * 100 : 0;

  // Get categories with tasks
  const categoriesWithTasks = CATEGORIES.filter(cat => 
    tasks.some(t => t.category === cat.id)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="px-4 py-6 space-y-6">
      {/* Score Header */}
      {latestScore && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="p-4 bg-gradient-to-br from-primary/20 to-primary/5 border-primary/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Aktueller Score</p>
                <p className="text-3xl font-bold text-primary">{latestScore.toFixed(1)}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <Target className="w-6 h-6 text-primary" />
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Generate Plan Button */}
      {tasks.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center py-8"
        >
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-xl font-bold mb-2">Kein Plan vorhanden</h2>
          <p className="text-muted-foreground text-sm mb-6">
            Generiere deinen personalisierten Looksmax-Plan
          </p>
          <Button 
            variant="hero" 
            onClick={onGeneratePlan}
            disabled={generating}
          >
            {generating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generiere...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Plan generieren
              </>
            )}
          </Button>
        </motion.div>
      )}

      {/* Overall Progress */}
      {tasks.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium">Gesamtfortschritt</span>
              <span className="text-sm text-muted-foreground">
                {overallCompleted}/{overallTotal}
              </span>
            </div>
            <Progress value={overallProgress} className="h-2" />
            <div className="flex justify-between mt-2">
              <span className="text-xs text-muted-foreground">
                {Math.round(overallProgress)}% erledigt
              </span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onGeneratePlan}
                disabled={generating}
                className="h-6 text-xs"
              >
                <RefreshCw className={cn("w-3 h-3 mr-1", generating && "animate-spin")} />
                Neu generieren
              </Button>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Category Pills */}
      {tasks.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="overflow-x-auto -mx-4 px-4"
        >
          <div className="flex gap-2 pb-2">
            {categoriesWithTasks.map((category) => {
              const catTasks = tasks.filter(t => t.category === category.id);
              const catCompleted = catTasks.filter(t => t.completed).length;
              const Icon = category.icon;
              const isActive = activeCategory === category.id;

              return (
                <button
                  key={category.id}
                  onClick={() => handleCategoryChange(category.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "bg-card border border-border"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{category.name}</span>
                  <span className={cn(
                    "text-xs px-1.5 py-0.5 rounded-full",
                    isActive ? "bg-primary-foreground/20" : "bg-muted"
                  )}>
                    {catCompleted}/{catTasks.length}
                  </span>
                </button>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Category Progress */}
      {tasks.length > 0 && categoryTasks.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">
              {CATEGORIES.find(c => c.id === activeCategory)?.name}
            </span>
            <span className="text-sm font-medium">{completedCount}/{totalCount}</span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </motion.div>
      )}

      {/* Tasks List */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeCategory}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="space-y-3"
        >
          {categoryTasks.map((task, index) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card
                className={cn(
                  "p-4 transition-all active:scale-[0.98]",
                  task.completed && "opacity-60"
                )}
                onClick={() => handleToggleTask(task.id, task.completed)}
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors",
                    task.completed 
                      ? "bg-primary border-primary" 
                      : "border-muted-foreground/30"
                  )}>
                    {task.completed && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 500 }}
                      >
                        <Check className="w-3.5 h-3.5 text-primary-foreground" />
                      </motion.div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "font-medium text-sm",
                      task.completed && "line-through text-muted-foreground"
                    )}>
                      {task.title}
                    </p>
                    {task.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {task.description}
                      </p>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>

      {/* Empty Category State */}
      {tasks.length > 0 && categoryTasks.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-sm">Keine Aufgaben in dieser Kategorie</p>
        </div>
      )}
    </div>
  );
};
