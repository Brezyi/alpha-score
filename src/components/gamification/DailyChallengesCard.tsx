import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, Zap, Loader2, Clock, Lock } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Challenge {
  challengeId: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  xpReward: number;
  difficulty: string;
  completed: boolean;
}

interface DailyChallengesCardProps {
  challenges: Challenge[];
  loading: boolean;
  onComplete: (challengeId: string) => Promise<void>;
}

const useCountdownToMidnight = () => {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0);
      
      const diff = midnight.getTime() - now.getTime();
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setTimeLeft({ hours, minutes, seconds });
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    
    return () => clearInterval(interval);
  }, []);

  return timeLeft;
};

// Check if a challenge is an "avoid/abstain" type that requires waiting until evening
const isAvoidChallenge = (title: string): boolean => {
  const avoidKeywords = ["verzichte", "vermeide", "kein", "ohne", "nicht"];
  const lowerTitle = title.toLowerCase();
  return avoidKeywords.some(keyword => lowerTitle.includes(keyword));
};

// Check if it's past 8 PM (20:00)
const useIsEvening = () => {
  const [isEvening, setIsEvening] = useState(() => new Date().getHours() >= 20);

  useEffect(() => {
    const checkTime = () => {
      setIsEvening(new Date().getHours() >= 20);
    };

    const interval = setInterval(checkTime, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  return isEvening;
};

export const DailyChallengesCard = ({
  challenges,
  loading,
  onComplete,
}: DailyChallengesCardProps) => {
  const completedCount = challenges.filter((c) => c.completed).length;
  const totalXpPossible = challenges.reduce((acc, c) => acc + c.xpReward, 0);
  const earnedXp = challenges
    .filter((c) => c.completed)
    .reduce((acc, c) => acc + c.xpReward, 0);
  const { hours, minutes, seconds } = useCountdownToMidnight();
  const isEvening = useIsEvening();

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "text-emerald-500";
      case "medium":
        return "text-amber-500";
      case "hard":
        return "text-destructive";
      default:
        return "text-muted-foreground";
    }
  };

  const canCompleteChallenge = (challenge: Challenge): boolean => {
    if (challenge.completed) return false;
    if (isAvoidChallenge(challenge.title)) {
      return isEvening;
    }
    return true;
  };

  if (loading) {
    return (
      <div className="p-6 rounded-2xl glass-card">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-5 rounded-2xl glass-card"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-lg flex items-center gap-2">
              🎯 Tägliche Challenges
            </h3>
            <p className="text-sm text-muted-foreground">
              {completedCount}/{challenges.length} abgeschlossen
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <Zap className="w-4 h-4" />
              <span>{earnedXp}/{totalXpPossible || challenges.reduce((acc, c) => acc + c.xpReward, 0)} XP</span>
            </div>
            <motion.div 
              className="flex items-center gap-1.5 text-xs text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Clock className="w-3 h-3" />
              <span className="font-mono">
                {String(hours).padStart(2, '0')}:{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
              </span>
            </motion.div>
          </div>
        </div>

        <div className="space-y-3">
          {challenges.map((challenge, index) => {
            const isAvoid = isAvoidChallenge(challenge.title);
            const canComplete = canCompleteChallenge(challenge);
            const isLocked = isAvoid && !isEvening && !challenge.completed;

            return (
              <motion.div
                key={challenge.challengeId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl transition-all",
                  challenge.completed
                    ? "bg-emerald-500/10 border border-emerald-500/20"
                    : "bg-muted/50 hover:bg-muted/70"
                )}
              >
                <span className="text-2xl">{challenge.icon}</span>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className={cn(
                      "font-medium truncate",
                      challenge.completed && "line-through text-muted-foreground"
                    )}>
                      {challenge.title}
                    </h4>
                    <span className={cn("text-xs", getDifficultyColor(challenge.difficulty))}>
                      {challenge.difficulty === "easy" && "Einfach"}
                      {challenge.difficulty === "medium" && "Mittel"}
                      {challenge.difficulty === "hard" && "Schwer"}
                    </span>
                    {isLocked && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        ab 20:00
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {challenge.description}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-primary whitespace-nowrap">
                    +{challenge.xpReward} XP
                  </span>
                  
                  {challenge.completed ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                  ) : isLocked ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="h-8 w-8 rounded-full bg-muted/50 flex items-center justify-center cursor-not-allowed">
                          <Lock className="w-4 h-4 text-muted-foreground" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Diese Challenge kann erst ab 20:00 Uhr abgeschlossen werden</p>
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full hover:bg-primary/20"
                      onClick={() => onComplete(challenge.challengeId)}
                    >
                      <Circle className="w-5 h-5" />
                    </Button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {completedCount === challenges.length && challenges.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-4 p-3 rounded-xl bg-gradient-to-r from-emerald-500/20 to-primary/20 text-center"
          >
            <p className="text-sm font-medium">
              🎉 Alle Challenges abgeschlossen! Komm morgen wieder!
            </p>
          </motion.div>
        )}
      </motion.div>
    </TooltipProvider>
  );
};
