import { forwardRef } from "react";
import { Lock } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
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

// Wrapper component to handle ref forwarding for motion.div inside Tooltip
const AchievementItem = forwardRef<HTMLDivElement, { 
  achievement: Achievement; 
  index: number;
  children?: React.ReactNode;
}>(({ achievement, index, ...props }, ref) => (
  <motion.div
    ref={ref}
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay: index * 0.05 }}
    className={cn(
      "relative aspect-square rounded-xl flex items-center justify-center text-2xl cursor-pointer transition-all",
      achievement.unlocked
        ? "bg-primary/10 border-2 border-primary/30 hover:scale-110 hover:border-primary/50"
        : "bg-muted/50 border-2 border-transparent grayscale opacity-50"
    )}
    {...props}
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
  </motion.div>
));

AchievementItem.displayName = "AchievementItem";


interface AchievementsGridProps {
  achievements: Achievement[];
  showAll?: boolean;
  maxDisplay?: number;
}

const categoryOrder = ["analysis", "streak", "improvement", "level", "tasks"];

export const AchievementsGrid = ({
  achievements,
  showAll = false,
  maxDisplay = 8,
}: AchievementsGridProps) => {
  // Sort: unlocked first, then by category
  const sortedAchievements = [...achievements].sort((a, b) => {
    if (a.unlocked !== b.unlocked) return a.unlocked ? -1 : 1;
    return categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category);
  });

  const displayAchievements = showAll
    ? sortedAchievements
    : sortedAchievements.slice(0, maxDisplay);

  const unlockedCount = achievements.filter((a) => a.unlocked).length;

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
              <AchievementItem achievement={achievement} index={index} />
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

      {!showAll && achievements.length > maxDisplay && (
        <p className="text-center text-sm text-muted-foreground">
          +{achievements.length - maxDisplay} weitere Achievements
        </p>
      )}
    </div>
  );
};
