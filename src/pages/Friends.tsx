import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  Users, 
  UserPlus, 
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
import { FriendProfileDialog } from "@/components/friends/FriendProfileDialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

// Friend Card Component - Premium Design
function FriendCard({ 
  friend, 
  onRemove,
  onMakePartner,
  onViewProfile,
  index,
  isOnline
}: { 
  friend: any; 
  onRemove: () => void;
  onMakePartner: () => void;
  onViewProfile: () => void;
  index: number;
  isOnline: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, type: "spring", stiffness: 400, damping: 25 }}
      className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-card via-card to-card/80 border border-border/50 p-3 sm:p-4 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 cursor-pointer"
      onClick={onViewProfile}
    >
      {/* Subtle glow effect on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <div className="relative flex items-center gap-3 sm:gap-4">
        <div className="relative shrink-0">
          <Avatar className="w-11 h-11 sm:w-14 sm:h-14 ring-2 ring-primary/10 ring-offset-2 ring-offset-background transition-all group-hover:ring-primary/30">
            <AvatarImage src={friend.avatar_url || undefined} className="object-cover" />
            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-primary font-bold text-sm sm:text-lg">
              {friend.display_name?.[0]?.toUpperCase() || "?"}
            </AvatarFallback>
          </Avatar>
          {isOnline && (
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -bottom-0.5 -right-0.5 w-3 h-3 sm:w-4 sm:h-4 bg-green-500 rounded-full border-2 border-background shadow-lg shadow-green-500/30"
            />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground truncate group-hover:text-primary transition-colors text-sm sm:text-base">
            {friend.display_name || (friend.friend_code ? `Nutzer ${friend.friend_code.slice(0, 4)}` : "Freund")}
          </p>
          <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 flex items-center gap-1 sm:gap-1.5">
            {isOnline ? (
              <span className="text-green-500 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                Online
              </span>
            ) : (
              <span className="truncate">Freunde seit {format(new Date(friend.connected_since), "dd. MMM", { locale: de })}</span>
            )}
          </p>
        </div>
        
        <div className="flex gap-1 sm:gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
          <Button 
            size="icon" 
            variant="ghost" 
            className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl hover:bg-amber-500/10 hover:text-amber-500 transition-all"
            onClick={onMakePartner}
          >
            <HandshakeIcon className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

// Friend Request Card - Premium Design
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
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: index * 0.05, type: "spring", stiffness: 400, damping: 25 }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/15 via-primary/8 to-card border border-primary/20 p-3 sm:p-4"
    >
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
      <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
      
      <div className="relative flex items-center gap-3 sm:gap-4">
        <Avatar className="w-10 h-10 sm:w-12 sm:h-12 ring-2 ring-primary/30 shadow-lg shrink-0">
          <AvatarImage src={request.requester_avatar || undefined} />
          <AvatarFallback className="bg-primary/20 text-primary font-bold text-sm sm:text-base">
            {request.requester_name?.[0]?.toUpperCase() || "?"}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <p className="font-semibold truncate text-sm sm:text-base">{request.requester_name || "Neuer Nutzer"}</p>
          <p className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1">
            <UserPlus className="w-3 h-3" />
            <span className="truncate">möchte dein Freund sein</span>
          </p>
        </div>
        
        <div className="flex gap-1.5 sm:gap-2 shrink-0">
          <Button 
            size="icon" 
            variant="ghost" 
            className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={onDecline}
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
          <Button 
            size="sm" 
            className="h-8 px-2.5 sm:h-10 sm:px-4 bg-primary hover:bg-primary/90 rounded-xl shadow-lg shadow-primary/20 text-xs sm:text-sm"
            onClick={onAccept}
          >
            <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-1.5" />
            <span className="hidden sm:inline">Annehmen</span>
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
  const [selectedProfile, setSelectedProfile] = useState<any | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showCheckInDialog, setShowCheckInDialog] = useState(false);
  const [checkInGoals, setCheckInGoals] = useState<string[]>([]);
  const [checkInMood, setCheckInMood] = useState(3);

  const isNative = Capacitor.isNativePlatform();

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
        className="space-y-0.5 sm:space-y-1"
      >
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Freunde</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Erreicht zusammen eure Ziele
        </p>
      </motion.div>

      {/* Friend Code Card - Premium Hero Style */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.1, type: "spring", stiffness: 400, damping: 25 }}
        className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-primary/25 via-primary/15 to-primary/5 border border-primary/30 p-4 sm:p-6"
      >
        {/* Animated background elements */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
        <div className="absolute -top-10 -right-10 w-32 sm:w-48 h-32 sm:h-48 bg-primary/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-10 -left-10 w-24 sm:w-36 h-24 sm:h-36 bg-primary/15 rounded-full blur-2xl" />
        
        <div className="relative">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
            </div>
            <span className="text-xs sm:text-sm font-semibold text-primary">Dein Freundes-Code</span>
          </div>
          
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex-1 min-w-0">
              <div className="text-2xl sm:text-4xl font-bold font-mono tracking-[0.15em] sm:tracking-[0.25em] text-foreground bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text truncate">
                {myFriendCode || "--------"}
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1.5 sm:mt-2">
                Teile diesen Code mit Freunden
              </p>
            </div>
            
            <div className="flex gap-1.5 sm:gap-2 shrink-0">
              <Button 
                variant="outline" 
                size="icon"
                className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl border-2 border-primary/30 hover:bg-primary/10 hover:border-primary transition-all"
                onClick={handleCopyCode}
              >
                {codeCopied ? (
                  <Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4 sm:w-5 sm:h-5" />
                )}
              </Button>
              <Button 
                size="icon"
                className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl shadow-lg shadow-primary/20"
                onClick={handleShareCode}
              >
                <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-3 sm:space-y-4">
        <TabsList className="grid w-full grid-cols-3 h-12 sm:h-14 p-1 sm:p-1.5 bg-muted/50 rounded-xl sm:rounded-2xl">
          <TabsTrigger 
            value="friends" 
            className="rounded-lg sm:rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-md flex items-center justify-center gap-1 sm:gap-1.5 transition-all text-xs sm:text-sm px-1"
          >
            <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden xs:inline font-medium">Freunde</span>
            {friends.length > 0 && (
              <Badge variant="secondary" className="h-4 sm:h-5 px-1 sm:px-1.5 text-[9px] sm:text-[10px] font-semibold">{friends.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger 
            value="add" 
            className="rounded-lg sm:rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-md flex items-center justify-center gap-1 sm:gap-1.5 transition-all text-xs sm:text-sm px-1"
          >
            <UserPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden xs:inline font-medium">Neu</span>
            {pendingRequests.length > 0 && (
              <Badge variant="destructive" className="h-4 sm:h-5 px-1 sm:px-1.5 text-[9px] sm:text-[10px] font-semibold animate-pulse">{pendingRequests.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger 
            value="partner" 
            className="rounded-lg sm:rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-md flex items-center justify-center gap-1 sm:gap-1.5 transition-all text-xs sm:text-sm px-1"
          >
            <HandshakeIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden xs:inline font-medium">Partner</span>
            {partnerRequests.length > 0 && (
              <Badge className="h-4 sm:h-5 px-1 sm:px-1.5 text-[9px] sm:text-[10px] font-semibold bg-amber-500 hover:bg-amber-500 animate-pulse">{partnerRequests.length}</Badge>
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
                    onMakePartner={() => sendPartnerRequest(friend.id)}
                    onViewProfile={() => setSelectedProfile(friend)}
                  />
                ))}
              </div>
            )}
          </AnimatePresence>
        </TabsContent>

        {/* Add Friends Tab */}
        <TabsContent value="add" className="space-y-4 sm:space-y-6 mt-3 sm:mt-4">
          {/* Pending Requests */}
          {pendingRequests.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-2 sm:space-y-3"
            >
              <h3 className="font-semibold text-sm sm:text-base flex items-center gap-2">
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
            className="rounded-xl sm:rounded-2xl bg-card border border-border p-4 sm:p-5 space-y-3 sm:space-y-4"
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <UserPlus className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-sm sm:text-base">Mit Code hinzufügen</h3>
                <p className="text-[10px] sm:text-xs text-muted-foreground">Gib den 8-stelligen Code ein</p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Input
                placeholder="XXXXXXXX"
                value={friendCode}
                onChange={(e) => setFriendCode(e.target.value.toUpperCase().slice(0, 8))}
                maxLength={8}
                className="h-10 sm:h-12 font-mono text-base sm:text-lg tracking-[0.15em] sm:tracking-[0.2em] uppercase text-center rounded-lg sm:rounded-xl border-2 focus:border-primary"
              />
              <Button 
                onClick={handleSendRequestByCode} 
                disabled={sendingRequest || friendCode.length < 8}
                className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg sm:rounded-xl shrink-0"
              >
                {sendingRequest ? (
                  <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                )}
              </Button>
            </div>
          </motion.div>

          {/* Search Users */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-xl sm:rounded-2xl bg-card border border-border p-4 sm:p-5 space-y-3 sm:space-y-4"
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                <Search className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-sm sm:text-base">Nutzer suchen</h3>
                <p className="text-[10px] sm:text-xs text-muted-foreground">Nach Display-Namen suchen</p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Input
                placeholder="Name eingeben..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="h-10 sm:h-12 rounded-lg sm:rounded-xl text-sm sm:text-base"
              />
              <Button 
                onClick={handleSearch} 
                disabled={searching || searchQuery.length < 2}
                variant="outline"
                className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg sm:rounded-xl shrink-0"
              >
                {searching ? (
                  <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                ) : (
                  <Search className="w-4 h-4 sm:w-5 sm:h-5" />
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
                    className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg sm:rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <Avatar className="w-9 h-9 sm:w-10 sm:h-10 shrink-0">
                      <AvatarImage src={result.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary text-sm">
                        {result.display_name?.[0]?.toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate text-sm sm:text-base">{result.display_name || (result.friend_code ? `Nutzer ${result.friend_code.slice(0, 4)}` : "Nutzer")}</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground font-mono">{result.friend_code}</p>
                    </div>
                    <Button 
                      size="sm" 
                      className="rounded-lg sm:rounded-xl h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm shrink-0"
                      onClick={() => sendFriendRequestByUserId(result.user_id)}
                    >
                      <UserPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-1" />
                      <span className="hidden sm:inline">Hinzufügen</span>
                    </Button>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </TabsContent>

        {/* Partner Tab - Redesigned */}
        <TabsContent value="partner" className="mt-3 sm:mt-4 space-y-3 sm:space-y-4">
          {/* Intro Card - Only show if no partner */}
          {!partner && partnerRequests.length === 0 && sentPartnerRequests.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br from-amber-500/15 via-amber-500/5 to-transparent border border-amber-500/20 p-4 sm:p-5"
            >
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent" />
              <div className="relative flex items-start gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shrink-0">
                  <HandshakeIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-base sm:text-lg">Accountability Partner</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">
                    Wähle einen Freund als Partner. Checkt täglich gemeinsam ein und motiviert euch gegenseitig!
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Incoming Partner Requests */}
          {partnerRequests.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-2 sm:space-y-3"
            >
              <div className="flex items-center gap-2">
                <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500" />
                <span className="text-xs sm:text-sm font-semibold">Partner-Anfragen</span>
                <Badge className="h-4 sm:h-5 bg-amber-500 hover:bg-amber-500 text-[10px] sm:text-xs">{partnerRequests.length}</Badge>
              </div>
              {partnerRequests.map((req, index) => (
                <motion.div
                  key={req.id}
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: index * 0.05, type: "spring", stiffness: 400, damping: 25 }}
                  className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br from-amber-500/15 via-amber-500/5 to-card border border-amber-500/20 p-3 sm:p-4"
                >
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent" />
                  <div className="relative flex items-center gap-3 sm:gap-4">
                    <Avatar className="w-10 h-10 sm:w-12 sm:h-12 ring-2 ring-amber-500/30 shadow-lg shrink-0">
                      <AvatarImage src={req.requester_avatar || undefined} />
                      <AvatarFallback className="bg-amber-500/20 text-amber-500 font-bold text-sm sm:text-base">
                        {req.requester_name?.[0]?.toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate text-sm sm:text-base">{req.requester_name || "Neuer Nutzer"}</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1">
                        <HandshakeIcon className="w-3 h-3" />
                        <span className="truncate">möchte dein Partner werden</span>
                      </p>
                    </div>
                    <div className="flex gap-1.5 sm:gap-2 shrink-0">
                      <Button 
                        variant="ghost" 
                        className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={() => declinePartnerRequest(req.id)}
                      >
                        <X className="w-4 h-4 sm:w-5 sm:h-5" />
                      </Button>
                      <Button 
                        size="sm" 
                        className="h-8 px-2.5 sm:h-10 sm:px-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-lg sm:rounded-xl shadow-lg shadow-amber-500/20 text-xs sm:text-sm"
                        onClick={() => acceptPartnerRequest(req.id)}
                      >
                        <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-1.5" />
                        <span className="hidden sm:inline">Annehmen</span>
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
              className="space-y-2 sm:space-y-3"
            >
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
                <span className="text-xs sm:text-sm font-medium text-muted-foreground">Deine Anfragen</span>
              </div>
              {sentPartnerRequests.map((req, index) => (
                <motion.div
                  key={req.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-muted/30 border border-border/50"
                >
                  <Avatar className="w-9 h-9 sm:w-11 sm:h-11 ring-2 ring-muted shrink-0">
                    <AvatarImage src={req.addressee_avatar || undefined} />
                    <AvatarFallback className="bg-muted text-sm">{req.addressee_name?.[0]?.toUpperCase() || "?"}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate text-sm sm:text-base">{req.addressee_name || "Nutzer"}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1 sm:gap-1.5">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span className="truncate">Warten auf Antwort...</span>
                    </p>
                  </div>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-8 sm:h-9 px-2 sm:px-3 rounded-lg sm:rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 text-xs sm:text-sm shrink-0"
                    onClick={() => cancelPartnerRequest(req.id)}
                  >
                    <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-1" />
                    <span className="hidden sm:inline">Zurückziehen</span>
                  </Button>
                </motion.div>
              ))}
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            {partner ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative overflow-hidden rounded-2xl sm:rounded-3xl"
              >
                {/* Partner Card Header */}
                <div className="relative bg-gradient-to-br from-amber-500/20 via-amber-500/10 to-transparent p-4 sm:p-6 pb-16 sm:pb-20">
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/20 via-transparent to-transparent" />
                  <div className="absolute -top-10 -right-10 w-32 sm:w-40 h-32 sm:h-40 bg-amber-500/20 rounded-full blur-3xl" />
                  <div className="absolute -bottom-10 -left-10 w-24 sm:w-32 h-24 sm:h-32 bg-orange-500/10 rounded-full blur-2xl" />
                </div>

                {/* Avatar */}
                <div className="relative -mt-14 sm:-mt-16 flex justify-center">
                  <div className="relative">
                    <Avatar className="w-24 h-24 sm:w-28 sm:h-28 ring-4 ring-background shadow-2xl">
                      <AvatarImage src={partner.partner_avatar || undefined} />
                      <AvatarFallback className="text-3xl sm:text-4xl font-bold bg-gradient-to-br from-amber-500/30 to-amber-500/10 text-amber-500">
                        {partner.partner_name?.[0]?.toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg border-4 border-background">
                      <HandshakeIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                  </div>
                </div>

                {/* Partner Info */}
                <div className="text-center px-4 sm:px-6 pt-3 sm:pt-4 pb-2">
                  <h3 className="font-bold text-xl sm:text-2xl tracking-tight">{partner.partner_name || "Partner"}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">
                    Partner seit {format(new Date(partner.started_at), "d. MMM yyyy", { locale: de })}
                  </p>
                </div>

                {/* Stats Grid */}
                <div className="px-3 sm:px-4 py-3 sm:py-4">
                  <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                    {/* Streak */}
                    <div className="relative overflow-hidden text-center p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-br from-orange-500/15 to-orange-500/5 border border-orange-500/10">
                      <div className="flex justify-center mb-1.5 sm:mb-2">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-orange-500/20 flex items-center justify-center">
                          <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" />
                        </div>
                      </div>
                      <p className="text-xl sm:text-2xl font-bold">{partner.streak || 0}</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground font-medium">Tage</p>
                    </div>

                    {/* My Check-in */}
                    <div className={cn(
                      "relative overflow-hidden text-center p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border",
                      partner.todayCheckedIn 
                        ? "bg-gradient-to-br from-green-500/15 to-green-500/5 border-green-500/20" 
                        : "bg-muted/30 border-border/50"
                    )}>
                      <div className="flex justify-center mb-1.5 sm:mb-2">
                        <div className={cn(
                          "w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center",
                          partner.todayCheckedIn ? "bg-green-500" : "bg-muted"
                        )}>
                          {partner.todayCheckedIn ? (
                            <Check className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                          ) : (
                            <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                      <p className="text-xs sm:text-sm font-semibold">{partner.todayCheckedIn ? "Erledigt" : "Offen"}</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground font-medium">Du</p>
                    </div>

                    {/* Partner Check-in */}
                    <div className={cn(
                      "relative overflow-hidden text-center p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border",
                      partner.partnerCheckedIn 
                        ? "bg-gradient-to-br from-green-500/15 to-green-500/5 border-green-500/20" 
                        : "bg-muted/30 border-border/50"
                    )}>
                      <div className="flex justify-center mb-1.5 sm:mb-2">
                        <div className={cn(
                          "w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center",
                          partner.partnerCheckedIn ? "bg-green-500" : "bg-muted"
                        )}>
                          {partner.partnerCheckedIn ? (
                            <Check className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                          ) : (
                            <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                      <p className="text-xs sm:text-sm font-semibold">{partner.partnerCheckedIn ? "Erledigt" : "Offen"}</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground font-medium">Partner</p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="px-3 sm:px-4 pb-3 sm:pb-4 space-y-2 sm:space-y-3">
                  {!partner.todayCheckedIn && (
                    <Button 
                      className="w-full h-10 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-500/20 text-sm sm:text-base"
                      onClick={() => setShowCheckInDialog(true)}
                    >
                      <Check className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" />
                      Heute einchecken
                    </Button>
                  )}
                  {partner.todayCheckedIn && (
                    <div className="p-3 sm:p-4 rounded-lg sm:rounded-xl bg-green-500/10 border border-green-500/20 text-center">
                      <p className="text-green-600 dark:text-green-400 font-medium flex items-center justify-center gap-1.5 sm:gap-2 text-sm sm:text-base">
                        <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                        Du hast heute eingecheckt! 🎉
                      </p>
                    </div>
                  )}
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" className="w-full h-9 sm:h-10 text-xs sm:text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg sm:rounded-xl">
                        <UserX className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                        Partnerschaft beenden
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="rounded-2xl sm:rounded-3xl max-w-[90vw] sm:max-w-lg">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-base sm:text-lg">Partnerschaft beenden?</AlertDialogTitle>
                        <AlertDialogDescription className="text-sm">
                          Euer {partner.streak || 0}-Tage Streak geht verloren. Du kannst jederzeit einen neuen Partner wählen.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter className="gap-2 sm:gap-0">
                        <AlertDialogCancel className="rounded-lg sm:rounded-xl">Abbrechen</AlertDialogCancel>
                        <AlertDialogAction 
                          className="rounded-lg sm:rounded-xl bg-destructive hover:bg-destructive/90"
                          onClick={() => endPartnership()}
                        >
                          Beenden
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </motion.div>
            ) : friends.length > 0 && partnerRequests.length === 0 && sentPartnerRequests.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-2 sm:space-y-3"
              >
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Wähle einen Freund als Partner:</p>
                <div className="grid gap-1.5 sm:gap-2">
                  {friends.map((friend, index) => (
                    <motion.div
                      key={friend.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Button 
                        variant="outline" 
                        className="w-full justify-start gap-2 sm:gap-3 h-12 sm:h-14 rounded-lg sm:rounded-xl border-2 hover:border-amber-500/50 hover:bg-amber-500/5 transition-all"
                        onClick={() => sendPartnerRequest(friend.id)}
                      >
                        <Avatar className="w-8 h-8 sm:w-9 sm:h-9 shrink-0">
                          <AvatarImage src={friend.avatar_url || undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary text-sm">{friend.display_name?.[0]?.toUpperCase() || "?"}</AvatarFallback>
                        </Avatar>
                        <span className="flex-1 text-left font-medium truncate text-sm sm:text-base">{friend.display_name || "Freund"}</span>
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-md sm:rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                          <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500" />
                        </div>
                      </Button>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Empty state - no friends */}
          {!partner && friends.length === 0 && partnerRequests.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-dashed border-border p-6 sm:p-10 text-center"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-muted/30 to-transparent" />
              <div className="relative">
                <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-xl sm:rounded-2xl bg-muted flex items-center justify-center">
                  <Users className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-base sm:text-lg mb-1.5 sm:mb-2">Erst Freunde hinzufügen</h3>
                <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4 max-w-xs mx-auto">
                  Füge Freunde hinzu, um einen Partner zu wählen
                </p>
                <Button onClick={() => setActiveTab("add")} className="rounded-lg sm:rounded-xl h-9 sm:h-10 text-sm">
                  <UserPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                  Freunde finden
                </Button>
              </div>
            </motion.div>
          )}
        </TabsContent>
      </Tabs>


      {/* Privacy Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-[90vw] sm:max-w-md rounded-2xl sm:rounded-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
              Privatsphäre-Einstellungen
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 sm:space-y-6 py-3 sm:py-4">
            <div className="space-y-2">
              <Label className="text-sm">Score-Sichtbarkeit</Label>
              <Select 
                value={privacySettings?.show_score || "delta_only"}
                onValueChange={(v) => updatePrivacySettings({ show_score: v as any })}
              >
                <SelectTrigger className="h-10 sm:h-12 rounded-lg sm:rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Niemand</SelectItem>
                  <SelectItem value="delta_only">Nur Veränderung</SelectItem>
                  <SelectItem value="full">Vollständig</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between p-3 sm:p-4 bg-muted/50 rounded-lg sm:rounded-xl">
              <div className="min-w-0 flex-1 mr-3">
                <Label className="text-sm">Streak anzeigen</Label>
                <p className="text-[10px] sm:text-xs text-muted-foreground">Freunde sehen deine Streak</p>
              </div>
              <Switch 
                checked={privacySettings?.show_streak ?? true}
                onCheckedChange={(v) => updatePrivacySettings({ show_streak: v })}
              />
            </div>

            <div className="flex items-center justify-between p-3 sm:p-4 bg-muted/50 rounded-lg sm:rounded-xl">
              <div className="min-w-0 flex-1 mr-3">
                <Label className="text-sm">Challenges anzeigen</Label>
                <p className="text-[10px] sm:text-xs text-muted-foreground">Challenge-Fortschritt teilen</p>
              </div>
              <Switch 
                checked={privacySettings?.show_challenges ?? true}
                onCheckedChange={(v) => updatePrivacySettings({ show_challenges: v })}
              />
            </div>

            <div className="flex items-center justify-between p-3 sm:p-4 bg-muted/50 rounded-lg sm:rounded-xl">
              <div className="min-w-0 flex-1 mr-3">
                <Label className="text-sm">Challenge-Einladungen</Label>
                <p className="text-[10px] sm:text-xs text-muted-foreground">Freunde können dich einladen</p>
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
        <DialogContent className="max-w-[90vw] sm:max-w-md rounded-2xl sm:rounded-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Check className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />
              Täglicher Check-in
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 sm:space-y-6 py-3 sm:py-4">
            <div className="space-y-2 sm:space-y-3">
              <Label className="text-sm">Was hast du heute erreicht?</Label>
              <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                {["Training", "Gesund gegessen", "Wasser getrunken", "Gut geschlafen", "Skincare", "Supplements"].map((goal) => (
                  <Button
                    key={goal}
                    variant={checkInGoals.includes(goal) ? "default" : "outline"}
                    className="h-9 sm:h-10 rounded-lg sm:rounded-xl text-xs sm:text-sm px-2 sm:px-3"
                    onClick={() => {
                      setCheckInGoals(prev => 
                        prev.includes(goal) 
                          ? prev.filter(g => g !== goal)
                          : [...prev, goal]
                      );
                    }}
                  >
                    {checkInGoals.includes(goal) && <Check className="w-3 h-3 mr-1" />}
                    <span className="truncate">{goal}</span>
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2 sm:space-y-3">
              <Label className="text-sm">Wie fühlst du dich? (1-5)</Label>
              <div className="flex gap-1.5 sm:gap-2 justify-center">
                {[1, 2, 3, 4, 5].map((mood) => (
                  <Button
                    key={mood}
                    variant={checkInMood === mood ? "default" : "outline"}
                    className={cn(
                      "w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl text-base sm:text-lg p-0",
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
              className="w-full h-10 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-sm sm:text-base"
              onClick={async () => {
                const success = await checkIn(checkInGoals, checkInMood);
                if (success) {
                  setShowCheckInDialog(false);
                  setCheckInGoals([]);
                  setCheckInMood(3);
                }
              }}
            >
              <Check className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" />
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
          connectionId={selectedProfile.connection_id}
          isOnline={isOnline(selectedProfile.id)}
          onMakePartner={() => sendPartnerRequest(selectedProfile.id)}
          onRemoveFriend={() => removeFriend(selectedProfile.connection_id)}
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