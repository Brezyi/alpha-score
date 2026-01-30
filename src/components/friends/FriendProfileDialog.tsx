import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  Flame, 
  Trophy, 
  TrendingUp, 
  Calendar,
  Target,
  EyeOff,
  HandshakeIcon,
  Loader2,
  UserMinus,
  Sparkles
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface FriendProfileDialogProps {
  open: boolean;
  onClose: () => void;
  friendId: string;
  friendName: string | null;
  friendAvatar: string | null;
  connectedSince: string;
  connectionId: string;
  onMakePartner: () => void;
  onRemoveFriend: () => Promise<boolean>;
  isOnline?: boolean;
}

interface FriendStats {
  streak: number | null;
  score: number | null;
  level: number | null;
  totalXp: number | null;
  analysisCount: number | null;
  lastAnalysisDate: string | null;
  showStreak: boolean;
  showScore: "none" | "delta_only" | "full";
  showChallenges: boolean;
}

export function FriendProfileDialog({
  open,
  onClose,
  friendId,
  friendName,
  friendAvatar,
  connectedSince,
  connectionId,
  onMakePartner,
  onRemoveFriend,
  isOnline = false,
}: FriendProfileDialogProps) {
  const [stats, setStats] = useState<FriendStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState(false);

  useEffect(() => {
    if (!open || !friendId) return;

    const fetchStats = async () => {
      setLoading(true);

      // Fetch privacy settings first
      const { data: privacy } = await supabase
        .from("friend_privacy_settings")
        .select("*")
        .eq("user_id", friendId)
        .maybeSingle();

      const showScore = (privacy?.show_score as "none" | "delta_only" | "full") || "full";
      const showStreak = privacy?.show_streak !== false;
      const showChallenges = privacy?.show_challenges !== false;

      // Fetch streak (RLS handles visibility)
      let streak: number | null = null;
      const { data: streakData } = await supabase
        .from("user_streaks")
        .select("current_streak")
        .eq("user_id", friendId)
        .maybeSingle();
      streak = streakData?.current_streak || null;

      // Fetch score (latest analysis) - RLS handles visibility
      let score: number | null = null;
      let lastAnalysisDate: string | null = null;
      const { data: analysisData } = await supabase
        .from("analyses")
        .select("looks_score, created_at")
        .eq("user_id", friendId)
        .eq("status", "completed")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      score = analysisData?.looks_score || null;
      lastAnalysisDate = analysisData?.created_at || null;

      // Fetch XP/Level
      let level: number | null = null;
      let totalXp: number | null = null;
      const { data: xpData } = await supabase
        .from("user_xp")
        .select("level, total_xp")
        .eq("user_id", friendId)
        .maybeSingle();
      level = xpData?.level || null;
      totalXp = xpData?.total_xp || null;

      // Fetch analysis count
      const { count } = await supabase
        .from("analyses")
        .select("id", { count: "exact", head: true })
        .eq("user_id", friendId)
        .eq("status", "completed");

      setStats({
        streak,
        score,
        level,
        totalXp,
        analysisCount: count || 0,
        lastAnalysisDate,
        showStreak,
        showScore,
        showChallenges,
      });
      setLoading(false);
    };

    fetchStats();
  }, [open, friendId]);

  const handleRemove = async () => {
    setRemoving(true);
    const success = await onRemoveFriend();
    setRemoving(false);
    if (success) {
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm rounded-3xl p-0 overflow-hidden border-0 shadow-2xl">
        {/* Animated Header */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="relative bg-gradient-to-br from-primary/30 via-primary/15 to-transparent p-8 pb-20"
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute -top-10 -left-10 w-32 h-32 bg-primary/10 rounded-full blur-2xl" />
          <DialogHeader>
            <DialogTitle className="sr-only">Freund-Profil</DialogTitle>
          </DialogHeader>
        </motion.div>

        {/* Avatar centered with online indicator */}
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="relative -mt-14 flex justify-center"
        >
          <div className="relative">
            <Avatar className="w-28 h-28 ring-4 ring-background shadow-2xl">
              <AvatarImage src={friendAvatar || undefined} />
              <AvatarFallback className="text-4xl font-bold bg-gradient-to-br from-primary/30 to-primary/10 text-primary">
                {friendName?.[0]?.toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
            {isOnline && (
              <div className="absolute bottom-1 right-1 w-6 h-6 bg-green-500 rounded-full border-4 border-background shadow-lg" />
            )}
          </div>
        </motion.div>

        {/* Name and info */}
        <motion.div 
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="text-center px-6 pt-4 pb-2"
        >
          <h2 className="text-2xl font-bold tracking-tight">{friendName || "Freund"}</h2>
          <div className="flex items-center justify-center gap-2 mt-1">
            {isOnline ? (
              <span className="text-sm text-green-500 font-medium">Online</span>
            ) : (
              <span className="text-sm text-muted-foreground">
                Freunde seit {format(new Date(connectedSince), "d. MMM yyyy", { locale: de })}
              </span>
            )}
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div 
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="px-6 py-4"
        >
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-2">
                {/* Streak */}
                <div className="relative overflow-hidden text-center p-4 rounded-2xl bg-gradient-to-br from-orange-500/10 to-orange-500/5 border border-orange-500/10">
                  <div className="flex justify-center mb-2">
                    {stats?.showStreak ? (
                      <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
                        <Flame className="w-5 h-5 text-orange-500" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                        <EyeOff className="w-5 h-5 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <p className="text-2xl font-bold">
                    {stats?.showStreak ? (stats?.streak || 0) : "—"}
                  </p>
                  <p className="text-xs text-muted-foreground font-medium">Streak</p>
                </div>

                {/* Score */}
                <div className="relative overflow-hidden text-center p-4 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/10">
                  <div className="flex justify-center mb-2">
                    {stats?.showScore !== "none" ? (
                      <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-primary" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                        <EyeOff className="w-5 h-5 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <p className="text-2xl font-bold">
                    {stats?.showScore !== "none" && stats?.score ? stats.score.toFixed(1) : "—"}
                  </p>
                  <p className="text-xs text-muted-foreground font-medium">Score</p>
                </div>

                {/* Level */}
                <div className="relative overflow-hidden text-center p-4 rounded-2xl bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border border-yellow-500/10">
                  <div className="flex justify-center mb-2">
                    <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                      <Trophy className="w-5 h-5 text-yellow-500" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold">{stats?.level || 1}</p>
                  <p className="text-xs text-muted-foreground font-medium">Level</p>
                </div>
              </div>

              {/* Additional stats */}
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                      <Target className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <span className="text-sm">Analysen</span>
                  </div>
                  <span className="font-semibold">{stats?.analysisCount || 0}</span>
                </div>
                
                {stats?.totalXp !== null && (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <span className="text-sm">Gesamt XP</span>
                    </div>
                    <span className="font-semibold">{stats?.totalXp?.toLocaleString() || 0}</span>
                  </div>
                )}

                {stats?.lastAnalysisDate && stats?.showScore !== "none" && (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <span className="text-sm">Letzte Analyse</span>
                    </div>
                    <span className="text-sm text-muted-foreground font-medium">
                      {format(new Date(stats.lastAnalysisDate), "dd.MM.yy", { locale: de })}
                    </span>
                  </div>
                )}
              </div>
            </>
          )}
        </motion.div>

        {/* Actions */}
        <motion.div 
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="p-4 pt-2 space-y-3"
        >
          <Button 
            className="w-full h-12 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg"
            onClick={() => {
              onClose();
              onMakePartner();
            }}
          >
            <HandshakeIcon className="w-4 h-4 mr-2" />
            Als Partner anfragen
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="ghost" 
                className="w-full h-10 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl"
              >
                <UserMinus className="w-4 h-4 mr-2" />
                Freundschaft beenden
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-3xl">
              <AlertDialogHeader>
                <AlertDialogTitle>Freundschaft beenden?</AlertDialogTitle>
                <AlertDialogDescription>
                  Du wirst {friendName || "diesen Nutzer"} aus deiner Freundesliste entfernen. 
                  Ihr könnt euch jederzeit wieder hinzufügen.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-xl">Abbrechen</AlertDialogCancel>
                <AlertDialogAction 
                  className="rounded-xl bg-destructive hover:bg-destructive/90"
                  onClick={handleRemove}
                  disabled={removing}
                >
                  {removing ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <UserMinus className="w-4 h-4 mr-2" />
                  )}
                  Entfernen
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
