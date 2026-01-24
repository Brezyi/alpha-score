import { Progress } from "@/components/ui/progress";
import { Zap, Star } from "lucide-react";
import { motion } from "framer-motion";

interface XpLevelCardProps {
  level: number;
  currentXp: number;
  xpForNextLevel: number;
  progress: number;
  compact?: boolean;
}

export const XpLevelCard = ({
  level,
  currentXp,
  xpForNextLevel,
  progress,
  compact = false,
}: XpLevelCardProps) => {
  const xpInLevel = currentXp % xpForNextLevel;

  if (compact) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
        <div className="relative">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <Star className="w-5 h-5 text-primary" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center text-[10px] font-bold text-primary-foreground">
            {level}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium">Level {level}</span>
            <span className="text-[10px] text-muted-foreground">
              {xpInLevel} / {xpForNextLevel} XP
            </span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-5 rounded-2xl glass-card relative overflow-hidden"
    >
      {/* Background glow */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
      
      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20">
                <Star className="w-7 h-7 text-primary" />
              </div>
              <motion.div 
                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground shadow-lg"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
              >
                {level}
              </motion.div>
            </div>
            <div>
              <h3 className="font-bold text-lg">Level {level}</h3>
              <p className="text-sm text-muted-foreground">
                {getLevelTitle(level)}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 text-primary">
              <Zap className="w-4 h-4" />
              <span className="font-bold">{currentXp}</span>
            </div>
            <span className="text-xs text-muted-foreground">Total XP</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Fortschritt zu Level {level + 1}</span>
            <span className="font-medium">{progress}%</span>
          </div>
          <Progress value={progress} className="h-3" animated />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{xpInLevel} XP</span>
            <span>{xpForNextLevel} XP</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const getLevelTitle = (level: number): string => {
  if (level >= 50) return "Legende";
  if (level >= 30) return "Meister";
  if (level >= 20) return "Elite";
  if (level >= 15) return "Experte";
  if (level >= 10) return "Veteran";
  if (level >= 5) return "Aufsteiger";
  if (level >= 3) return "Lehrling";
  return "Anfänger";
};
