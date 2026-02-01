import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole, AppRole } from "@/hooks/useUserRole";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft,
  Users,
  Shield,
  Crown,
  User,
  RefreshCw,
  Search,
  Copy,
  Check,
  Sparkles,
  Star,
  Trash2,
  Loader2
} from "lucide-react";

interface UserWithRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
  display_name?: string;
  email?: string;
  subscription_status?: string;
  plan_type?: string;
}

type SubscriptionType = "none" | "premium" | "lifetime";

export default function UserManagement() {
  const navigate = useNavigate();
  const { isOwner, role: currentUserRole } = useUserRole();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [updatingSub, setUpdatingSub] = useState<string | null>(null);
  const [deletingUser, setDeletingUser] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Fetch user roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('*')
        .order('created_at', { ascending: false });

      if (rolesError) throw rolesError;

      // Fetch profiles for display names
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, display_name');

      if (profilesError) throw profilesError;

      // Fetch subscriptions for emails and status
      const { data: subsData } = await supabase
        .from('subscriptions')
        .select('user_id, customer_email, status, plan_type');

      // Merge data
      const usersWithDetails = (rolesData || []).map(role => {
        const profile = profilesData?.find(p => p.user_id === role.user_id);
        const sub = subsData?.find(s => s.user_id === role.user_id);
        return {
          ...role,
          display_name: profile?.display_name || undefined,
          email: sub?.customer_email || undefined,
          subscription_status: sub?.status || undefined,
          plan_type: sub?.plan_type || undefined,
        };
      });

      setUsers(usersWithDetails);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "Fehler",
        description: "Nutzer konnten nicht geladen werden",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;
    const query = searchQuery.toLowerCase();
    return users.filter(user => 
      user.user_id.toLowerCase().includes(query) ||
      user.display_name?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query) ||
      user.role.toLowerCase().includes(query) ||
      user.plan_type?.toLowerCase().includes(query)
    );
  }, [users, searchQuery]);

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const updateUserRole = async (userId: string, newRole: AppRole) => {
    if (!isOwner) {
      toast({
        title: "Keine Berechtigung",
        description: "Nur Owner können Rollen ändern",
        variant: "destructive",
      });
      return;
    }

    setUpdating(userId);
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ role: newRole })
        .eq('user_id', userId);

      if (error) throw error;

      setUsers(prev => 
        prev.map(u => 
          u.user_id === userId ? { ...u, role: newRole } : u
        )
      );

      toast({
        title: "Rolle aktualisiert",
        description: `Nutzer wurde zu ${newRole} geändert`,
      });
    } catch (error) {
      console.error("Error updating role:", error);
      toast({
        title: "Fehler",
        description: "Rolle konnte nicht geändert werden",
        variant: "destructive",
      });
    } finally {
      setUpdating(null);
    }
  };

  const updateSubscription = async (userId: string, subType: SubscriptionType) => {
    if (!isOwner) {
      toast({
        title: "Keine Berechtigung",
        description: "Nur Owner können Abos ändern",
        variant: "destructive",
      });
      return;
    }

    setUpdatingSub(userId);
    try {
      // Check if user has an existing subscription
      const { data: existingSub } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (subType === "none") {
        // Remove subscription
        if (existingSub) {
          const { error } = await supabase
            .from('subscriptions')
            .delete()
            .eq('user_id', userId);
          if (error) throw error;
        }
        
        setUsers(prev => 
          prev.map(u => 
            u.user_id === userId 
              ? { ...u, subscription_status: undefined, plan_type: undefined } 
              : u
          )
        );
        
        toast({
          title: "Abo entfernt",
          description: "Nutzer ist jetzt Free-User",
        });
      } else {
        // Create or update subscription
        // Calculate dates properly - use end of day for period end
        const now = new Date();
        const periodEnd = new Date();
        if (subType === 'lifetime') {
          periodEnd.setFullYear(periodEnd.getFullYear() + 100);
        } else {
          periodEnd.setDate(periodEnd.getDate() + 30);
        }
        // Set to end of day in local timezone
        periodEnd.setHours(23, 59, 59, 999);

        const subscriptionData = {
          user_id: userId,
          plan_type: subType,
          status: 'active',
          stripe_customer_id: `admin_granted_${userId}`,
          amount: subType === 'lifetime' ? 4999 : 999,
          currency: 'eur',
          current_period_start: now.toISOString(),
          current_period_end: periodEnd.toISOString(),
        };

        if (existingSub) {
          const { error } = await supabase
            .from('subscriptions')
            .update(subscriptionData)
            .eq('user_id', userId);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('subscriptions')
            .insert(subscriptionData);
          if (error) throw error;
        }

        setUsers(prev => 
          prev.map(u => 
            u.user_id === userId 
              ? { ...u, subscription_status: 'active', plan_type: subType } 
              : u
          )
        );

        toast({
          title: "Abo aktualisiert",
          description: `Nutzer hat jetzt ${subType === 'lifetime' ? 'Lifetime' : 'Premium'}-Zugang`,
        });
      }
    } catch (error) {
      console.error("Error updating subscription:", error);
      toast({
        title: "Fehler",
        description: "Abo konnte nicht geändert werden",
        variant: "destructive",
      });
    } finally {
      setUpdatingSub(null);
    }
  };

  const deleteUser = async (userId: string) => {
    if (!isOwner) {
      toast({
        title: "Keine Berechtigung",
        description: "Nur Owner können Nutzer löschen",
        variant: "destructive",
      });
      return;
    }

    setDeletingUser(userId);
    try {
      const { data, error } = await supabase.functions.invoke("admin-delete-user", {
        body: { targetUserId: userId },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      // Remove user from local state
      setUsers(prev => prev.filter(u => u.user_id !== userId));

      toast({
        title: "Nutzer gelöscht",
        description: "Das Konto und alle Daten wurden entfernt. Der Nutzer kann sich jetzt neu registrieren.",
      });
    } catch (error: any) {
      console.error("Error deleting user:", error);
      toast({
        title: "Fehler",
        description: error.message || "Nutzer konnte nicht gelöscht werden",
        variant: "destructive",
      });
    } finally {
      setDeletingUser(null);
    }
  };

  const getUserSubscriptionType = (user: UserWithRole): SubscriptionType => {
    if (!user.subscription_status || user.subscription_status !== 'active') return "none";
    if (user.plan_type === 'lifetime') return "lifetime";
    if (user.plan_type === 'premium') return "premium";
    return "none";
  };

  const getRoleIcon = (role: AppRole) => {
    switch (role) {
      case "owner":
        return <Crown className="w-4 h-4 text-primary" />;
      case "admin":
        return <Shield className="w-4 h-4 text-secondary-foreground" />;
      default:
        return <User className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getRoleBadgeClass = (role: AppRole) => {
    switch (role) {
      case "owner":
        return "bg-primary/20 text-primary";
      case "admin":
        return "bg-secondary text-secondary-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getSubBadge = (user: UserWithRole) => {
    const subType = getUserSubscriptionType(user);
    switch (subType) {
      case "lifetime":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-600 dark:text-yellow-400">
            <Star className="w-3 h-3" />
            Lifetime
          </span>
        );
      case "premium":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary/20 text-primary">
            <Sparkles className="w-3 h-3" />
            Premium
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
            Free
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <button 
            onClick={() => navigate("/admin")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Admin</span>
          </button>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            <h1 className="text-lg font-bold">Nutzerverwaltung</h1>
          </div>
          <Button variant="ghost" size="icon" onClick={fetchUsers}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <Card className="border-border">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Alle Nutzer ({filteredUsers.length}{searchQuery ? ` von ${users.length}` : ''})
              </CardTitle>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Suchen..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                {searchQuery ? 'Keine Nutzer gefunden' : 'Keine Nutzer vorhanden'}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Benutzer</TableHead>
                      <TableHead>User ID</TableHead>
                      <TableHead>Rolle</TableHead>
                      <TableHead>Abo-Status</TableHead>
                      <TableHead>Erstellt</TableHead>
                      {isOwner && <TableHead>Rolle ändern</TableHead>}
                      {isOwner && <TableHead>Abo ändern</TableHead>}
                      {isOwner && <TableHead>Aktionen</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-foreground">
                              {user.display_name || 'Unbekannt'}
                            </span>
                            {user.email && (
                              <span className="text-xs text-muted-foreground">
                                {user.email}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <code className="text-xs bg-muted px-2 py-1 rounded font-mono break-all max-w-[150px]">
                              {user.user_id.slice(0, 8)}...
                            </code>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 shrink-0"
                              onClick={() => copyToClipboard(user.user_id)}
                            >
                              {copiedId === user.user_id ? (
                                <Check className="w-3 h-3 text-primary" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeClass(user.role)}`}>
                            {getRoleIcon(user.role)}
                            {user.role}
                          </span>
                        </TableCell>
                        <TableCell>
                          {getSubBadge(user)}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                          {new Date(user.created_at).toLocaleDateString('de-DE')}
                        </TableCell>
                        {isOwner && (
                          <TableCell>
                            <Select
                              value={user.role}
                              onValueChange={(value) => updateUserRole(user.user_id, value as AppRole)}
                              disabled={updating === user.user_id}
                            >
                              <SelectTrigger className="w-24">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="user">User</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="owner">Owner</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                        )}
                        {isOwner && (
                          <TableCell>
                            <Select
                              value={getUserSubscriptionType(user)}
                              onValueChange={(value) => updateSubscription(user.user_id, value as SubscriptionType)}
                              disabled={updatingSub === user.user_id}
                            >
                              <SelectTrigger className="w-28">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">Free</SelectItem>
                                <SelectItem value="premium">Premium</SelectItem>
                                <SelectItem value="lifetime">Lifetime</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                        )}
                        {isOwner && (
                          <TableCell>
                            {user.role !== "owner" ? (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                    disabled={deletingUser === user.user_id}
                                  >
                                    {deletingUser === user.user_id ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <Trash2 className="w-4 h-4" />
                                    )}
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Nutzer löschen?</AlertDialogTitle>
                                    <AlertDialogDescription className="space-y-2">
                                      <p>
                                        Möchtest du das Konto von <strong>{user.display_name || user.email || 'diesem Nutzer'}</strong> wirklich löschen?
                                      </p>
                                      <p className="text-destructive font-medium">
                                        Diese Aktion löscht alle Daten unwiderruflich!
                                      </p>
                                      <p>
                                        Der Nutzer kann sich danach mit derselben E-Mail-Adresse neu registrieren.
                                      </p>
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => deleteUser(user.user_id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Endgültig löschen
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            ) : (
                              <span className="text-xs text-muted-foreground">-</span>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {!isOwner && (
          <p className="text-center text-sm text-muted-foreground mt-4">
            Nur Owner können Nutzerrollen und Abos ändern
          </p>
        )}
      </main>
    </div>
  );
}