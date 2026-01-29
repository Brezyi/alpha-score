import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  Flame, 
  Trophy, 
  TrendingUp, 
  Calendar,
  Target,
  Eye,
  EyeOff,
  MessageCircle,
  HandshakeIcon,
  Loader2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { de } from "date-fns/locale";

interface FriendProfileDialogProps {
  open: boolean;
  onClose: () => void;
  friendId: string;
  friendName: string | null;
  friendAvatar: string | null;
  connectedSince: string;
  onMessage: () => void;
  onMakePartner: () => void;
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
  onMessage,
  onMakePartner,
}: FriendProfileDialogProps) {
  const [stats, setStats] = useState<FriendStats | null>(null);
  const [loading, setLoading] = useState(true);

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

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm rounded-3xl p-0 overflow-hidden">
        {/* Header with gradient */}
        <div className="relative bg-gradient-to-br from-primary/20 via-primary/10 to-transparent p-6 pb-16">
          <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-primary/10 rounded-full blur-2xl" />
          <DialogHeader>
            <DialogTitle className="sr-only">Freund-Profil</DialogTitle>
          </DialogHeader>
        </div>

        {/* Avatar centered */}
        <div className="relative -mt-12 flex justify-center">
          <Avatar className="w-24 h-24 ring-4 ring-background shadow-xl">
            <AvatarImage src={friendAvatar || undefined} />
            <AvatarFallback className="text-3xl font-bold bg-gradient-to-br from-primary/20 to-primary/5 text-primary">
              {friendName?.[0]?.toUpperCase() || "?"}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Name and info */}
        <div className="text-center px-6 pt-2 pb-4">
          <h2 className="text-xl font-bold">{friendName || "Unbekannt"}</h2>
          <p className="text-sm text-muted-foreground">
            Freunde seit {format(new Date(connectedSince), "d. MMMM yyyy", { locale: de })}
          </p>
        </div>

        <Separator />

        {/* Stats */}
        <div className="p-6 space-y-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-3">
                {/* Streak */}
                <div className="text-center p-3 rounded-xl bg-muted/50">
                  <div className="flex justify-center mb-1">
                    {stats?.showStreak ? (
                      <Flame className="w-5 h-5 text-orange-500" />
                    ) : (
                      <EyeOff className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  <p className="text-2xl font-bold">
                    {stats?.showStreak ? (stats?.streak || 0) : "—"}
                  </p>
                  <p className="text-xs text-muted-foreground">Streak</p>
                </div>

                {/* Score */}
                <div className="text-center p-3 rounded-xl bg-muted/50">
                  <div className="flex justify-center mb-1">
                    {stats?.showScore !== "none" ? (
                      <TrendingUp className="w-5 h-5 text-primary" />
                    ) : (
                      <EyeOff className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  <p className="text-2xl font-bold">
                    {stats?.showScore !== "none" && stats?.score ? stats.score.toFixed(1) : "—"}
                  </p>
                  <p className="text-xs text-muted-foreground">Score</p>
                </div>

                {/* Level */}
                <div className="text-center p-3 rounded-xl bg-muted/50">
                  <Trophy className="w-5 h-5 text-yellow-500 mx-auto mb-1" />
                  <p className="text-2xl font-bold">{stats?.level || 1}</p>
                  <p className="text-xs text-muted-foreground">Level</p>
                </div>
              </div>

              {/* Additional stats */}
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">Analysen</span>
                  </div>
                  <span className="font-medium">{stats?.analysisCount || 0}</span>
                </div>
                
                {stats?.lastAnalysisDate && stats?.showScore !== "none" && (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">Letzte Analyse</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(stats.lastAnalysisDate), "dd.MM.yyyy", { locale: de })}
                    </span>
                  </div>
                )}

                {stats?.totalXp !== null && (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                    <div className="flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">Gesamt XP</span>
                    </div>
                    <span className="font-medium">{stats?.totalXp?.toLocaleString() || 0}</span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <Separator />

        {/* Actions */}
        <div className="p-4 flex gap-2">
          <Button 
            variant="outline" 
            className="flex-1 rounded-xl"
            onClick={() => {
              onClose();
              onMessage();
            }}
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Nachricht
          </Button>
          <Button 
            className="flex-1 rounded-xl"
            onClick={() => {
              onClose();
              onMakePartner();
            }}
          >
            <HandshakeIcon className="w-4 h-4 mr-2" />
            Partner
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
