import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useWeeklyChallenges } from "@/hooks/useWeeklyChallenges";
import { 
  Zap, 
  Trophy, 
  Clock, 
  ChevronRight, 
  Loader2,
  Play,
  X,
  CheckCircle2,
  Sparkles,
  XCircle,
  Calendar
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { format, differenceInDays, differenceInHours } from "date-fns";
import { de } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface WeeklyChallengeCardProps {
  className?: string;
}

const difficultyColors: Record<string, string> = {
  easy: "bg-green-500/20 text-green-400 border-green-500/30",
  medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  hard: "bg-red-500/20 text-red-400 border-red-500/30",
};

const difficultyLabels: Record<string, string> = {
  easy: "Leicht",
  medium: "Mittel",
  hard: "Schwer",
};

export function WeeklyChallengeCard({ className }: WeeklyChallengeCardProps) {
  const { 
    currentChallenge, 
    availableChallenges, 
    completedChallenges,
    loading, 
    startChallenge, 
    completeChallenge,
    canComplete,
    getDaysRemaining,
    abandonChallenge 
  } = useWeeklyChallenges();
  const [showChallengeList, setShowChallengeList] = useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [startingId, setStartingId] = useState<string | null>(null);
  const [abandoning, setAbandoning] = useState(false);
  const [completing, setCompleting] = useState(false);

  const handleStartChallenge = async (challengeId: string) => {
    setStartingId(challengeId);
    const success = await startChallenge(challengeId);
    if (success) {
      setShowChallengeList(false);
    }
    setStartingId(null);
  };

  const handleAbandon = async () => {
    setAbandoning(true);
    await abandonChallenge();
    setAbandoning(false);
  };

  const handleComplete = async (success: boolean) => {
    setCompleting(true);
    await completeChallenge(success);
    setCompleting(false);
    setShowCompleteDialog(false);
  };

  const getTimeRemaining = (endsAt: string) => {
    const end = new Date(endsAt);
    const now = new Date();
    const days = differenceInDays(end, now);
    if (days > 0) return `${days} Tage`;
    const hours = differenceInHours(end, now);
    return `${hours} Stunden`;
  };

  const daysRemaining = getDaysRemaining();
  const isCompletable = canComplete();

  // Calculate progress and days passed
  const getDaysPassed = () => {
    if (!currentChallenge) return 0;
    const startedAt = new Date(currentChallenge.started_at);
    const now = new Date();
    return Math.min(7, Math.floor((now.getTime() - startedAt.getTime()) / (1000 * 60 * 60 * 24)));
  };

  const getProgressFromDays = () => {
    const daysPassed = getDaysPassed();
    return Math.min(100, Math.round((daysPassed / 7) * 100));
  };

  const daysPassed = getDaysPassed();
  const progressPercent = getProgressFromDays();

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
    <>
      <Card className={cn("overflow-hidden", className)}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              Weekly Challenge
            </CardTitle>
            {completedChallenges.length > 0 && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Trophy className="w-3.5 h-3.5 text-yellow-500" />
                {completedChallenges.length} abgeschlossen
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {currentChallenge ? (
            <div className="space-y-4">
              {/* Active Challenge */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent p-4 border border-primary/20"
              >
                {/* Decorative */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-2xl" />
                
                <div className="relative">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="text-2xl mb-1">
                        {currentChallenge.challenge?.icon || "🎯"}
                      </div>
                      <h3 className="font-bold text-lg">
                        {currentChallenge.challenge?.title}
                      </h3>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={difficultyColors[currentChallenge.challenge?.difficulty || "medium"]}
                    >
                      {difficultyLabels[currentChallenge.challenge?.difficulty || "medium"]}
                    </Badge>
                  </div>

                  <p className="text-sm text-muted-foreground mb-4">
                    {currentChallenge.challenge?.description}
                  </p>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        Tag {daysPassed} von 7
                      </span>
                      <span className="font-medium text-primary">{progressPercent}%</span>
                    </div>
                    <Progress value={progressPercent} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      +{Math.round(100/7)}% pro Tag
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="w-3.5 h-3.5" />
                      {isCompletable ? (
                        <span className="text-green-500 font-medium">Bereit zum Abschließen!</span>
                      ) : (
                        <span>Noch {daysRemaining} Tag(e) bis Abschluss möglich</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="bg-primary/20 text-primary">
                        <Sparkles className="w-3 h-3 mr-1" />
                        +{currentChallenge.challenge?.xp_reward || 100} XP
                      </Badge>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  variant={isCompletable ? "default" : "outline"}
                  size="sm"
                  className="flex-1"
                  onClick={() => setShowCompleteDialog(true)}
                  disabled={!isCompletable}
                >
                  <CheckCircle2 className="w-4 h-4 mr-1" />
                  {isCompletable ? "Abschließen" : `Noch ${daysRemaining} Tage`}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={handleAbandon}
                  disabled={abandoning}
                >
                  {abandoning ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <X className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-medium mb-1">Keine aktive Challenge</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Starte eine Challenge für extra XP!
              </p>

              <Dialog open={showChallengeList} onOpenChange={setShowChallengeList}>
                <DialogTrigger asChild>
                  <Button>
                    <Play className="w-4 h-4 mr-2" />
                    Challenge starten
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Wähle eine Challenge</DialogTitle>
                    <DialogDescription>
                      Challenges können erst nach 7 Tagen abgeschlossen werden.
                    </DialogDescription>
                  </DialogHeader>
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-3 pt-4">
                      <AnimatePresence>
                        {availableChallenges.map((challenge, index) => (
                          <motion.div
                            key={challenge.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="p-4 rounded-xl border border-border hover:border-primary/30 bg-card transition-all"
                          >
                            <div className="flex items-start gap-3">
                              <div className="text-2xl">{challenge.icon || "🎯"}</div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-bold">{challenge.title}</h4>
                                  <Badge 
                                    variant="outline" 
                                    className={cn("text-[10px]", difficultyColors[challenge.difficulty || "medium"])}
                                  >
                                    {difficultyLabels[challenge.difficulty || "medium"]}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mb-3">
                                  {challenge.description}
                                </p>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      7 Tage Minimum
                                    </span>
                                    <Badge variant="secondary" className="text-xs">
                                      +{challenge.xp_reward || 100} XP
                                    </Badge>
                                  </div>
                                  <Button
                                    size="sm"
                                    onClick={() => handleStartChallenge(challenge.id)}
                                    disabled={startingId === challenge.id}
                                  >
                                    {startingId === challenge.id ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <>
                                        Starten
                                        <ChevronRight className="w-4 h-4 ml-1" />
                                      </>
                                    )}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </ScrollArea>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Complete Challenge Dialog */}
      <AlertDialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              Challenge abschließen
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Hast du die Challenge <strong>"{currentChallenge?.challenge?.title}"</strong> erfolgreich gemeistert?
              </p>
              <p className="text-xs">
                Sei ehrlich zu dir selbst - bei Erfolg erhältst du <strong>+{currentChallenge?.challenge?.xp_reward || 100} XP</strong>!
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel disabled={completing}>Abbrechen</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={() => handleComplete(false)}
              disabled={completing}
              className="gap-2"
            >
              {completing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <XCircle className="w-4 h-4" />
              )}
              Nicht geschafft
            </Button>
            <Button
              onClick={() => handleComplete(true)}
              disabled={completing}
              className="gap-2 bg-green-600 hover:bg-green-700"
            >
              {completing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              Ja, geschafft!
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
