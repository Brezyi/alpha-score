import { memo, useMemo } from "react";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
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

// Memoized achievement item
const AchievementItem = memo(({ 
  achievement, 
  index 
}: { 
  achievement: Achievement; 
  index: number;
}) => (
  <div
    className={cn(
      "relative aspect-square rounded-xl flex items-center justify-center text-2xl cursor-pointer transition-transform duration-200 animate-fade-in",
      achievement.unlocked
        ? "bg-primary/10 border-2 border-primary/30 hover:scale-110 hover:border-primary/50"
        : "bg-muted/50 border-2 border-transparent grayscale opacity-50"
    )}
    style={{ animationDelay: `${index * 30}ms` }}
  >
    {achievement.unlocked ? (
      <span>{achievement.icon}</span>
    ) : (
      <div className="relative">
        <span className="blur-[2px]">{achievement.icon}</span>
        <Lock className="absolute inset-0 m-auto w-4 h-4 text-muted-foreground" />
      </div>
    )}
    
    {achievement.unlocked && (
      <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-green-500 border-2 border-background" />
    )}
  </div>
));

AchievementItem.displayName = "AchievementItem";

interface AchievementsGridProps {
  achievements: Achievement[];
  showAll?: boolean;
  maxDisplay?: number;
}

const categoryOrder = ["analysis", "streak", "improvement", "level", "tasks", "score", "special"];

export const AchievementsGrid = memo(({
  achievements,
  showAll = false,
  maxDisplay = 8,
}: AchievementsGridProps) => {
  const navigate = useNavigate();
  
  // Memoize sorted achievements
  const sortedAchievements = useMemo(() => {
    return [...achievements].sort((a, b) => {
      if (a.unlocked !== b.unlocked) return a.unlocked ? -1 : 1;
      return categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category);
    });
  }, [achievements]);

  const displayAchievements = useMemo(() => {
    return showAll ? sortedAchievements : sortedAchievements.slice(0, maxDisplay);
  }, [sortedAchievements, showAll, maxDisplay]);

  const unlockedCount = useMemo(() => {
    return achievements.filter((a) => a.unlocked).length;
  }, [achievements]);

  const remainingCount = achievements.length - maxDisplay;

  const handleMoreClick = () => {
    navigate("/progress#achievements");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-lg flex items-center gap-2">
          🏆 Achievements
        </h3>
        <span className="text-sm text-muted-foreground">
          {unlockedCount}/{achievements.length} freigeschaltet
        </span>
      </div>

      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
        {displayAchievements.map((achievement, index) => (
          <Tooltip key={achievement.id}>
            <TooltipTrigger asChild>
              <div>
                <AchievementItem achievement={achievement} index={index} />
              </div>
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
      </div>

      {!showAll && remainingCount > 0 && (
        <button 
          onClick={handleMoreClick}
          className="w-full text-center text-sm text-primary hover:text-primary/80 transition-colors font-medium py-2 hover:bg-primary/5 rounded-lg"
        >
          +{remainingCount} weitere Achievements ansehen →
        </button>
      )}
    </div>
  );
});

AchievementsGrid.displayName = "AchievementsGrid";
