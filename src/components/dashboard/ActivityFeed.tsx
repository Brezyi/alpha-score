import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Trophy, 
  Camera, 
  Flame, 
  UserPlus, 
  MessageSquare,
  TrendingUp,
  Star,
  Zap
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { usePresence } from "@/hooks/usePresence";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

interface FriendActivity {
  id: string;
  type: "achievement" | "streak" | "analysis" | "friend" | "level_up";
  userId: string;
  userName: string;
  avatarUrl?: string;
  message: string;
  timestamp: Date;
  isOnline: boolean;
}

interface Friend {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
}

const activityIcons = {
  achievement: Trophy,
  streak: Flame,
  analysis: Camera,
  friend: UserPlus,
  level_up: Zap,
};

// Using semantic colors from design system
const activityColors = {
  achievement: "text-warning bg-warning/10",
  streak: "text-accent bg-accent/10",
  analysis: "text-primary bg-primary/10",
  friend: "text-success bg-success/10",
  level_up: "text-secondary bg-secondary/10",
};

export function ActivityFeed() {
  const { user } = useAuth();
  const { isOnline } = usePresence();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [activities, setActivities] = useState<FriendActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFriendsAndActivities = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Fetch accepted friends
        const { data: connections } = await supabase
          .from("friend_connections")
          .select("requester_id, addressee_id")
          .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
          .eq("status", "accepted");

        if (!connections || connections.length === 0) {
          setLoading(false);
          return;
        }

        const friendIds = connections.map(c => 
          c.requester_id === user.id ? c.addressee_id : c.requester_id
        );

        // Fetch friend profiles
        const { data: profiles } = await supabase
          .from("public_profiles")
          .select("user_id, display_name, avatar_url")
          .in("user_id", friendIds);

        const friendsData = (profiles || []).map(p => ({
          id: p.user_id,
          display_name: p.display_name,
          avatar_url: p.avatar_url,
        }));

        setFriends(friendsData);

        // No activity table exists yet - show empty state instead of fake data
        // TODO: Create activities table when real activity tracking is needed
        setActivities([]);
      } catch (error) {
        console.error("Error fetching activities:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFriendsAndActivities();
  }, [user, isOnline]);

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    
    if (seconds < 60) return "gerade eben";
    if (seconds < 3600) return `vor ${Math.floor(seconds / 60)} Min.`;
    if (seconds < 86400) return `vor ${Math.floor(seconds / 3600)} Std.`;
    return `vor ${Math.floor(seconds / 86400)} Tagen`;
  };

  // Online friends section
  const onlineFriends = friends.filter(f => isOnline(f.id));

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-primary" />
          Aktivitäten
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Online Friends Bar */}
        {onlineFriends.length > 0 && (
          <div className="flex items-center gap-2 pb-3 border-b border-border/50">
            <span className="text-xs text-muted-foreground shrink-0">Online:</span>
            <div className="flex -space-x-2 overflow-hidden">
              {onlineFriends.slice(0, 5).map((friend) => (
                <div key={friend.id} className="relative">
                  <Avatar className="w-8 h-8 border-2 border-background">
                    <AvatarImage src={friend.avatar_url || undefined} />
                    <AvatarFallback className="text-xs bg-muted">
                      {friend.display_name?.charAt(0) || "?"}
                    </AvatarFallback>
                  </Avatar>
                  {/* Pulse indicator */}
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-success rounded-full border-2 border-background animate-pulse" />
                </div>
              ))}
              {onlineFriends.length > 5 && (
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium border-2 border-background">
                  +{onlineFriends.length - 5}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Activity Feed */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground">Keine Aktivitäten von Freunden</p>
            <Link to="/friends" className="text-xs text-primary hover:underline mt-1 inline-block">
              Freunde hinzufügen →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {activities.slice(0, 4).map((activity, index) => {
                const Icon = activityIcons[activity.type];
                const colorClass = activityColors[activity.type];
                
                return (
                  <motion.div
                    key={activity.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start gap-3 group"
                  >
                    {/* Avatar with online indicator */}
                    <div className="relative shrink-0">
                      <Avatar className="w-9 h-9">
                        <AvatarImage src={activity.avatarUrl} />
                        <AvatarFallback className="text-xs bg-muted">
                          {activity.userName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      {activity.isOnline && (
                        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-success rounded-full border-2 border-card animate-pulse" />
                      )}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">
                        <span className="font-medium">{activity.userName}</span>
                        <span className="text-muted-foreground"> {activity.message}</span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatTimeAgo(activity.timestamp)}
                      </p>
                    </div>
                    
                    {/* Activity type icon */}
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", colorClass)}>
                      <Icon className="w-4 h-4" />
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
        
        {activities.length > 4 && (
          <Link 
            to="/friends" 
            className="block text-center text-xs text-primary hover:underline pt-2"
          >
            Alle Aktivitäten anzeigen →
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
