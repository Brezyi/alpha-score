import { Card } from "@/components/ui/card";
import { 
  Flame, 
  Gift, 
  Lock, 
  Check,
  Sparkles,
  Star,
  Crown,
  Zap,
  Trophy
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface StreakReward {
  days: number;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
}

const STREAK_REWARDS: StreakReward[] = [
  {
    days: 3,
    title: "Starter",
    description: "3 Tage Streak erreicht!",
    icon: Flame,
    color: "text-orange-500",
    bgColor: "bg-orange-500/20"
  },
  {
    days: 7,
    title: "Konstant",
    description: "Eine volle Woche dabei!",
    icon: Star,
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/20"
  },
  {
    days: 14,
    title: "Dedicatiert",
    description: "2 Wochen durchgehalten!",
    icon: Zap,
    color: "text-blue-500",
    bgColor: "bg-blue-500/20"
  },
  {
    days: 30,
    title: "Champion",
    description: "Ein ganzer Monat!",
    icon: Trophy,
    color: "text-purple-500",
    bgColor: "bg-purple-500/20"
  },
  {
    days: 60,
    title: "Elite",
    description: "60 Tage Streak!",
    icon: Crown,
    color: "text-amber-500",
    bgColor: "bg-amber-500/20"
  },
  {
    days: 100,
    title: "Legende",
    description: "100 Tage Streak!",
    icon: Sparkles,
    color: "text-primary",
    bgColor: "bg-primary/20"
  }
];

interface StreakRewardsProps {
  currentStreak: number;
  longestStreak: number;
  className?: string;
  compact?: boolean;
}

export function StreakRewards({ currentStreak, longestStreak, className, compact = false }: StreakRewardsProps) {
  const unlockedRewards = STREAK_REWARDS.filter(r => longestStreak >= r.days);
  const nextReward = STREAK_REWARDS.find(r => currentStreak < r.days);
  const progressToNext = nextReward 
    ? Math.min((currentStreak / nextReward.days) * 100, 100) 
    : 100;

  if (compact) {
    return (
      <Card className={cn("p-4", className)}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
              <Flame className="w-4 h-4 text-orange-500" />
            </div>
            <div>
              <div className="font-bold text-lg">{currentStreak} Tage</div>
              <div className="text-xs text-muted-foreground">Aktueller Streak</div>
            </div>
          </div>
          <div className="flex -space-x-2">
            {unlockedRewards.slice(-3).map((reward, i) => (
              <motion.div
                key={reward.days}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center border-2 border-background",
                  reward.bgColor
                )}
              >
                <reward.icon className={cn("w-4 h-4", reward.color)} />
              </motion.div>
            ))}
          </div>
        </div>
        
        {nextReward && (
          <div>
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Nächste Belohnung: {nextReward.title}</span>
              <span>{currentStreak}/{nextReward.days} Tage</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-500"
                initial={{ width: 0 }}
                animate={{ width: `${progressToNext}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        )}
      </Card>
    );
  }

  return (
    <Card className={cn("p-6", className)}>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
          <Gift className="w-5 h-5 text-orange-500" />
        </div>
        <div>
          <h3 className="font-bold">Streak-Belohnungen</h3>
          <p className="text-xs text-muted-foreground">
            {unlockedRewards.length} von {STREAK_REWARDS.length} freigeschaltet
          </p>
        </div>
      </div>

      {/* Current Streak Display */}
      <div className="text-center mb-6 p-4 rounded-xl bg-gradient-to-br from-orange-500/10 to-amber-500/10 border border-orange-500/20">
        <motion.div
          animate={currentStreak >= 3 ? { 
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0]
          } : {}}
          transition={{ duration: 0.5, repeat: currentStreak >= 7 ? Infinity : 0, repeatDelay: 2 }}
        >
          <Flame className={cn(
            "w-12 h-12 mx-auto mb-2",
            currentStreak >= 7 ? "text-orange-500" : "text-muted-foreground"
          )} />
        </motion.div>
        <div className="text-3xl font-bold">{currentStreak}</div>
        <div className="text-sm text-muted-foreground">Tage Streak</div>
        {longestStreak > currentStreak && (
          <div className="text-xs text-primary mt-1">
            Rekord: {longestStreak} Tage
          </div>
        )}
      </div>

      {/* Rewards Grid */}
      <div className="grid grid-cols-3 gap-3">
        {STREAK_REWARDS.map((reward, index) => {
          const isUnlocked = longestStreak >= reward.days;
          const isCurrent = currentStreak >= reward.days && 
            (index === STREAK_REWARDS.length - 1 || currentStreak < STREAK_REWARDS[index + 1].days);
          
          return (
            <motion.div
              key={reward.days}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={cn(
                "relative p-3 rounded-xl text-center transition-all",
                isUnlocked 
                  ? reward.bgColor + " border border-transparent" 
                  : "bg-muted/30 border border-dashed border-muted-foreground/20",
                isCurrent && "ring-2 ring-primary ring-offset-2 ring-offset-background"
              )}
            >
              {isUnlocked ? (
                <reward.icon className={cn("w-6 h-6 mx-auto mb-1", reward.color)} />
              ) : (
                <Lock className="w-6 h-6 mx-auto mb-1 text-muted-foreground/50" />
              )}
              <div className={cn(
                "text-xs font-semibold",
                isUnlocked ? "text-foreground" : "text-muted-foreground"
              )}>
                {reward.title}
              </div>
              <div className={cn(
                "text-[10px]",
                isUnlocked ? "text-muted-foreground" : "text-muted-foreground/50"
              )}>
                {reward.days} Tage
              </div>
              
              {isUnlocked && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-green-500 flex items-center justify-center"
                >
                  <Check className="w-3 h-3 text-white" />
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Progress to Next */}
      {nextReward && (
        <div className="mt-6 p-4 rounded-xl bg-muted/30">
          <div className="flex items-center gap-3 mb-3">
            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", nextReward.bgColor)}>
              <nextReward.icon className={cn("w-4 h-4", nextReward.color)} />
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium">Nächstes Ziel: {nextReward.title}</div>
              <div className="text-xs text-muted-foreground">{nextReward.description}</div>
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Fortschritt</span>
              <span className="font-medium">{currentStreak} / {nextReward.days} Tage</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <motion.div
                className={cn("h-full rounded-full", 
                  nextReward.color.replace("text-", "bg-")
                )}
                initial={{ width: 0 }}
                animate={{ width: `${progressToNext}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
