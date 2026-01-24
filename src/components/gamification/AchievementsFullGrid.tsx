import { useState, useMemo } from "react";
import { Lock, Filter, Trophy, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Achievement {
  id: string;
  key: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  xpReward: number;
  unlocked: boolean;
  unlockedAt?: string;
}

interface AchievementsFullGridProps {
  achievements: Achievement[];
  loading?: boolean;
}

const categoryLabels: Record<string, { label: string; emoji: string }> = {
  analysis: { label: "Analysen", emoji: "📸" },
  streak: { label: "Streaks", emoji: "🔥" },
  improvement: { label: "Verbesserung", emoji: "📈" },
  level: { label: "Level", emoji: "⭐" },
  tasks: { label: "Aufgaben", emoji: "✅" },
  score: { label: "Score", emoji: "🎯" },
  special: { label: "Speziell", emoji: "✨" },
};

const categoryOrder = ["analysis", "streak", "improvement", "level", "tasks", "score", "special"];

type FilterType = "all" | "unlocked" | "locked" | string;

export const AchievementsFullGrid = ({
  achievements,
  loading = false,
}: AchievementsFullGridProps) => {
  const [filter, setFilter] = useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const categories = useMemo(() => {
    const cats = new Set(achievements.map((a) => a.category));
    return categoryOrder.filter((c) => cats.has(c));
  }, [achievements]);

  const filteredAchievements = useMemo(() => {
    let filtered = [...achievements];

    // Apply status filter
    if (filter === "unlocked") {
      filtered = filtered.filter((a) => a.unlocked);
    } else if (filter === "locked") {
      filtered = filtered.filter((a) => !a.unlocked);
    } else if (filter !== "all" && categories.includes(filter)) {
      filtered = filtered.filter((a) => a.category === filter);
    }

    // Apply search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.description.toLowerCase().includes(q)
      );
    }

    // Sort: unlocked first, then by category order, then by XP reward
    return filtered.sort((a, b) => {
      if (a.unlocked !== b.unlocked) return a.unlocked ? -1 : 1;
      const catDiff = categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category);
      if (catDiff !== 0) return catDiff;
      return b.xpReward - a.xpReward;
    });
  }, [achievements, filter, searchQuery, categories]);

  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const totalXpEarned = achievements
    .filter((a) => a.unlocked)
    .reduce((sum, a) => sum + a.xpReward, 0);

  if (loading) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Trophy className="w-8 h-8 animate-pulse mx-auto mb-3" />
        Lade Achievements...
      </div>
    );
  }

  return (
    <div className="space-y-6" id="achievements">
      {/* Header Stats */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            🏆 Alle Achievements
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {unlockedCount} von {achievements.length} freigeschaltet • {totalXpEarned.toLocaleString()} XP verdient
          </p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Achievements durchsuchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
          >
            Alle
          </Button>
          <Button
            variant={filter === "unlocked" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("unlocked")}
          >
            ✓ Freigeschaltet
          </Button>
          <Button
            variant={filter === "locked" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("locked")}
          >
            🔒 Gesperrt
          </Button>
        </div>
      </div>

      {/* Category Filters */}
      <div className="flex gap-2 flex-wrap">
        {categories.map((cat) => {
          const info = categoryLabels[cat] || { label: cat, emoji: "📦" };
          const count = achievements.filter((a) => a.category === cat).length;
          const unlockedCat = achievements.filter((a) => a.category === cat && a.unlocked).length;
          return (
            <Button
              key={cat}
              variant={filter === cat ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(filter === cat ? "all" : cat)}
              className="gap-1"
            >
              <span>{info.emoji}</span>
              <span>{info.label}</span>
              <span className="text-xs opacity-70">({unlockedCat}/{count})</span>
            </Button>
          );
        })}
      </div>

      {/* Achievements Grid */}
      <div className="max-h-[600px] overflow-y-auto pr-2 scrollbar-thin">
        <AnimatePresence mode="popLayout">
          {filteredAchievements.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12 text-muted-foreground"
            >
              <Filter className="w-8 h-8 mx-auto mb-3 opacity-50" />
              Keine Achievements gefunden
            </motion.div>
          ) : (
            <motion.div
              layout
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
            >
              {filteredAchievements.map((achievement, index) => (
                <Tooltip key={achievement.id}>
                  <TooltipTrigger asChild>
                    <motion.div
                      layout
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ delay: Math.min(index * 0.02, 0.3) }}
                      className={cn(
                        "relative flex flex-col items-center gap-2 p-4 rounded-xl text-center transition-all cursor-pointer",
                        achievement.unlocked
                          ? "bg-primary/10 border-2 border-primary/30 hover:border-primary/50 hover:scale-105"
                          : "bg-muted/30 border-2 border-transparent opacity-60 hover:opacity-80"
                      )}
                    >
                      {/* Icon */}
                      <div className="relative">
                        {achievement.unlocked ? (
                          <span className="text-4xl">{achievement.icon}</span>
                        ) : (
                          <>
                            <span className="text-4xl blur-[3px] opacity-50">{achievement.icon}</span>
                            <Lock className="absolute inset-0 m-auto w-5 h-5 text-muted-foreground" />
                          </>
                        )}
                      </div>

                      {/* Name */}
                      <span
                        className={cn(
                          "text-sm font-medium line-clamp-2",
                          !achievement.unlocked && "text-muted-foreground"
                        )}
                      >
                        {achievement.name}
                      </span>

                      {/* XP */}
                      <span
                        className={cn(
                          "text-xs",
                          achievement.unlocked ? "text-primary" : "text-muted-foreground"
                        )}
                      >
                        +{achievement.xpReward} XP
                      </span>

                      {/* Category Badge */}
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                        {categoryLabels[achievement.category]?.label || achievement.category}
                      </span>

                      {/* Unlocked indicator */}
                      {achievement.unlocked && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-green-500 border-2 border-background flex items-center justify-center">
                          <span className="text-[8px] text-white">✓</span>
                        </div>
                      )}
                    </motion.div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <div className="space-y-1">
                      <p className="font-semibold flex items-center gap-2">
                        {achievement.icon} {achievement.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {achievement.description}
                      </p>
                      <p className="text-xs text-primary">+{achievement.xpReward} XP</p>
                      {achievement.unlocked && achievement.unlockedAt && (
                        <p className="text-[10px] text-green-500">
                          ✓ Freigeschaltet am{" "}
                          {new Date(achievement.unlockedAt).toLocaleDateString("de-DE")}
                        </p>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
