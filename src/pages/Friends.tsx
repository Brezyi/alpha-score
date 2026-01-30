import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  Users, 
  UserPlus, 
  MessageCircle, 
  Copy, 
  Check, 
  Search, 
  Send, 
  HandshakeIcon,
  Sparkles,
  Share2,
  Settings,
  ChevronRight,
  Flame,
  Trophy,
  X,
  Loader2,
  Clock,
  UserX,
  Bell
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useFriends } from "@/hooks/useFriends";
import { useFriendMessages } from "@/hooks/useFriendMessages";
import { useAccountabilityPartner } from "@/hooks/useAccountabilityPartner";
import { usePartnerRequests } from "@/hooks/usePartnerRequests";
import { usePresence } from "@/hooks/usePresence";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Capacitor } from "@capacitor/core";
import { MobileAppLayout } from "@/components/mobile/MobileAppLayout";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { useToast } from "@/hooks/use-toast";
import { ChatDialog } from "@/components/friends/ChatDialog";
import { FriendProfileDialog } from "@/components/friends/FriendProfileDialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

// Friend Card Component - Modern Design
function FriendCard({ 
  friend, 
  onRemove,
  onMessage,
  onMakePartner,
  onViewProfile,
  index,
  isOnline
}: { 
  friend: any; 
  onRemove: () => void;
  onMessage: () => void;
  onMakePartner: () => void;
  onViewProfile: () => void;
  index: number;
  isOnline: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="group relative overflow-hidden rounded-2xl bg-card border border-border p-4 hover:border-primary/30 transition-all duration-300 cursor-pointer"
      onClick={onViewProfile}
    >
      <div className="flex items-center gap-4">
        <div className="relative">
          <Avatar className="w-14 h-14 ring-2 ring-primary/20 ring-offset-2 ring-offset-background">
            <AvatarImage src={friend.avatar_url || undefined} />
            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-primary font-bold text-lg">
              {friend.display_name?.[0]?.toUpperCase() || "?"}
            </AvatarFallback>
          </Avatar>
          {isOnline && (
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background" />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground truncate">{friend.display_name || "Unbekannt"}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isOnline ? (
              <span className="text-green-500">Online</span>
            ) : (
              <>Freunde seit {format(new Date(friend.connected_since), "dd. MMM", { locale: de })}</>
            )}
          </p>
        </div>
        
        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
          <Button 
            size="icon" 
            variant="ghost" 
            className="h-10 w-10 rounded-xl hover:bg-primary/10 hover:text-primary"
            onClick={onMessage}
          >
            <MessageCircle className="w-5 h-5" />
          </Button>
          <Button 
            size="icon" 
            variant="ghost" 
            className="h-10 w-10 rounded-xl hover:bg-amber-500/10 hover:text-amber-500"
            onClick={onMakePartner}
          >
            <HandshakeIcon className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

// Friend Request Card - Modern Design
function RequestCard({ 
  request, 
  onAccept, 
  onDecline,
  index 
}: { 
  request: any; 
  onAccept: () => void; 
  onDecline: () => void;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05 }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-card to-card border border-primary/20 p-4"
    >
      <div className="absolute top-0 right-0 w-20 h-20 bg-primary/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
      
      <div className="relative flex items-center gap-4">
        <Avatar className="w-12 h-12 ring-2 ring-primary/30">
          <AvatarImage src={request.requester_avatar || undefined} />
          <AvatarFallback className="bg-primary/20 text-primary font-bold">
            {request.requester_name?.[0]?.toUpperCase() || "?"}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <p className="font-semibold truncate">{request.requester_name || "Unbekannt"}</p>
          <p className="text-xs text-muted-foreground">
            möchte dein Freund sein
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant="ghost" 
            className="h-9 px-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={onDecline}
          >
            <X className="w-4 h-4" />
          </Button>
          <Button 
            size="sm" 
            className="h-9 px-4 bg-primary hover:bg-primary/90 rounded-xl"
            onClick={onAccept}
          >
            <Check className="w-4 h-4 mr-1" />
            Annehmen
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

// Main Friends Page
export default function Friends() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { 
    friends, 
    pendingRequests, 
    myFriendCode, 
    privacySettings,
    loading: friendsLoading,
    sendFriendRequest,
    sendFriendRequestByUserId,
    searchUsers,
    acceptRequest,
    declineRequest,
    removeFriend,
    updatePrivacySettings,
  } = useFriends();
  const { conversations, getTotalUnreadCount } = useFriendMessages();
  const { partner, checkIn, endPartnership } = useAccountabilityPartner();
  const { 
    incomingRequests: partnerRequests, 
    outgoingRequests: sentPartnerRequests,
    sendPartnerRequest,
    acceptPartnerRequest,
    declinePartnerRequest,
    cancelPartnerRequest 
  } = usePartnerRequests();
  const { isOnline } = usePresence();
  const [activeTab, setActiveTab] = useState("friends");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [friendCode, setFriendCode] = useState("");
  const [codeCopied, setCodeCopied] = useState(false);
  const [searching, setSearching] = useState(false);
  const [sendingRequest, setSendingRequest] = useState(false);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<any | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showCheckInDialog, setShowCheckInDialog] = useState(false);
  const [checkInGoals, setCheckInGoals] = useState<string[]>([]);
  const [checkInMood, setCheckInMood] = useState(3);

  const isNative = Capacitor.isNativePlatform();
  const unreadCount = getTotalUnreadCount();

  const handleHaptic = async () => {
    if (isNative) {
      try {
        await Haptics.impact({ style: ImpactStyle.Light });
      } catch {}
    }
  };

  // Handle search
  const handleSearch = async () => {
    if (searchQuery.length < 2) return;
    setSearching(true);
    const results = await searchUsers(searchQuery);
    setSearchResults(results);
    setSearching(false);
  };

  // Handle send request by code
  const handleSendRequestByCode = async () => {
    if (!friendCode.trim() || friendCode.length < 8) {
      toast({
        title: "Ungültiger Code",
        description: "Bitte gib einen gültigen 8-stelligen Code ein.",
        variant: "destructive",
      });
      return;
    }
    setSendingRequest(true);
    handleHaptic();
    const success = await sendFriendRequest(friendCode.trim().toUpperCase());
    if (success) {
      setFriendCode("");
    }
    setSendingRequest(false);
  };

  // Copy friend code
  const handleCopyCode = async () => {
    if (myFriendCode) {
      await navigator.clipboard.writeText(myFriendCode);
      setCodeCopied(true);
      handleHaptic();
      toast({ title: "Code kopiert! ✓" });
      setTimeout(() => setCodeCopied(false), 2000);
    }
  };

  // Share friend code
  const handleShareCode = async () => {
    if (!myFriendCode) {
      toast({
        title: "Kein Code verfügbar",
        description: "Bitte warte, bis dein Code generiert wird.",
        variant: "destructive",
      });
      return;
    }

    const shareText = `Füge mich auf GLOWMAXXED hinzu! Mein Code: ${myFriendCode}`;
    
    // Check if native share is available and we're not in an iframe
    const canShare = typeof navigator.share === 'function' && !window.frameElement;
    
    if (canShare) {
      try {
        await navigator.share({
          title: "GLOWMAXXED - Freundes-Code",
          text: shareText,
        });
        handleHaptic();
        return;
      } catch (err: any) {
        // User cancelled or share failed - fall through to copy
        if (err?.name === 'AbortError') return;
      }
    }
    
    // Fallback: Copy to clipboard
    try {
      await navigator.clipboard.writeText(shareText);
      setCodeCopied(true);
      handleHaptic();
      toast({ title: "Text kopiert! ✓", description: "Teile ihn mit deinen Freunden." });
      setTimeout(() => setCodeCopied(false), 2000);
    } catch {
      // Final fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = shareText;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCodeCopied(true);
      toast({ title: "Text kopiert! ✓" });
      setTimeout(() => setCodeCopied(false), 2000);
    }
  };

  if (authLoading || friendsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-primary/20" />
            <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          </div>
          <span className="text-sm text-muted-foreground">Wird geladen...</span>
        </div>
      </div>
    );
  }

  const content = (
    <div className={cn("space-y-6", isNative ? "px-4 pb-6" : "container max-w-2xl mx-auto px-4 py-8")}>
      {/* Header */}
      {!isNative && (
        <div className="flex items-center justify-between">
          <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Dashboard
          </Link>
          <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => setShowSettings(true)}>
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      )}

      {/* Title Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }}
        className="space-y-1"
      >
        <h1 className="text-3xl font-bold tracking-tight">Freunde</h1>
        <p className="text-muted-foreground">
          Erreicht zusammen eure Ziele
        </p>
      </motion.div>

      {/* Friend Code Card - Hero Style */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.1 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/30 p-6"
      >
        {/* Decorative elements */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-primary/10 rounded-full blur-2xl" />
        
        <div className="relative">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-primary">Dein Freundes-Code</span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="text-4xl font-bold font-mono tracking-[0.3em] text-foreground">
                {myFriendCode || "--------"}
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="icon"
                className="h-12 w-12 rounded-xl border-primary/30 hover:bg-primary/10 hover:border-primary"
                onClick={handleCopyCode}
              >
                {codeCopied ? (
                  <Check className="w-5 h-5 text-green-500" />
                ) : (
                  <Copy className="w-5 h-5" />
                )}
              </Button>
              <Button 
                variant="default" 
                size="icon"
                className="h-12 w-12 rounded-xl"
                onClick={handleShareCode}
              >
                <Share2 className="w-5 h-5" />
              </Button>
            </div>
          </div>
          
          <p className="text-xs text-muted-foreground mt-3">
            Teile deinen Code mit Freunden, damit sie dich hinzufügen können
          </p>
        </div>
      </motion.div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 h-12 p-1 bg-muted/50 rounded-2xl">
          <TabsTrigger 
            value="friends" 
            className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm flex items-center gap-1.5"
          >
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Freunde</span>
            {friends.length > 0 && (
              <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">{friends.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger 
            value="add" 
            className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm flex items-center gap-1.5"
          >
            <UserPlus className="w-4 h-4" />
            <span className="hidden sm:inline">Hinzufügen</span>
            {pendingRequests.length > 0 && (
              <Badge variant="destructive" className="h-5 px-1.5 text-[10px]">{pendingRequests.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger 
            value="chat" 
            className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm flex items-center gap-1.5"
          >
            <MessageCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Chat</span>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="h-5 px-1.5 text-[10px]">{unreadCount}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger 
            value="partner" 
            className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm flex items-center gap-1.5"
          >
            <HandshakeIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Partner</span>
            {partnerRequests.length > 0 && (
              <Badge variant="destructive" className="h-5 px-1.5 text-[10px]">{partnerRequests.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Friends List Tab */}
        <TabsContent value="friends" className="space-y-3 mt-4">
          <AnimatePresence mode="wait">
            {friends.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative overflow-hidden rounded-3xl border border-dashed border-border p-12 text-center"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-muted/50 to-transparent" />
                <div className="relative">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <Users className="w-10 h-10 text-primary/60" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Noch keine Freunde</h3>
                  <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">
                    Teile deinen Code oder suche nach anderen Nutzern
                  </p>
                  <Button onClick={() => setActiveTab("add")} className="rounded-xl">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Freunde hinzufügen
                  </Button>
                </div>
              </motion.div>
            ) : (
              <div className="space-y-3">
                {friends.map((friend, index) => (
                  <FriendCard
                    key={friend.id}
                    friend={friend}
                    index={index}
                    isOnline={isOnline(friend.id)}
                    onRemove={() => removeFriend(friend.connection_id)}
                    onMessage={() => {
                      setSelectedChat(friend.id);
                      setActiveTab("chat");
                    }}
                    onMakePartner={() => sendPartnerRequest(friend.id)}
                    onViewProfile={() => setSelectedProfile(friend)}
                  />
                ))}
              </div>
            )}
          </AnimatePresence>
        </TabsContent>

        {/* Add Friends Tab */}
        <TabsContent value="add" className="space-y-6 mt-4">
          {/* Pending Requests */}
          {pendingRequests.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              <h3 className="font-semibold flex items-center gap-2">
                <span>Anfragen</span>
                <Badge variant="destructive" className="animate-pulse">{pendingRequests.length}</Badge>
              </h3>
              {pendingRequests.map((request, index) => (
                <RequestCard
                  key={request.id}
                  request={request}
                  index={index}
                  onAccept={() => acceptRequest(request.id)}
                  onDecline={() => declineRequest(request.id)}
                />
              ))}
            </motion.div>
          )}

          {/* Add by Code */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl bg-card border border-border p-5 space-y-4"
          >
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <UserPlus className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Mit Code hinzufügen</h3>
                <p className="text-xs text-muted-foreground">Gib den 8-stelligen Code ein</p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Input
                placeholder="XXXXXXXX"
                value={friendCode}
                onChange={(e) => setFriendCode(e.target.value.toUpperCase().slice(0, 8))}
                maxLength={8}
                className="h-12 font-mono text-lg tracking-[0.2em] uppercase text-center rounded-xl border-2 focus:border-primary"
              />
              <Button 
                onClick={handleSendRequestByCode} 
                disabled={sendingRequest || friendCode.length < 8}
                className="h-12 w-12 rounded-xl shrink-0"
              >
                {sendingRequest ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </Button>
            </div>
          </motion.div>

          {/* Search Users */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl bg-card border border-border p-5 space-y-4"
          >
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Search className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <h3 className="font-semibold">Nutzer suchen</h3>
                <p className="text-xs text-muted-foreground">Nach Display-Namen suchen</p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Input
                placeholder="Name eingeben..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="h-12 rounded-xl"
              />
              <Button 
                onClick={handleSearch} 
                disabled={searching || searchQuery.length < 2}
                variant="outline"
                className="h-12 w-12 rounded-xl shrink-0"
              >
                {searching ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Search className="w-5 h-5" />
                )}
              </Button>
            </div>

            {searchResults.length > 0 && (
              <div className="space-y-2 pt-2">
                {searchResults.map((result, index) => (
                  <motion.div 
                    key={result.user_id} 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={result.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {result.display_name?.[0]?.toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{result.display_name || "Unbekannt"}</p>
                      <p className="text-xs text-muted-foreground font-mono">{result.friend_code}</p>
                    </div>
                    <Button 
                      size="sm" 
                      className="rounded-xl"
                      onClick={() => sendFriendRequestByUserId(result.user_id)}
                    >
                      <UserPlus className="w-4 h-4 mr-1" />
                      Hinzufügen
                    </Button>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </TabsContent>

        {/* Chat Tab */}
        <TabsContent value="chat" className="mt-4">
          <AnimatePresence mode="wait">
            {conversations.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative overflow-hidden rounded-3xl border border-dashed border-border p-12 text-center"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-muted/50 to-transparent" />
                <div className="relative">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                    <MessageCircle className="w-10 h-10 text-blue-500/60" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Keine Nachrichten</h3>
                  <p className="text-sm text-muted-foreground">
                    Starte einen Chat mit einem Freund
                  </p>
                </div>
              </motion.div>
            ) : (
              <div className="space-y-2">
                {conversations.map((conv, index) => (
                  <motion.div
                    key={conv.friend_id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center gap-4 p-4 rounded-2xl bg-card border border-border cursor-pointer hover:border-primary/30 transition-all"
                    onClick={() => setSelectedChat(conv.friend_id)}
                  >
                    <div className="relative">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={conv.friend_avatar || undefined} />
                        <AvatarFallback>{conv.friend_name?.[0]?.toUpperCase() || "?"}</AvatarFallback>
                      </Avatar>
                      {conv.unread_count > 0 && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                          <span className="text-[10px] font-bold text-primary-foreground">{conv.unread_count}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <p className="font-semibold truncate">{conv.friend_name || "Unbekannt"}</p>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(conv.last_message_time), "HH:mm", { locale: de })}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{conv.last_message}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </TabsContent>

        {/* Partner Tab */}
        <TabsContent value="partner" className="mt-4 space-y-4">
          {/* Incoming Partner Requests */}
          {partnerRequests.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              <div className="flex items-center gap-2 mb-2">
                <Bell className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-medium">Partner-Anfragen</span>
                <Badge variant="destructive" className="h-5">{partnerRequests.length}</Badge>
              </div>
              {partnerRequests.map((req, index) => (
                <motion.div
                  key={req.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500/10 via-card to-card border border-amber-500/20 p-4"
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="w-12 h-12 ring-2 ring-amber-500/30">
                      <AvatarImage src={req.requester_avatar || undefined} />
                      <AvatarFallback className="bg-amber-500/20 text-amber-500 font-bold">
                        {req.requester_name?.[0]?.toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{req.requester_name || "Unbekannt"}</p>
                      <p className="text-xs text-muted-foreground">möchte dein Partner sein</p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-9 px-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={() => declinePartnerRequest(req.id)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        className="h-9 px-4 bg-amber-500 hover:bg-amber-600 text-white rounded-xl"
                        onClick={() => acceptPartnerRequest(req.id)}
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Annehmen
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Outgoing Partner Requests */}
          {sentPartnerRequests.length > 0 && !partner && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Gesendete Anfragen</span>
              </div>
              {sentPartnerRequests.map((req) => (
                <div
                  key={req.id}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-muted/30 border border-border"
                >
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={req.addressee_avatar || undefined} />
                    <AvatarFallback>{req.addressee_name?.[0]?.toUpperCase() || "?"}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{req.addressee_name || "Unbekannt"}</p>
                    <p className="text-xs text-muted-foreground">Warten auf Antwort...</p>
                  </div>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => cancelPartnerRequest(req.id)}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Abbrechen
                  </Button>
                </div>
              ))}
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            {partner ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500/10 via-card to-card border border-amber-500/20 p-6"
              >
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl" />
                
                <div className="relative text-center mb-6">
                  <div className="relative inline-block">
                    <Avatar className="w-24 h-24 ring-4 ring-amber-500/30 ring-offset-4 ring-offset-background">
                      <AvatarImage src={partner.partner_avatar || undefined} />
                      <AvatarFallback className="text-3xl bg-gradient-to-br from-amber-500/20 to-amber-500/5 text-amber-500">
                        {partner.partner_name?.[0]?.toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg">
                      <HandshakeIcon className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <h3 className="font-bold text-xl mt-4">{partner.partner_name || "Partner"}</h3>
                  <p className="text-sm text-muted-foreground">
                    Partner seit {format(new Date(partner.started_at), "dd. MMM yyyy", { locale: de })}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-6">
                  <div className="text-center p-4 bg-background/50 rounded-2xl border border-border">
                    <Flame className="w-6 h-6 mx-auto mb-2 text-orange-500" />
                    <p className="text-2xl font-bold">{partner.streak || 0}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Streak</p>
                  </div>
                  <div className="text-center p-4 bg-background/50 rounded-2xl border border-border">
                    <div className={cn(
                      "w-6 h-6 rounded-full mx-auto mb-2 flex items-center justify-center",
                      partner.todayCheckedIn ? "bg-green-500" : "bg-muted"
                    )}>
                      {partner.todayCheckedIn && <Check className="w-4 h-4 text-white" />}
                    </div>
                    <p className="text-sm font-semibold">{partner.todayCheckedIn ? "Done" : "Offen"}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Du</p>
                  </div>
                  <div className="text-center p-4 bg-background/50 rounded-2xl border border-border">
                    <div className={cn(
                      "w-6 h-6 rounded-full mx-auto mb-2 flex items-center justify-center",
                      partner.partnerCheckedIn ? "bg-green-500" : "bg-muted"
                    )}>
                      {partner.partnerCheckedIn && <Check className="w-4 h-4 text-white" />}
                    </div>
                    <p className="text-sm font-semibold">{partner.partnerCheckedIn ? "Done" : "Offen"}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Partner</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {!partner.todayCheckedIn && (
                    <Button 
                      className="w-full h-12 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg"
                      onClick={() => setShowCheckInDialog(true)}
                    >
                      <Check className="w-5 h-5 mr-2" />
                      Heute einchecken
                    </Button>
                  )}
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" className="w-full h-10 text-muted-foreground hover:text-destructive">
                        <UserX className="w-4 h-4 mr-2" />
                        Partnerschaft beenden
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="rounded-3xl">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Partnerschaft beenden?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Dein Streak und alle Check-in-Daten mit diesem Partner gehen verloren.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl">Abbrechen</AlertDialogCancel>
                        <AlertDialogAction 
                          className="rounded-xl bg-destructive hover:bg-destructive/90"
                          onClick={() => endPartnership()}
                        >
                          Beenden
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </motion.div>
            ) : partnerRequests.length === 0 && sentPartnerRequests.length === 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative overflow-hidden rounded-3xl border border-dashed border-border p-12 text-center"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-muted/50 to-transparent" />
                <div className="relative">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                    <HandshakeIcon className="w-10 h-10 text-amber-500/60" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Kein Accountability Partner</h3>
                  <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">
                    Sende eine Anfrage an einen Freund
                  </p>
                  {friends.length > 0 && (
                    <div className="space-y-2 max-w-xs mx-auto">
                      {friends.slice(0, 3).map((friend) => (
                        <Button 
                          key={friend.id} 
                          variant="outline" 
                          className="w-full justify-start gap-3 h-12 rounded-xl"
                          onClick={() => sendPartnerRequest(friend.id)}
                        >
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={friend.avatar_url || undefined} />
                            <AvatarFallback>{friend.display_name?.[0]?.toUpperCase() || "?"}</AvatarFallback>
                          </Avatar>
                          <span className="truncate">{friend.display_name || "Unbekannt"}</span>
                          <Send className="w-4 h-4 ml-auto text-muted-foreground" />
                        </Button>
                      ))}
                    </div>
                  )}
                  {friends.length === 0 && (
                    <Button onClick={() => setActiveTab("add")} className="rounded-xl">
                      <UserPlus className="w-4 h-4 mr-2" />
                      Erst Freunde hinzufügen
                    </Button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </TabsContent>
      </Tabs>

      {/* Chat Dialog */}
      {selectedChat && (
        <ChatDialog
          open={!!selectedChat}
          onClose={() => setSelectedChat(null)}
          friendId={selectedChat}
          friendName={friends.find(f => f.id === selectedChat)?.display_name || conversations.find(c => c.friend_id === selectedChat)?.friend_name || null}
          friendAvatar={friends.find(f => f.id === selectedChat)?.avatar_url || conversations.find(c => c.friend_id === selectedChat)?.friend_avatar || null}
        />
      )}

      {/* Privacy Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Privatsphäre-Einstellungen
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label>Score-Sichtbarkeit</Label>
              <Select 
                value={privacySettings?.show_score || "delta_only"}
                onValueChange={(v) => updatePrivacySettings({ show_score: v as any })}
              >
                <SelectTrigger className="h-12 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Niemand</SelectItem>
                  <SelectItem value="delta_only">Nur Veränderung</SelectItem>
                  <SelectItem value="full">Vollständig</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
              <div>
                <Label>Streak anzeigen</Label>
                <p className="text-xs text-muted-foreground">Freunde sehen deine Streak</p>
              </div>
              <Switch 
                checked={privacySettings?.show_streak ?? true}
                onCheckedChange={(v) => updatePrivacySettings({ show_streak: v })}
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
              <div>
                <Label>Challenges anzeigen</Label>
                <p className="text-xs text-muted-foreground">Challenge-Fortschritt teilen</p>
              </div>
              <Switch 
                checked={privacySettings?.show_challenges ?? true}
                onCheckedChange={(v) => updatePrivacySettings({ show_challenges: v })}
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
              <div>
                <Label>Challenge-Einladungen</Label>
                <p className="text-xs text-muted-foreground">Freunde können dich einladen</p>
              </div>
              <Switch 
                checked={privacySettings?.allow_challenge_invites ?? true}
                onCheckedChange={(v) => updatePrivacySettings({ allow_challenge_invites: v })}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Check-in Dialog */}
      <Dialog open={showCheckInDialog} onOpenChange={setShowCheckInDialog}>
        <DialogContent className="max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Check className="w-5 h-5 text-amber-500" />
              Täglicher Check-in
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="space-y-3">
              <Label>Was hast du heute erreicht?</Label>
              <div className="grid grid-cols-2 gap-2">
                {["Training", "Gesund gegessen", "Wasser getrunken", "Gut geschlafen", "Skincare", "Supplements"].map((goal) => (
                  <Button
                    key={goal}
                    variant={checkInGoals.includes(goal) ? "default" : "outline"}
                    className="h-10 rounded-xl text-sm"
                    onClick={() => {
                      setCheckInGoals(prev => 
                        prev.includes(goal) 
                          ? prev.filter(g => g !== goal)
                          : [...prev, goal]
                      );
                    }}
                  >
                    {checkInGoals.includes(goal) && <Check className="w-3 h-3 mr-1" />}
                    {goal}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label>Wie fühlst du dich? (1-5)</Label>
              <div className="flex gap-2 justify-center">
                {[1, 2, 3, 4, 5].map((mood) => (
                  <Button
                    key={mood}
                    variant={checkInMood === mood ? "default" : "outline"}
                    className={cn(
                      "w-12 h-12 rounded-xl text-lg",
                      checkInMood === mood && "bg-amber-500 hover:bg-amber-600"
                    )}
                    onClick={() => setCheckInMood(mood)}
                  >
                    {mood === 1 ? "😔" : mood === 2 ? "😕" : mood === 3 ? "😐" : mood === 4 ? "🙂" : "😁"}
                  </Button>
                ))}
              </div>
            </div>

            <Button 
              className="w-full h-12 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
              onClick={async () => {
                const success = await checkIn(checkInGoals, checkInMood);
                if (success) {
                  setShowCheckInDialog(false);
                  setCheckInGoals([]);
                  setCheckInMood(3);
                }
              }}
            >
              <Check className="w-5 h-5 mr-2" />
              Check-in speichern
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Friend Profile Dialog */}
      {selectedProfile && (
        <FriendProfileDialog
          open={!!selectedProfile}
          onClose={() => setSelectedProfile(null)}
          friendId={selectedProfile.id}
          friendName={selectedProfile.display_name}
          friendAvatar={selectedProfile.avatar_url}
          connectedSince={selectedProfile.connected_since}
          onMessage={() => {
            setSelectedChat(selectedProfile.id);
            setActiveTab("chat");
          }}
          onMakePartner={() => sendPartnerRequest(selectedProfile.id)}
        />
      )}
    </div>
  );

  if (isNative) {
    return (
      <MobileAppLayout showLogo showSettings showNotifications>
        {content}
      </MobileAppLayout>
    );
  }

  return content;
}