import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useGoals } from "@/hooks/useGoals";
import { 
  Target, 
  Plus, 
  Trash2, 
  Loader2,
  Trophy,
  Calendar,
  TrendingUp
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface GoalCardProps {
  className?: string;
  currentScore?: number | null;
}

export function GoalCard({ className, currentScore }: GoalCardProps) {
  const { activeGoal, goals, loading, createGoal, deleteGoal } = useGoals();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [targetScore, setTargetScore] = useState("7.5");
  const [creating, setCreating] = useState(false);

  const handleCreateGoal = async () => {
    const score = parseFloat(targetScore);
    if (isNaN(score) || score < 1 || score > 10) return;
    
    setCreating(true);
    const result = await createGoal(score);
    if (result) {
      setShowCreateDialog(false);
      setTargetScore("7.5");
    }
    setCreating(false);
  };

  const progressPercent = activeGoal && currentScore 
    ? Math.min((currentScore / activeGoal.target_score) * 100, 100)
    : 0;

  const pointsRemaining = activeGoal && currentScore
    ? Math.max(activeGoal.target_score - currentScore, 0).toFixed(1)
    : null;

  // Completed goals count
  const completedGoals = goals.filter(g => g.achieved_at).length;

  if (loading) {
    return (
      <Card className={cn("", className)}>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Mein Ziel
          </CardTitle>
          {completedGoals > 0 && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Trophy className="w-3.5 h-3.5 text-yellow-500" />
              {completedGoals} erreicht
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {activeGoal ? (
          <div className="space-y-4">
            {/* Current Goal Display */}
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent p-4 border border-primary/20">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-sm text-muted-foreground">Ziel-Score</div>
                  <div className="text-3xl font-bold text-primary">
                    {activeGoal.target_score.toFixed(1)}
                  </div>
                </div>
                {currentScore && (
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">Aktuell</div>
                    <div className="text-2xl font-bold">
                      {currentScore.toFixed(1)}
                    </div>
                  </div>
                )}
              </div>

              <Progress value={progressPercent} className="h-3 mb-2" />
              
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{progressPercent.toFixed(0)}% erreicht</span>
                {pointsRemaining && parseFloat(pointsRemaining) > 0 && (
                  <span>Noch {pointsRemaining} Punkte</span>
                )}
              </div>
            </div>

            {/* Goal Info */}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-4 h-4" />
                Gesetzt am {format(new Date(activeGoal.created_at), "dd. MMM yyyy", { locale: de })}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-destructive hover:text-destructive"
                onClick={() => deleteGoal(activeGoal.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>

            {/* Motivation */}
            {currentScore && currentScore >= activeGoal.target_score && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-3 rounded-lg bg-yellow-500/20 border border-yellow-500/30 text-center"
              >
                <Trophy className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                <div className="font-bold text-yellow-500">Ziel erreicht!</div>
                <div className="text-xs text-muted-foreground">
                  Setze dir ein neues Ziel für weiteren Fortschritt
                </div>
              </motion.div>
            )}
          </div>
        ) : (
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Target className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-medium mb-1">Kein aktives Ziel</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Setze dir ein Ziel, um motiviert zu bleiben
            </p>

            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Ziel setzen
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Neues Ziel setzen</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Ziel-Score</Label>
                    <div className="flex items-center gap-4">
                      <Input
                        type="number"
                        min="1"
                        max="10"
                        step="0.1"
                        value={targetScore}
                        onChange={(e) => setTargetScore(e.target.value)}
                        className="text-center text-xl font-bold"
                      />
                      <span className="text-muted-foreground">/ 10</span>
                    </div>
                    {currentScore && (
                      <p className="text-xs text-muted-foreground">
                        Aktueller Score: {currentScore.toFixed(1)} • 
                        Empfohlen: {Math.min(currentScore + 0.5, 10).toFixed(1)}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {[6.0, 7.0, 7.5, 8.0, 8.5].map((score) => (
                      <Button
                        key={score}
                        variant={targetScore === score.toString() ? "default" : "outline"}
                        size="sm"
                        className="flex-1"
                        onClick={() => setTargetScore(score.toString())}
                      >
                        {score}
                      </Button>
                    ))}
                  </div>

                  <Button 
                    onClick={handleCreateGoal} 
                    className="w-full"
                    disabled={creating}
                  >
                    {creating ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <TrendingUp className="w-4 h-4 mr-2" />
                    )}
                    Ziel aktivieren
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
