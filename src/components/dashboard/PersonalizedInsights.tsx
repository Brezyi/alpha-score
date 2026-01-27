import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Lightbulb, 
  Droplets, 
  Moon, 
  Dumbbell, 
  Apple, 
  Sparkles,
  ChevronRight,
  AlertCircle
} from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface LifestyleEntry {
  sleep_hours?: number | null;
  water_liters?: number | null;
  exercise_minutes?: number | null;
}

interface PersonalizedInsightsProps {
  weaknesses: string[];
  priorities?: string[];
  lifestyleData?: LifestyleEntry | null;
  gender?: string | null;
}

interface Tip {
  id: string;
  icon: typeof Lightbulb;
  title: string;
  description: string;
  category: string;
  priority: number;
  link?: string;
  color: string;
}

// Mapping of weaknesses to specific tips
const WEAKNESS_TIPS: Record<string, Tip[]> = {
  "Haut": [
    { id: "skin-water", icon: Droplets, title: "Mehr trinken", description: "2-3L Wasser täglich verbessern deine Haut sichtbar", category: "lifestyle", priority: 1, link: "/lifestyle", color: "text-cyan-400" },
    { id: "skin-sleep", icon: Moon, title: "Schlaf optimieren", description: "7-8h Schlaf für bessere Hautregeneration", category: "lifestyle", priority: 2, link: "/lifestyle", color: "text-indigo-400" },
  ],
  "Hautqualität": [
    { id: "skinq-routine", icon: Sparkles, title: "Skincare Routine", description: "Tägliche Reinigung & Feuchtigkeitspflege", category: "care", priority: 1, color: "text-primary" },
    { id: "skinq-water", icon: Droplets, title: "Hydration", description: "Mindestens 2L Wasser pro Tag", category: "lifestyle", priority: 2, link: "/lifestyle", color: "text-cyan-400" },
  ],
  "Akne": [
    { id: "acne-clean", icon: Sparkles, title: "Sanfte Reinigung", description: "2x täglich mit mildem Cleanser", category: "care", priority: 1, color: "text-primary" },
    { id: "acne-diet", icon: Apple, title: "Ernährung anpassen", description: "Weniger Zucker und Milchprodukte", category: "nutrition", priority: 2, color: "text-green-400" },
  ],
  "Jawline": [
    { id: "jaw-mewing", icon: Dumbbell, title: "Mewing üben", description: "Zungenhaltung für bessere Kieferform", category: "exercise", priority: 1, link: "/plan?exercise=mewing#face-fitness", color: "text-orange-400" },
    { id: "jaw-bodyfat", icon: Apple, title: "Körperfett reduzieren", description: "Niedrigerer KFA macht Jawline sichtbarer", category: "nutrition", priority: 2, color: "text-green-400" },
  ],
  "Körperbau": [
    { id: "body-train", icon: Dumbbell, title: "Krafttraining", description: "3-4x pro Woche für mehr Muskelmasse", category: "exercise", priority: 1, color: "text-orange-400" },
    { id: "body-protein", icon: Apple, title: "Protein erhöhen", description: "1.6-2g pro kg Körpergewicht", category: "nutrition", priority: 2, color: "text-green-400" },
  ],
  "Muskulatur": [
    { id: "muscle-train", icon: Dumbbell, title: "Progressive Überladung", description: "Gewichte kontinuierlich steigern", category: "exercise", priority: 1, color: "text-orange-400" },
    { id: "muscle-sleep", icon: Moon, title: "Regeneration", description: "8h Schlaf für maximales Muskelwachstum", category: "lifestyle", priority: 2, link: "/lifestyle", color: "text-indigo-400" },
  ],
  "Haare": [
    { id: "hair-care", icon: Sparkles, title: "Haarpflege", description: "Qualitäts-Shampoo und weniger Hitze", category: "care", priority: 1, color: "text-primary" },
    { id: "hair-biotin", icon: Apple, title: "Biotin Supplement", description: "Unterstützt gesundes Haarwachstum", category: "supplement", priority: 2, link: "/lifestyle", color: "text-green-400" },
  ],
  "Augenbrauen": [
    { id: "brows-shape", icon: Sparkles, title: "Professionell formen", description: "Zum Barber oder Kosmetiker gehen", category: "care", priority: 1, color: "text-primary" },
  ],
  "Augen": [
    { id: "eyes-sleep", icon: Moon, title: "Ausreichend schlafen", description: "Gegen Augenringe: 7-8h Schlaf", category: "lifestyle", priority: 1, link: "/lifestyle", color: "text-indigo-400" },
    { id: "eyes-screen", icon: AlertCircle, title: "Bildschirm-Pausen", description: "20-20-20 Regel für strahlende Augen", category: "habit", priority: 2, color: "text-amber-400" },
  ],
  "Symmetrie": [
    { id: "sym-posture", icon: Dumbbell, title: "Haltung verbessern", description: "Bewusste Körperhaltung trainieren", category: "exercise", priority: 1, color: "text-orange-400" },
  ],
  "Gesichtsbehaarung": [
    { id: "beard-care", icon: Sparkles, title: "Bartpflege", description: "Regelmäßig trimmen und pflegen", category: "care", priority: 1, color: "text-primary" },
  ],
};

