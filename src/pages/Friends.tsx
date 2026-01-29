import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Users, UserPlus, MessageCircle, Target, Settings, Copy, Check, Search, Send, HandshakeIcon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useFriends } from "@/hooks/useFriends";
import { useFriendMessages } from "@/hooks/useFriendMessages";
import { useAccountabilityPartner } from "@/hooks/useAccountabilityPartner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Capacitor } from "@capacitor/core";
import { MobileAppLayout } from "@/components/mobile/MobileAppLayout";

// Friend Card Component
function FriendCard({ 
  friend, 
  onRemove,
  onMessage,
  onMakePartner 
}: { 
  friend: any; 
  onRemove: () => void;
  onMessage: () => void;
  onMakePartner: () => void;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <Avatar className="w-12 h-12">
          <AvatarImage src={friend.avatar_url || undefined} />
          <AvatarFallback>{friend.display_name?.[0]?.toUpperCase() || "?"}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{friend.display_name || "Unbekannt"}</p>
          <p className="text-xs text-muted-foreground">
            Seit {format(new Date(friend.connected_since), "dd. MMM yyyy", { locale: de })}
          </p>
        </div>
        <div className="flex gap-1">
          <Button size="icon" variant="ghost" onClick={onMessage}>
            <MessageCircle className="w-4 h-4" />
          </Button>
          <Button size="icon" variant="ghost" onClick={onMakePartner}>
            <HandshakeIcon className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

// Friend Request Card
function RequestCard({ 
  request, 
  onAccept, 
  onDecline 
}: { 
  request: any; 
  onAccept: () => void; 
  onDecline: () => void;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <Avatar className="w-10 h-10">
          <AvatarImage src={request.requester_avatar || undefined} />
          <AvatarFallback>{request.requester_name?.[0]?.toUpperCase() || "?"}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <p className="font-medium">{request.requester_name || "Unbekannt"}</p>
          <p className="text-xs text-muted-foreground">
            {format(new Date(request.created_at), "dd. MMM", { locale: de })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={onDecline}>
            Ablehnen
          </Button>
          <Button size="sm" onClick={onAccept}>
            Annehmen
          </Button>
        </div>
      </div>
    </Card>
  );
}

// Main Friends Page
export default function Friends() {
  const { user, loading: authLoading } = useAuth();
  const { 
    friends, 
    pendingRequests, 
    myFriendCode, 
    privacySettings,
    loading: friendsLoading,
    sendFriendRequest,
    searchUsers,
    acceptRequest,
    declineRequest,
    removeFriend,
    updatePrivacySettings,
  } = useFriends();
  const { conversations, getTotalUnreadCount } = useFriendMessages();
  const { partner, createPartnership } = useAccountabilityPartner();

  const [activeTab, setActiveTab] = useState("friends");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [friendCode, setFriendCode] = useState("");
  const [codeCopied, setCodeCopied] = useState(false);
  const [searching, setSearching] = useState(false);
  const [sendingRequest, setSendingRequest] = useState(false);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  const isNative = Capacitor.isNativePlatform();
  const unreadCount = getTotalUnreadCount();

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
    if (!friendCode.trim()) return;
    setSendingRequest(true);
    await sendFriendRequest(friendCode.trim());
    setFriendCode("");
    setSendingRequest(false);
  };

  // Copy friend code
  const handleCopyCode = () => {
    if (myFriendCode) {
      navigator.clipboard.writeText(myFriendCode);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    }
  };

  if (authLoading || friendsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const content = (
    <div className={cn("space-y-6", isNative ? "px-4 py-6" : "container max-w-2xl mx-auto px-4 py-8")}>
      {!isNative && (
        <div className="flex items-center justify-between">
          <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" />
            Dashboard
          </Link>
          <Button variant="ghost" size="icon" onClick={() => setShowSettings(true)}>
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      )}

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold mb-1">Freunde</h1>
        <p className="text-sm text-muted-foreground">
          Verbinde dich mit anderen und erreiche zusammen eure Ziele
        </p>
      </motion.div>

      {/* My Friend Code */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="p-4 bg-primary/5 border-primary/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Dein Freundes-Code</p>
              <p className="text-2xl font-bold font-mono tracking-wider">{myFriendCode || "..."}</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleCopyCode}>
              {codeCopied ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
              {codeCopied ? "Kopiert!" : "Kopieren"}
            </Button>
          </div>
        </Card>
      </motion.div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="friends" className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Freunde</span>
            {friends.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5">{friends.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="add" className="flex items-center gap-1">
            <UserPlus className="w-4 h-4" />
            <span className="hidden sm:inline">Hinzufügen</span>
            {pendingRequests.length > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 px-1.5">{pendingRequests.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="chat" className="flex items-center gap-1">
            <MessageCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Chat</span>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 px-1.5">{unreadCount}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="partner" className="flex items-center gap-1">
            <HandshakeIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Partner</span>
          </TabsTrigger>
        </TabsList>

        {/* Friends List Tab */}
        <TabsContent value="friends" className="space-y-4 mt-4">
          {friends.length === 0 ? (
            <Card className="p-8 text-center">
              <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="font-medium mb-2">Noch keine Freunde</p>
              <p className="text-sm text-muted-foreground mb-4">
                Teile deinen Code oder suche nach anderen Nutzern
              </p>
              <Button onClick={() => setActiveTab("add")}>
                <UserPlus className="w-4 h-4 mr-2" />
                Freunde hinzufügen
              </Button>
            </Card>
          ) : (
            friends.map(friend => (
              <FriendCard
                key={friend.id}
                friend={friend}
                onRemove={() => removeFriend(friend.connection_id)}
                onMessage={() => {
                  setSelectedChat(friend.id);
                  setActiveTab("chat");
                }}
                onMakePartner={() => createPartnership(friend.id)}
              />
            ))
          )}
        </TabsContent>

        {/* Add Friends Tab */}
        <TabsContent value="add" className="space-y-6 mt-4">
          {/* Pending Requests */}
          {pendingRequests.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-medium flex items-center gap-2">
                Anfragen
                <Badge variant="destructive">{pendingRequests.length}</Badge>
              </h3>
              {pendingRequests.map(request => (
                <RequestCard
                  key={request.id}
                  request={request}
                  onAccept={() => acceptRequest(request.id)}
                  onDecline={() => declineRequest(request.id)}
                />
              ))}
            </div>
          )}

          {/* Add by Code */}
          <Card className="p-4">
            <h3 className="font-medium mb-3">Mit Code hinzufügen</h3>
            <div className="flex gap-2">
              <Input
                placeholder="Freundes-Code eingeben"
                value={friendCode}
                onChange={(e) => setFriendCode(e.target.value.toUpperCase())}
                maxLength={8}
                className="font-mono tracking-wider uppercase"
              />
              <Button onClick={handleSendRequestByCode} disabled={sendingRequest || friendCode.length < 8}>
                {sendingRequest ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
          </Card>

          {/* Search Users */}
          <Card className="p-4">
            <h3 className="font-medium mb-3">Nutzer suchen</h3>
            <div className="flex gap-2 mb-4">
              <Input
                placeholder="Name eingeben..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button onClick={handleSearch} disabled={searching || searchQuery.length < 2}>
                {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              </Button>
            </div>

            {searchResults.length > 0 && (
              <div className="space-y-2">
                {searchResults.map(result => (
                  <div key={result.user_id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={result.avatar_url || undefined} />
                      <AvatarFallback>{result.display_name?.[0]?.toUpperCase() || "?"}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{result.display_name || "Unbekannt"}</p>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => sendFriendRequest(result.friend_code)}
                    >
                      <UserPlus className="w-4 h-4 mr-1" />
                      Anfragen
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Chat Tab */}
        <TabsContent value="chat" className="mt-4">
          {conversations.length === 0 ? (
            <Card className="p-8 text-center">
              <MessageCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="font-medium mb-2">Keine Nachrichten</p>
              <p className="text-sm text-muted-foreground">
                Starte einen Chat mit einem Freund
              </p>
            </Card>
          ) : (
            <div className="space-y-2">
              {conversations.map(conv => (
                <Card 
                  key={conv.friend_id} 
                  className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => setSelectedChat(conv.friend_id)}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={conv.friend_avatar || undefined} />
                      <AvatarFallback>{conv.friend_name?.[0]?.toUpperCase() || "?"}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{conv.friend_name || "Unbekannt"}</p>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(conv.last_message_time), "HH:mm", { locale: de })}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{conv.last_message}</p>
                    </div>
                    {conv.unread_count > 0 && (
                      <Badge variant="destructive">{conv.unread_count}</Badge>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Partner Tab */}
        <TabsContent value="partner" className="mt-4">
          {partner ? (
            <Card className="p-6">
              <div className="text-center mb-6">
                <Avatar className="w-20 h-20 mx-auto mb-3">
                  <AvatarImage src={partner.partner_avatar || undefined} />
                  <AvatarFallback className="text-2xl">{partner.partner_name?.[0]?.toUpperCase() || "?"}</AvatarFallback>
                </Avatar>
                <h3 className="font-bold text-lg">{partner.partner_name || "Partner"}</h3>
                <p className="text-sm text-muted-foreground">
                  Partner seit {format(new Date(partner.started_at), "dd. MMM yyyy", { locale: de })}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold text-primary">{partner.streak}</p>
                  <p className="text-xs text-muted-foreground">Streak</p>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className={cn("w-4 h-4 rounded-full mx-auto mb-1", partner.todayCheckedIn ? "bg-green-500" : "bg-muted-foreground")} />
                  <p className="text-xs text-muted-foreground">Du</p>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className={cn("w-4 h-4 rounded-full mx-auto mb-1", partner.partnerCheckedIn ? "bg-green-500" : "bg-muted-foreground")} />
                  <p className="text-xs text-muted-foreground">Partner</p>
                </div>
              </div>

              {!partner.todayCheckedIn && (
                <Button className="w-full">
                  <Check className="w-4 h-4 mr-2" />
                  Heute einchecken
                </Button>
              )}
            </Card>
          ) : (
            <Card className="p-8 text-center">
              <HandshakeIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="font-medium mb-2">Kein Accountability Partner</p>
              <p className="text-sm text-muted-foreground mb-4">
                Wähle einen Freund als Partner für tägliche Check-ins
              </p>
              {friends.length > 0 ? (
                <div className="space-y-2">
                  {friends.slice(0, 3).map(friend => (
                    <Button 
                      key={friend.id} 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => createPartnership(friend.id)}
                    >
                      <Avatar className="w-6 h-6 mr-2">
                        <AvatarFallback>{friend.display_name?.[0] || "?"}</AvatarFallback>
                      </Avatar>
                      {friend.display_name || "Freund"}
                    </Button>
                  ))}
                </div>
              ) : (
                <Button onClick={() => setActiveTab("add")}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Erst Freunde hinzufügen
                </Button>
              )}
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Privacy Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Privatsphäre-Einstellungen</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label>Score-Sichtbarkeit</Label>
              <Select 
                value={privacySettings?.show_score || "delta_only"}
                onValueChange={(v) => updatePrivacySettings({ show_score: v as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nicht anzeigen</SelectItem>
                  <SelectItem value="delta_only">Nur Verbesserung (+0.5)</SelectItem>
                  <SelectItem value="full">Voller Score anzeigen</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label>Streak anzeigen</Label>
              <Switch
                checked={privacySettings?.show_streak ?? true}
                onCheckedChange={(v) => updatePrivacySettings({ show_streak: v })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Challenges anzeigen</Label>
              <Switch
                checked={privacySettings?.show_challenges ?? true}
                onCheckedChange={(v) => updatePrivacySettings({ show_challenges: v })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Challenge-Einladungen erlauben</Label>
              <Switch
                checked={privacySettings?.allow_challenge_invites ?? true}
                onCheckedChange={(v) => updatePrivacySettings({ allow_challenge_invites: v })}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );

  if (isNative) {
    return (
      <MobileAppLayout title="Freunde" showBack>
        {content}
      </MobileAppLayout>
    );
  }

  return <div className="min-h-screen bg-background">{content}</div>;
}
