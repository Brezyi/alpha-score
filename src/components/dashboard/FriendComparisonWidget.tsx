import { useState, useEffect, useMemo } from "react";
import { Users, TrendingUp, TrendingDown, Minus, Trophy, Lock, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useFriends } from "@/hooks/useFriends";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface FriendScoreData {
  friendId: string;
  displayName: string;
  avatarUrl: string | null;
  showScore: "none" | "delta_only" | "full";
  scoreDelta: number | null; // Score change in last 30 days
  currentScore: number | null;
  rank: number;
}

interface FriendComparisonWidgetProps {
  userScoreDelta: number | null;
  isPremium: boolean;
}

export function FriendComparisonWidget({ userScoreDelta, isPremium }: FriendComparisonWidgetProps) {
  const { user } = useAuth();
  const { friends, loading: friendsLoading } = useFriends();
  const [friendScores, setFriendScores] = useState<FriendScoreData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFriendScores = async () => {
      if (!user || friends.length === 0) {
        setLoading(false);
        return;
      }

      try {
        // Get friend IDs who allow score sharing
        const friendsWithScoreAccess = friends.filter(
          f => f.privacy_settings.show_score !== "none"
        );

        if (friendsWithScoreAccess.length === 0) {
          setFriendScores([]);
          setLoading(false);
          return;
        }

        const friendIds = friendsWithScoreAccess.map(f => f.user_id);

        // Fetch analyses from last 30 days for these friends
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { data: analysesData, error } = await supabase
          .from("analyses")
          .select("user_id, looks_score, created_at")
          .in("user_id", friendIds)
          .eq("status", "completed")
          .gte("created_at", thirtyDaysAgo.toISOString())
          .order("created_at", { ascending: true });

        if (error) throw error;

        // Calculate score deltas for each friend
        const scoreDataMap = new Map<string, { scores: number[]; dates: Date[] }>();
        
        analysesData?.forEach(analysis => {
          if (analysis.looks_score === null) return;
          
          if (!scoreDataMap.has(analysis.user_id)) {
            scoreDataMap.set(analysis.user_id, { scores: [], dates: [] });
          }
          
          const data = scoreDataMap.get(analysis.user_id)!;
          data.scores.push(analysis.looks_score);
          data.dates.push(new Date(analysis.created_at));
        });

        // Build friend score data
        const friendScoreData: FriendScoreData[] = friendsWithScoreAccess.map((friend, index) => {
          const scoreData = scoreDataMap.get(friend.user_id);
          let scoreDelta: number | null = null;
          let currentScore: number | null = null;

          if (scoreData && scoreData.scores.length >= 2) {
            const firstScore = scoreData.scores[0];
            const lastScore = scoreData.scores[scoreData.scores.length - 1];
            scoreDelta = Number((lastScore - firstScore).toFixed(1));
            currentScore = lastScore;
          } else if (scoreData && scoreData.scores.length === 1) {
            currentScore = scoreData.scores[0];
            scoreDelta = 0;
          }

          return {
            friendId: friend.user_id,
            displayName: friend.display_name || "Freund",
            avatarUrl: friend.avatar_url,
            showScore: friend.privacy_settings.show_score,
            scoreDelta,
            currentScore,
            rank: 0, // Will be calculated below
          };
        });

        // Sort by delta (highest improvement first) and assign ranks
        const sortedData = friendScoreData
          .filter(f => f.scoreDelta !== null)
          .sort((a, b) => (b.scoreDelta || 0) - (a.scoreDelta || 0));

        sortedData.forEach((f, i) => {
          f.rank = i + 1;
        });

        setFriendScores(sortedData.slice(0, 5)); // Top 5
      } catch (error) {
        console.error("Error fetching friend scores:", error);
      } finally {
        setLoading(false);
      }
    };

    if (!friendsLoading) {
      fetchFriendScores();
    }
  }, [user, friends, friendsLoading]);

  // Calculate user's rank among friends
  const userRank = useMemo(() => {
    if (userScoreDelta === null) return null;
    
    const allDeltas = [...friendScores.map(f => f.scoreDelta || 0), userScoreDelta];
    allDeltas.sort((a, b) => b - a);
    return allDeltas.indexOf(userScoreDelta) + 1;
  }, [friendScores, userScoreDelta]);

  // Create sorted list combining user and friends by rank
  const sortedRankings = useMemo(() => {
    const userEntry = {
      id: "user",
      isUser: true as const,
      displayName: "Du",
      avatarUrl: null as string | null,
      scoreDelta: userScoreDelta,
      showScore: "full" as const,
      rank: userRank || 999,
    };

    const friendEntries = friendScores.map(f => ({
      id: f.friendId,
      isUser: false as const,
      displayName: f.displayName,
      avatarUrl: f.avatarUrl,
      scoreDelta: f.scoreDelta,
      showScore: f.showScore,
      rank: f.rank,
    }));

    return [...friendEntries, userEntry].sort((a, b) => a.rank - b.rank);
  }, [friendScores, userScoreDelta, userRank]);

  if (friendsLoading || loading) {
    return (
      <div className="p-5 rounded-2xl glass-card space-y-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-5 w-32" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-12 ml-auto" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // No friends yet
  if (friends.length === 0) {
    return (
      <div className="p-5 rounded-2xl glass-card">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-primary" />
          <h3 className="font-bold">Freunde-Vergleich</h3>
        </div>
        <div className="text-center py-6">
          <Users className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-50" />
          <p className="text-sm text-muted-foreground mb-3">
            Füge Freunde hinzu, um eure Fortschritte zu vergleichen
          </p>
          <Link to="/friends">
            <Button variant="outline" size="sm">
              Freunde finden
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // No scores to compare
  if (friendScores.length === 0) {
    return (
      <div className="p-5 rounded-2xl glass-card">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-primary" />
          <h3 className="font-bold">Freunde-Vergleich</h3>
        </div>
        <p className="text-sm text-muted-foreground text-center py-4">
          Noch keine Vergleichsdaten verfügbar
        </p>
      </div>
    );
  }

  const getDeltaIcon = (delta: number | null) => {
    if (delta === null) return <Minus className="w-4 h-4 text-muted-foreground" />;
    if (delta > 0) return <TrendingUp className="w-4 h-4 text-success" />;
    if (delta < 0) return <TrendingDown className="w-4 h-4 text-destructive" />;
    return <Minus className="w-4 h-4 text-muted-foreground" />;
  };

  const getDeltaColor = (delta: number | null) => {
    if (delta === null) return "text-muted-foreground";
    if (delta > 0) return "text-success";
    if (delta < 0) return "text-destructive";
    return "text-muted-foreground";
  };

  return (
    <div className="p-5 rounded-2xl glass-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          <h3 className="font-bold">Freunde-Vergleich</h3>
        </div>
        {userRank && userRank <= 3 && (
          <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30">
            <Trophy className="w-3 h-3 mr-1" />
            #{userRank}
          </Badge>
        )}
      </div>

      <p className="text-xs text-muted-foreground mb-4">
        Score-Verbesserung der letzten 30 Tage
      </p>

      <div className="space-y-3">
        {sortedRankings.map((entry) => (
          <div 
            key={entry.id} 
            className={cn(
              "flex items-center gap-3 p-2 rounded-lg transition-colors",
              entry.isUser 
                ? "bg-primary/5 border border-primary/20" 
                : "hover:bg-muted/50"
            )}
          >
            <div className={cn(
              "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
              entry.isUser 
                ? "bg-primary/20 text-primary" 
                : "bg-muted text-muted-foreground"
            )}>
              {entry.rank}
            </div>
            {entry.isUser ? (
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-xs font-bold text-primary">DU</span>
              </div>
            ) : (
              <Avatar className="h-8 w-8">
                <AvatarImage src={entry.avatarUrl || undefined} />
                <AvatarFallback className="text-xs">
                  {entry.displayName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            )}
            <span className={cn(
              "font-medium text-sm flex-1 truncate",
              entry.isUser && "text-primary"
            )}>
              {entry.displayName}
            </span>
            <div className="flex items-center gap-1">
              {entry.isUser || entry.showScore === "delta_only" || entry.showScore === "full" ? (
                <>
                  {getDeltaIcon(entry.scoreDelta)}
                  <span className={cn("text-sm font-medium", getDeltaColor(entry.scoreDelta))}>
                    {entry.scoreDelta !== null 
                      ? `${entry.scoreDelta > 0 ? "+" : ""}${entry.scoreDelta}`
                      : "-"
                    }
                  </span>
                </>
              ) : (
                <Lock className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
          </div>
        ))}
      </div>

      <Link to="/friends" className="block mt-4">
        <Button variant="ghost" size="sm" className="w-full text-xs">
          Alle Freunde ansehen
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </Link>
    </div>
  );
}