// Lifestyle-based tips
function getLifestyleTips(data: LifestyleEntry | null | undefined): Tip[] {
  if (!data) return [];
  const tips: Tip[] = [];
  
  if (data.sleep_hours !== null && data.sleep_hours !== undefined && data.sleep_hours < 7) {
    tips.push({
      id: "lifestyle-sleep-low",
      icon: Moon,
      title: "Mehr Schlaf",
      description: `Du schläfst nur ${data.sleep_hours}h – versuche 7-8h zu erreichen`,
      category: "lifestyle",
      priority: 0,
      link: "/lifestyle",
      color: "text-indigo-400"
    });
  }
  
  if (data.water_liters !== null && data.water_liters !== undefined && data.water_liters < 2) {
    tips.push({
      id: "lifestyle-water-low",
      icon: Droplets,
      title: "Mehr trinken",
      description: `Nur ${data.water_liters}L heute – Ziel: mindestens 2L`,
      category: "lifestyle",
      priority: 0,
      link: "/lifestyle",
      color: "text-cyan-400"
    });
  }
  
  if (data.exercise_minutes !== null && data.exercise_minutes !== undefined && data.exercise_minutes < 30) {
    tips.push({
      id: "lifestyle-exercise-low",
      icon: Dumbbell,
      title: "Bewegung",
      description: "30-60 Min Training verbessern Körper und Ausstrahlung",
      category: "exercise",
      priority: 1,
      color: "text-orange-400"
    });
  }
  
  return tips;
}

export function PersonalizedInsights({ 
  weaknesses, 
  priorities, 
  lifestyleData,
  gender 
}: PersonalizedInsightsProps) {
  const tips = useMemo(() => {
    const allTips: Tip[] = [];
    
    // Add lifestyle-based tips first (highest priority)
    allTips.push(...getLifestyleTips(lifestyleData));
    
    // Add weakness-based tips
    const processedWeaknesses = new Set<string>();
    
    // First check priorities, then weaknesses
    const combinedList = [...(priorities || []), ...weaknesses];
    
    for (const item of combinedList) {
      // Normalize and match
      const normalized = item.toLowerCase();
      
      for (const [key, keyTips] of Object.entries(WEAKNESS_TIPS)) {
        if (normalized.includes(key.toLowerCase()) && !processedWeaknesses.has(key)) {
          processedWeaknesses.add(key);
          allTips.push(...keyTips);
          break;
        }
      }
    }
    
    // Sort by priority and limit
    return allTips
      .sort((a, b) => a.priority - b.priority)
      .slice(0, 4);
  }, [weaknesses, priorities, lifestyleData]);

  if (tips.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="mb-8"
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Lightbulb className="w-4 h-4 text-primary" />
        </div>
        <h2 className="font-semibold">Tipps</h2>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {tips.map((tip, index) => (
          <motion.div
            key={tip.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 * index }}
          >
            {tip.link ? (
              <Link to={tip.link}>
                <Card className="group hover:bg-muted/50 transition-colors cursor-pointer h-full">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                        tip.color === "text-primary" ? "bg-primary/10" :
                        tip.color === "text-cyan-400" ? "bg-cyan-500/10" :
                        tip.color === "text-indigo-400" ? "bg-indigo-500/10" :
                        tip.color === "text-orange-400" ? "bg-orange-500/10" :
                        tip.color === "text-green-400" ? "bg-green-500/10" :
                        tip.color === "text-amber-400" ? "bg-amber-500/10" :
                        "bg-muted"
                      )}>
                        <tip.icon className={cn("w-5 h-5", tip.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium text-sm">{tip.title}</h3>
                          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {tip.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ) : (
              <Card className="h-full">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                      tip.color === "text-primary" ? "bg-primary/10" :
                      tip.color === "text-cyan-400" ? "bg-cyan-500/10" :
                      tip.color === "text-indigo-400" ? "bg-indigo-500/10" :
                      tip.color === "text-orange-400" ? "bg-orange-500/10" :
                      tip.color === "text-green-400" ? "bg-green-500/10" :
                      tip.color === "text-amber-400" ? "bg-amber-500/10" :
                      "bg-muted"
                    )}>
                      <tip.icon className={cn("w-5 h-5", tip.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm">{tip.title}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {tip.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
